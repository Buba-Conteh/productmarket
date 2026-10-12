<?php

declare(strict_types=1);

use App\Jobs\ProcessPayoutJob;
use App\Models\BrandProfile;
use App\Models\Campaign;
use App\Models\CreatorProfile;
use App\Models\Entry;
use App\Models\Industry;
use App\Models\Payout;
use App\Models\User;
use App\Services\CreatorWalletService;
use App\Services\PayoutService;
use App\Services\StripeConnectService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Stripe\Account;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    config(['cashier.secret' => 'sk_test_fake']);
});

function payoutCreator(array $attributes = []): CreatorProfile
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('creator');

    return CreatorProfile::create([
        'user_id' => $user->id,
        'display_name' => 'Payout Creator',
        'stripe_connect_status' => 'pending',
        'total_earned' => 0,
        'pending_earnings' => 0,
        'onboarding_completed_at' => now(),
        ...$attributes,
    ]);
}

function payoutFor(CreatorProfile $creator, array $attributes = []): Payout
{
    $brandUser = User::factory()->create();
    $industry = Industry::firstOrCreate(['slug' => 'retail'], ['name' => 'Retail', 'is_active' => true, 'sort_order' => 1]);
    $brand = BrandProfile::create([
        'user_id' => $brandUser->id,
        'company_name' => 'Payout Co',
        'industry_id' => $industry->id,
        'onboarding_completed_at' => now(),
    ]);

    $campaign = Campaign::create([
        'brand_profile_id' => $brand->id,
        'type' => 'contest',
        'title' => 'Payout Campaign',
        'brief' => '<p>Brief</p>',
        'requirements' => [],
        'required_hashtags' => [],
        'target_regions' => [],
        'inspiration_links' => [],
        'platform_fee_pct' => 15,
        'status' => 'completed',
        'published_at' => now(),
    ]);

    $entry = Entry::create([
        'campaign_id' => $campaign->id,
        'creator_profile_id' => $creator->id,
        'type' => 'contest',
        'status' => 'won',
        'tags' => [],
    ]);

    return Payout::create([
        'entry_id' => $entry->id,
        'creator_profile_id' => $creator->id,
        'campaign_id' => $campaign->id,
        'gross_amount' => '100.00',
        'platform_fee' => '15.00',
        'net_amount' => '85.00',
        'payout_type' => 'contest_prize',
        'status' => 'pending',
        'retry_count' => 0,
        ...$attributes,
    ]);
}

function stripeAccount(string $id, bool $submitted, string $transfers): Account
{
    return Account::constructFrom([
        'id' => $id,
        'object' => 'account',
        'details_submitted' => $submitted,
        'capabilities' => ['transfers' => $transfers],
    ]);
}

it('holds a payout instead of failing it when the creator has no payout account', function () {
    $creator = payoutCreator(['pending_earnings' => 85]);
    $payout = payoutFor($creator);

    app(PayoutService::class)->executeTransfer($payout);
    app(PayoutService::class)->executeTransfer($payout->fresh());

    $payout->refresh();
    expect($payout->status)->toBe('pending')
        ->and($payout->retry_count)->toBe(0)
        ->and($payout->failure_reason)->toBe(Payout::AWAITING_ACCOUNT_REASON)
        ->and((float) $creator->fresh()->pending_earnings)->toBe(85.0);
});

it('releases held payouts and restores legacy failures when the account becomes active', function () {
    Queue::fake();

    $creator = payoutCreator(['stripe_connect_id' => 'acct_123', 'pending_earnings' => 85]);
    $held = payoutFor($creator, ['failure_reason' => Payout::AWAITING_ACCOUNT_REASON]);
    $legacy = payoutFor($creator, [
        'status' => 'failed',
        'retry_count' => 2,
        'failure_reason' => Payout::LEGACY_INACTIVE_ACCOUNT_REASON,
    ]);

    $status = app(StripeConnectService::class)
        ->applyAccountStatus($creator, stripeAccount('acct_123', true, 'active'));

    expect($status)->toBe('active')
        ->and($legacy->fresh()->status)->toBe('pending')
        ->and($legacy->fresh()->retry_count)->toBe(0)
        // The legacy failure had been subtracted from pending_earnings — it is added back.
        ->and((float) $creator->fresh()->pending_earnings)->toBe(170.0);

    Queue::assertPushed(ProcessPayoutJob::class, 2);
    Queue::assertPushed(ProcessPayoutJob::class, fn ($job) => $job->payoutId === $held->id);
});

