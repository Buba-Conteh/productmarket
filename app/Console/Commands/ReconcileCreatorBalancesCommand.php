<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\CreatorProfile;
use App\Services\CreatorWalletService;
use App\Services\PayoutService;
use Illuminate\Console\Command;

/**
 * Brings the denormalized creator balances (total_earned, pending_earnings)
 * back in line with the payouts table, which is what the wallet displays.
 *
 * Read-only by default. Pass --fix to write the corrected values and to
 * release payouts held for creators whose payout account is already active.
 */
final class ReconcileCreatorBalancesCommand extends Command
{
    protected $signature = 'payouts:reconcile-balances
        {--fix : Write corrected balances and release held payouts for active accounts}';

    protected $description = 'Compare creator balance columns with their payout rows and optionally correct them.';

    public function handle(CreatorWalletService $wallet, PayoutService $payoutService): int
    {
        $fix = (bool) $this->option('fix');
        $rows = [];
        $released = 0;

        CreatorProfile::query()
            ->where(fn ($q) => $q
                ->whereHas('payouts')
                ->orWhere('pending_earnings', '!=', 0)
                ->orWhere('total_earned', '!=', 0))
            ->chunkById(100, function ($creators) use ($wallet, $payoutService, $fix, &$rows, &$released): void {
                foreach ($creators as $creator) {
                    if ($fix && $creator->canReceivePayouts()) {
                        $released += $payoutService->releaseHeldPayouts($creator);
                        $creator->refresh();
                    }

                    $summary = $wallet->summary($creator);

                    $storedEarned = number_format((float) $creator->total_earned, 2, '.', '');
                    $storedPending = number_format((float) $creator->pending_earnings, 2, '.', '');

                    if ($storedEarned === $summary->totalEarned && $storedPending === $summary->pending) {
                        continue;
                    }

                    $rows[] = [
                        $creator->display_name,
                        $creator->stripe_connect_id ? $creator->stripe_connect_status : 'not connected',
                        "{$storedEarned} → {$summary->totalEarned}",
                        "{$storedPending} → {$summary->pending}",
                    ];

                    if ($fix) {
                        $creator->update([
                            'total_earned' => $summary->totalEarned,
                            'pending_earnings' => $summary->pending,
                        ]);
                    }
                }
            });

        if ($rows === []) {
            $this->info('All creator balances match their payouts.');
        } else {
            $this->table(['Creator', 'Payout account', 'total_earned', 'pending_earnings'], $rows);
            $this->line(count($rows).' creator(s) '.($fix ? 'corrected.' : 'out of sync. Re-run with --fix to correct.'));
            $this->warn('Note: referral bonuses granted before Oct 2026 were added to pending_earnings without a payout row; correcting removes them from that column.');
        }

        if ($fix) {
            $this->info("{$released} pending payout(s) queued for creators with an active payout account.");
        }

        return self::SUCCESS;
    }
}
