<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\BrandProfile;
use App\Models\Campaign;
use App\Models\CampaignContestDetail;
use App\Models\CreatorProfile;
use App\Models\Entry;
use App\Models\EscrowTransaction;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Services\EntryService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;
use Stripe\StripeClient;
use Throwable;

/**
 * Manual end-to-end test: proves real funds move from the platform/brand
 * escrow to a creator via Stripe Connect when a contest is completed.
 *
 * Runs against Stripe TEST mode only. Seeds a throwaway contest scenario,
 * selects a winner (which fires ProcessPayoutJob -> real Stripe transfer),
 * reports before/after balances, then removes the seeded DB rows.
 */
final class VerifyPayoutFlowCommand extends Command
{
    protected $signature = 'payout:verify-flow
        {--prize=1000 : Contest prize amount in USD}
        {--connect= : Reuse an existing test Connect account ID (acct_...) instead of creating one}';

    protected $description = 'Drive the real contest payout flow against Stripe test mode and report fund movement.';

    public function handle(EntryService $entryService): int
    {
        $stripe = new StripeClient(config('cashier.secret'));

        // Safety: never run against live Stripe.
        if (! str_starts_with((string) config('cashier.secret'), 'sk_test_')) {
            $this->error('Refusing to run: STRIPE_SECRET is not a test key (sk_test_).');

            return self::FAILURE;
        }

        // Fake notifications/broadcasts so the queued PayoutProcessed notification
        // does not depend on mail/Reverb config. Money flow is unaffected.
        Notification::fake();

        // Run ProcessPayoutJob inline so the real transfer happens during this command.
        config(['queue.default' => 'sync']);

        $prize = number_format((float) $this->option('prize'), 2, '.', '');

        if (config('queue.default') === 'database') {
            $this->comment('Note: this command forces sync queue processing. On staging, a queue worker / Horizon must be running for ProcessPayoutJob to fire.');
        }

        $created = [];
        try {
            $reuse = $this->option('connect');
            if ($reuse) {
                $this->info("1) Verifying existing Connect account {$reuse}...");
                $connectId = $this->verifyConnectedAccount($stripe, (string) $reuse);
            } else {
                $this->info('1) Creating a verified test Connect account...');
                $connectId = $this->createTestConnectedAccount($stripe);
            }
            $this->line("   connect account: {$connectId}");

            $this->info('2) Seeding throwaway contest scenario...');
            [$entry, $campaign, $escrow, $creator] = $this->seedScenario($connectId, $prize);
            $created = compact('entry', 'campaign', 'escrow', 'creator');

            $balanceBefore = $this->availableUsd($stripe);
            $minPayout = (float) PlatformSetting::current()->min_creator_payout;

            $this->newLine();
            $this->line('--- BEFORE ---');
            $this->line("   platform available balance: \${$this->money($balanceBefore)}");
            $this->line("   creator pending_earnings:   \${$creator->pending_earnings}");
            $this->line("   creator total_earned:       \${$creator->total_earned}");
            $this->line("   escrow total_released:      \${$escrow->total_released}");
            $this->line("   min_creator_payout setting: \${$this->money((int) round($minPayout * 100))}");

            // Pre-check: transfers draw from the platform's AVAILABLE balance.
            $expectedNet = (int) round(((float) $prize * 0.85) * 100);
            if ($balanceBefore < $expectedNet) {
                $this->warn("   ⚠ platform available balance (\${$this->money($balanceBefore)}) is below the expected net payout (\${$this->money($expectedNet)}). The transfer will likely fail with insufficient funds.");
            }

            $this->newLine();
            $this->info('3) Completing the contest (selecting winner -> payout -> Stripe transfer)...');
            $entryService->selectContestWinner($campaign->fresh(), $entry->fresh());

            $creator->refresh();
            $escrow->refresh();
            $payout = $campaign->payouts()->where('payout_type', 'contest_prize')->first();
            $balanceAfter = $this->availableUsd($stripe);

            $this->newLine();
            $this->line('--- AFTER ---');
            $this->line("   payout status:              {$payout?->status}");
            $this->line("   payout gross / fee / net:   \${$payout?->gross_amount} / \${$payout?->platform_fee} / \${$payout?->net_amount}");
            $this->line("   stripe_transfer_id:         {$payout?->stripe_transfer_id}");
            $this->line("   creator pending_earnings:   \${$creator->pending_earnings}");
            $this->line("   creator total_earned:       \${$creator->total_earned}");
            $this->line("   escrow total_released:      \${$escrow->total_released}");
            $this->line("   platform available balance: \${$this->money($balanceAfter)} (delta \${$this->money($balanceAfter - $balanceBefore)})");

            $this->newLine();
            if ($payout?->status === 'paid' && $payout->stripe_transfer_id) {
                // Confirm the transfer landed on the connected account.
                $transfer = $stripe->transfers->retrieve($payout->stripe_transfer_id);
                $this->info('✅ FUNDS MOVED: Stripe transfer '.$transfer->id.' of $'.$this->money($transfer->amount).' -> '.$transfer->destination);
                $result = self::SUCCESS;
            } else {
                $reason = $payout?->failure_reason ?? '(payout held — likely below min_creator_payout, or not created)';
                $this->error('❌ Funds did NOT move. Payout status: '.($payout?->status ?? 'none').' — '.$reason);
                $result = self::FAILURE;
            }
        } catch (Throwable $e) {
            $this->error('Error: '.$e->getMessage());
            $result = self::FAILURE;
        } finally {
            $this->newLine();
            $this->info('4) Cleaning up seeded DB rows...');
            $this->cleanup($created);
        }

        return $result;
    }

