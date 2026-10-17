<?php

declare(strict_types=1);

use App\Jobs\ProcessPayoutJob;
use App\Models\CreatorProfile;
use App\Models\Payout;
use App\Models\PlatformSetting;
use App\Models\Referral;
use App\Models\User;
use App\Services\ReferralService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    config(['cashier.secret' => 'sk_test_fake']);
    PlatformSetting::current()->update([
        'referral_creator_bonus' => 10.00,
        'referral_brand_credit' => 25.00,
    ]);
});

function referrerCreator(): User
{
    $user = User::factory()->create(['referral_code' => 'CREATOR1']);
    $user->assignRole('creator');

    CreatorProfile::create([
        'user_id' => $user->id,
        'display_name' => 'Referrer',
        'stripe_connect_status' => 'pending',
        'total_earned' => 0,
        'pending_earnings' => 0,
        'onboarding_completed_at' => now(),
    ]);

    return $user;
}

function pendingReferral(User $referrer, string $type): User
{
    $referred = User::factory()->create();
    $referred->assignRole($type);
    app(ReferralService::class)->attachReferral($referred, $referrer->referral_code, $type);

    return $referred;
}

test('a creator referral bonus becomes a real payout', function () {
    Queue::fake();
    $referrer = referrerCreator();
    $referred = pendingReferral($referrer, 'creator');

    app(ReferralService::class)->qualify($referred);

    $referral = Referral::where('referred_user_id', $referred->id)->first();
    $payout = Payout::where('referral_id', $referral->id)->first();

    expect($referral->status)->toBe('rewarded')
        ->and($payout)->not->toBeNull()
        ->and($payout->payout_type)->toBe('referral_bonus')
        ->and($payout->net_amount)->toBe('10.00')
        ->and($payout->platform_fee)->toBe('0.00')
        ->and($payout->entry_id)->toBeNull()
        ->and((float) $referrer->creatorProfile->fresh()->pending_earnings)->toBe(10.0);

    Queue::assertPushed(ProcessPayoutJob::class, fn ($job) => $job->payoutId === $payout->id);
});

test('qualifying twice never pays twice', function () {
    Queue::fake();
    $referrer = referrerCreator();
    $referred = pendingReferral($referrer, 'creator');

    app(ReferralService::class)->qualify($referred);
    app(ReferralService::class)->qualify($referred);

    expect(Payout::where('payout_type', 'referral_bonus')->count())->toBe(1)
        ->and((float) $referrer->creatorProfile->fresh()->pending_earnings)->toBe(10.0);
});

test('a creator who refers a brand is still rewarded', function () {
    Queue::fake();
    $referrer = referrerCreator();
    $referred = pendingReferral($referrer, 'brand');

    app(ReferralService::class)->qualify($referred);

    expect(Referral::where('referred_user_id', $referred->id)->value('status'))->toBe('rewarded')
        ->and(Payout::where('payout_type', 'referral_bonus')->count())->toBe(1);
});

test('a referral with no reward possible stays qualified, not rewarded', function () {
    // A brand with no Stripe customer cannot receive a balance credit.
    $referrer = User::factory()->create(['referral_code' => 'BRAND001']);
    $referrer->assignRole('brand');
    $referred = pendingReferral($referrer, 'brand');

    app(ReferralService::class)->qualify($referred);

    expect(Referral::where('referred_user_id', $referred->id)->value('status'))->toBe('qualified');
});

test('a ref code in the url is attached for social signups', function () {
    $referrer = referrerCreator();

    $this->get('/register?ref=creator1');
    expect(session(ReferralService::SESSION_KEY))->toBe('CREATOR1');

    $socialUser = (new SocialiteUser)->map(['id' => 'g-1', 'name' => 'Google User', 'email' => 'g@example.com']);
    Socialite::shouldReceive('driver->user')->andReturn($socialUser);

    $this->get(route('social.callback', 'google'));

    $user = User::where('email', 'g@example.com')->first();
    expect($user->referral_code)->not->toBeNull();

    $this->actingAs($user)->post(route('role.select.store'), ['role' => 'creator']);

    expect(Referral::where('referred_user_id', $user->id)->value('referrer_user_id'))->toBe($referrer->id);
});

test('users without a referral code get one on the referrals page', function () {
    $user = User::factory()->create(['referral_code' => null]);
    $user->assignRole('creator');

    $this->actingAs($user)->get(route('referrals.index'))->assertOk();

    expect($user->fresh()->referral_code)->toMatch('/^[A-Z0-9]{8}$/');
});