it('marks an account restricted while Stripe still needs details', function () {
    $creator = payoutCreator(['stripe_connect_id' => 'acct_456']);

    $status = app(StripeConnectService::class)
        ->applyAccountStatus($creator, stripeAccount('acct_456', true, 'inactive'));

    expect($status)->toBe('restricted')
        ->and($creator->fresh()->stripe_connect_status)->toBe('restricted');
});

it('builds wallet figures that match the payout rows', function () {
    $creator = payoutCreator();
    payoutFor($creator, ['status' => 'paid', 'net_amount' => '85.00', 'paid_at' => now()]);
    payoutFor($creator, ['status' => 'pending', 'net_amount' => '42.50']);
    payoutFor($creator, ['status' => 'failed', 'net_amount' => '10.00']);

    $summary = app(CreatorWalletService::class)->summary($creator);

    expect($summary->totalEarned)->toBe('85.00')
        ->and($summary->pending)->toBe('42.50')
        ->and($summary->awaitingAccount)->toBe('42.50')
        ->and($summary->failed)->toBe('10.00')
        ->and($summary->paidCount)->toBe(1)
        ->and($summary->pendingCount)->toBe(1);
});

it('shows the same figures on the wallet page', function () {
    $creator = payoutCreator();
    payoutFor($creator, ['status' => 'paid', 'paid_at' => now()]);
    payoutFor($creator, ['status' => 'pending', 'failure_reason' => Payout::AWAITING_ACCOUNT_REASON]);

    $this->actingAs($creator->user)
        ->get('/wallet')
        ->assertInertia(fn ($page) => $page
            ->component('creator/earnings')
            ->where('total_earned', '85.00')
            ->where('pending_earnings', '85.00')
            ->where('awaiting_account', '85.00')
            ->where('stripe_connect_status', null)
            ->where('payouts.data', fn ($rows) => collect($rows)->firstWhere('status', 'pending')['awaiting_account'] === true
                && collect($rows)->firstWhere('status', 'paid')['awaiting_account'] === false));
});

it('lets an onboarded creator open the payout account settings page', function () {
    $creator = payoutCreator();

    $this->actingAs($creator->user)
        ->get('/settings/payout-account')
        ->assertInertia(fn ($page) => $page
            ->component('settings/payout-account')
            ->where('account.connected', false)
            ->where('account.status', null));
});

it('updates the account from a signed Connect webhook', function () {
    Queue::fake();
    config(['services.stripe.connect_webhook_secret' => 'whsec_test']);

    $creator = payoutCreator(['stripe_connect_id' => 'acct_789']);
    payoutFor($creator, ['failure_reason' => Payout::AWAITING_ACCOUNT_REASON]);

    $payload = json_encode([
        'id' => 'evt_1',
        'object' => 'event',
        'type' => 'account.updated',
        'data' => ['object' => [
            'id' => 'acct_789',
            'object' => 'account',
            'details_submitted' => true,
            'capabilities' => ['transfers' => 'active'],
        ]],
    ]);
    $timestamp = time();
    $signature = hash_hmac('sha256', "{$timestamp}.{$payload}", 'whsec_test');

    $this->call('POST', '/stripe/connect/webhook', [], [], [], [
        'HTTP_STRIPE_SIGNATURE' => "t={$timestamp},v1={$signature}",
        'CONTENT_TYPE' => 'application/json',
    ], $payload)->assertOk();

    expect($creator->fresh()->stripe_connect_status)->toBe('active');
    Queue::assertPushed(ProcessPayoutJob::class, 1);
});

it('rejects a Connect webhook with a bad signature', function () {
    config(['services.stripe.connect_webhook_secret' => 'whsec_test']);

    $this->call('POST', '/stripe/connect/webhook', [], [], [], [
        'HTTP_STRIPE_SIGNATURE' => 't=1,v1=bad',
        'CONTENT_TYPE' => 'application/json',
    ], '{}')->assertStatus(400);
});

it('lets an admin retry a failed payout', function () {
    Queue::fake();

    $admin = User::factory()->create(['email_verified_at' => now()]);
    $admin->assignRole('admin');

    $creator = payoutCreator(['stripe_connect_id' => 'acct_1', 'stripe_connect_status' => 'active']);
    $payout = payoutFor($creator, ['status' => 'failed', 'retry_count' => 2, 'failure_reason' => 'Insufficient funds']);

    $this->actingAs($admin)
        ->post("/admin/payouts/{$payout->id}/retry")
        ->assertRedirect();

    expect($payout->fresh()->status)->toBe('pending')
        ->and((float) $creator->fresh()->pending_earnings)->toBe(85.0);
    Queue::assertPushed(ProcessPayoutJob::class, 1);
});