    /**
     * Create a Custom connected account pre-filled with Stripe test data so the
     * transfers capability activates immediately in test mode.
     */
    private function createTestConnectedAccount(StripeClient $stripe): string
    {
        $account = $stripe->accounts->create([
            'type' => 'custom',
            'country' => 'US',
            'email' => 'payout-test+'.uniqid().'@example.com',
            'business_type' => 'individual',
            'capabilities' => ['transfers' => ['requested' => true]],
            'business_profile' => [
                'mcc' => '5734',
                'url' => 'https://accessible.stripe.com',
                'product_description' => 'Content creation',
            ],
            'individual' => [
                'first_name' => 'Test',
                'last_name' => 'Creator',
                'email' => 'payout-test+'.uniqid().'@example.com',
                'phone' => '+15555555555',
                'dob' => ['day' => 1, 'month' => 1, 'year' => 1990],
                'ssn_last_4' => '0000',
                'id_number' => '000000000',
                'address' => [
                    'line1' => 'address_full_match',
                    'city' => 'South San Francisco',
                    'state' => 'CA',
                    'postal_code' => '94080',
                    'country' => 'US',
                ],
            ],
            'external_account' => [
                'object' => 'bank_account',
                'country' => 'US',
                'currency' => 'usd',
                'routing_number' => '110000000',
                'account_number' => '000123456789',
            ],
            'tos_acceptance' => [
                'date' => time(),
                'ip' => '127.0.0.1',
            ],
        ]);

        // In test mode the capability is usually active immediately; poll briefly.
        for ($i = 0; $i < 5; $i++) {
            $fresh = $stripe->accounts->retrieve($account->id);
            if (($fresh->capabilities->transfers ?? null) === 'active') {
                break;
            }
            usleep(500_000);
        }

        return $account->id;
    }

    /**
     * Verify an existing connected account is ready to receive transfers.
     * Aborts (throws) if the transfers capability is not active.
     */
    private function verifyConnectedAccount(StripeClient $stripe, string $accountId): string
    {
        $account = $stripe->accounts->retrieve($accountId);
        $transfers = $account->capabilities->transfers ?? 'inactive';

        if ($transfers !== 'active') {
            throw new \RuntimeException(
                "Connect account {$accountId} cannot receive transfers (transfers capability: {$transfers}). ".
                'Complete onboarding so stripe_connect_status is active.'
            );
        }

        return $account->id;
    }

