<?php

declare(strict_types=1);

use App\Models\CreatorProfile;
use App\Models\Platform;
use App\Models\SocialAccount;
use App\Models\User;
use App\Services\Social\SocialAccountService;
use Database\Seeders\PlatformSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->seed(PlatformSeeder::class);

    // Providers run against their stub responses rather than the live APIs.
    config(['social_oauth.sync.stub_mode' => true]);
});

function creatorWithProfile(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('creator');

    CreatorProfile::create([
        'user_id' => $user->id,
        'display_name' => 'Metrics Creator',
        'stripe_connect_status' => 'pending',
        'total_earned' => 0,
        'pending_earnings' => 0,
        'onboarding_completed_at' => now(),
    ]);

    return $user;
}

function connectAccount(User $user, string $slug, array $overrides = []): SocialAccount
{
    $platform = Platform::where('slug', $slug)->firstOrFail();

    return SocialAccount::create(array_merge([
        'user_id' => $user->id,
        'platform_id' => $platform->id,
        'handle' => "{$slug}_creator",
        'platform_user_id' => "{$slug}_123",
        'oauth_token' => 'stub-access-token',
        'oauth_refresh_token' => 'stub-refresh-token',
        'follower_count' => 100,
        'avg_views' => 50,
        'total_likes' => 200,
        'post_count' => 5,
        'engagement_rate' => 1.5,
        'verified' => true,
        'last_synced_at' => now()->subDays(3),
    ], $overrides));
}

test('connecting an account stores the metrics queried from the platform', function () {
    $user = creatorWithProfile();

    $account = app(SocialAccountService::class)->connect($user, 'tiktok', 'stub-auth-code');

    expect($account->handle)->toBe('tiktok_creator_stub')
        ->and($account->follower_count)->toBe(12500)
        ->and($account->total_likes)->toBe(348000)
        ->and($account->post_count)->toBe(142)
        ->and($account->verified)->toBeTrue()
        ->and($account->last_synced_at)->not->toBeNull();
});

test('syncStats re-queries the platform and refreshes stored metrics', function () {
    $user = creatorWithProfile();
    $account = connectAccount($user, 'tiktok');

    $synced = app(SocialAccountService::class)->syncStats($account);

    expect($synced)->toBeTrue();

    $account->refresh();

    expect($account->follower_count)->toBe(12500)
        ->and($account->total_likes)->toBe(348000)
        ->and($account->post_count)->toBe(142)
        ->and($account->last_synced_at->isToday())->toBeTrue();
});

test('syncStats keeps the last known value for metrics the platform omits', function () {
    $user = creatorWithProfile();
    // Instagram's profile endpoint exposes no total likes, so a previously
    // known value must survive the sync rather than being blanked.
    $account = connectAccount($user, 'instagram', ['total_likes' => 4200]);

    app(SocialAccountService::class)->syncStats($account);

    $account->refresh();

    expect($account->post_count)->toBe(96)
        ->and($account->total_likes)->toBe(4200);
});

test('a creator can refresh a connected account from settings', function () {
    $user = creatorWithProfile();
    connectAccount($user, 'tiktok', ['follower_count' => 10]);

    $this->actingAs($user)
        ->post(route('creator.social.refresh', ['platform' => 'tiktok']))
        ->assertRedirect();

    expect(SocialAccount::where('user_id', $user->id)->first()->follower_count)->toBe(12500);
});

test('refreshing a platform that is not connected 404s', function () {
    $user = creatorWithProfile();

    $this->actingAs($user)
        ->post(route('creator.social.refresh', ['platform' => 'youtube']))
        ->assertNotFound();
});

test('the public profile lists every connected account with its metrics', function () {
    $user = creatorWithProfile();
    connectAccount($user, 'tiktok');
    // Instagram Basic Display never reports verified, and used to be filtered
    // out of the profile entirely.
    connectAccount($user, 'instagram', ['verified' => false]);

    $profile = $user->creatorProfile;

    $this->actingAs($user)
        ->get(route('profiles.creator.show', $profile))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('profiles/creator/show')
            ->has('creator.social_accounts', 2)
            ->where('creator.social_accounts.0.total_likes', 200)
            ->where('creator.social_accounts.0.post_count', 5)
        );
});

test('the settings page shows the account as connected with its metrics', function () {
    $user = creatorWithProfile();
    connectAccount($user, 'tiktok');

    $this->actingAs($user)
        ->get(route('social-accounts.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/social-accounts')
            ->has('socialAccounts', 1)
            ->where('socialAccounts.0.handle', 'tiktok_creator')
            ->where('socialAccounts.0.follower_count', 100)
            ->where('socialAccounts.0.total_likes', 200)
            ->where('socialAccounts.0.post_count', 5)
            ->where('socialAccounts.0.verified', true)
        );
});