    /**
     * @return array{0: Entry, 1: Campaign, 2: EscrowTransaction, 3: CreatorProfile}
     */
    private function seedScenario(string $connectId, string $prize): array
    {
        $brandUser = User::factory()->create(['name' => 'Payout Test Brand']);
        $brand = BrandProfile::create([
            'user_id' => $brandUser->id,
            'company_name' => 'Payout Test Co',
        ]);

        $creatorUser = User::factory()->create(['name' => 'Payout Test Creator']);
        $creator = CreatorProfile::create([
            'user_id' => $creatorUser->id,
            'display_name' => 'Payout Test Creator',
            'stripe_connect_id' => $connectId,
            'stripe_connect_status' => 'active',
            'total_earned' => 0,
            'pending_earnings' => 0,
        ]);

        $campaign = Campaign::create([
            'brand_profile_id' => $brand->id,
            'type' => 'contest',
            'title' => 'Payout Verification Contest',
            'brief' => 'Throwaway scenario for payout verification.',
            'platform_fee_pct' => 15.00,
            'status' => 'active',
            'published_at' => now(),
        ]);

        CampaignContestDetail::create([
            'campaign_id' => $campaign->id,
            'prize_amount' => $prize,
        ]);

        $escrow = EscrowTransaction::create([
            'campaign_id' => $campaign->id,
            'brand_profile_id' => $brand->id,
            'total_held' => $prize,
            'total_released' => 0,
            'total_refunded' => 0,
            'stripe_payment_intent_id' => 'pi_test_'.uniqid(),
            'status' => 'held',
            'held_at' => now(),
        ]);

        $entry = Entry::create([
            'campaign_id' => $campaign->id,
            'creator_profile_id' => $creator->id,
            'type' => 'contest',
            'caption' => 'Winning entry',
            'requirements_acknowledged' => true,
            'status' => 'pending_review',
            'submitted_at' => now(),
        ]);

        return [$entry, $campaign, $escrow, $creator->fresh()];
    }

    private function availableUsd(StripeClient $stripe): int
    {
        $balance = $stripe->balance->retrieve();
        foreach ($balance->available as $item) {
            if ($item->currency === 'usd') {
                return (int) $item->amount;
            }
        }

        return 0;
    }

    private function money(int $cents): string
    {
        return number_format($cents / 100, 2, '.', '');
    }

    /**
     * @param  array<string, mixed>  $created
     */
    private function cleanup(array $created): void
    {
        try {
            /** @var Entry|null $entry */
            $entry = $created['entry'] ?? null;
            /** @var Campaign|null $campaign */
            $campaign = $created['campaign'] ?? null;
            /** @var EscrowTransaction|null $escrow */
            $escrow = $created['escrow'] ?? null;
            /** @var CreatorProfile|null $creator */
            $creator = $created['creator'] ?? null;

            $campaign?->payouts()->delete();
            $entry?->rippleEarnings()->delete();
            $entry?->delete();
            $escrow?->delete();
            $campaign?->contestDetails()->delete();
            $brandProfileId = $campaign?->brand_profile_id;
            $campaign?->delete();

            $creatorUserId = $creator?->user_id;
            $creator?->delete();

            if ($brandProfileId) {
                $brand = BrandProfile::find($brandProfileId);
                $brandUserId = $brand?->user_id;
                $brand?->delete();
                if ($brandUserId) {
                    User::whereKey($brandUserId)->delete();
                }
            }
            if ($creatorUserId) {
                User::whereKey($creatorUserId)->delete();
            }

            $this->line('   done.');
        } catch (Throwable $e) {
            $this->warn('   cleanup warning: '.$e->getMessage());
        }
    }
}
