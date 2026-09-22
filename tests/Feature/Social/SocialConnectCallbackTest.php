<?php

declare(strict_types=1);

use App\Models\CreatorProfile;
use App\Models\User;
use App\Services\Social\PlatformProviderFactory;
use Database\Seeders\PlatformSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->seed(PlatformSeeder::class);

    config([
        'social_oauth.sync.stub_mode' => true,
        'social_oauth.tiktok.client_key' => 'test-key',
        'social_oauth.tiktok.client_secret' => 'test-secret',
    ]);
});

function onboardedCreator(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('creator');

    CreatorProfile::create([
        'user_id' => $user->id,
        'display_name' => 'Callback Creator',
        'stripe_connect_status' => 'pending',
        'total_earned' => 0,
        'pending_earnings' => 0,
        'onboarding_completed_at' => now(),
    ]);

    return $user;
}

test('the authorization url points at the connect callback, not the login callback', function () {
    $url = app(PlatformProviderFactory::class)->make('tiktok')->getAuthorizationUrl('some-state');

    parse_str((string) parse_url($url, PHP_URL_QUERY), $query);

    expect($query['redirect_uri'])
        ->toBe(route('creator.social.callback', ['platform' => 'tiktok']))
        ->and($query['redirect_uri'])->toContain('/creator/social/tiktok/callback')
        // The login callback lives behind `guest` middleware; sending an
        // authenticated creator there bounces them to the dashboard.
        ->and($query['redirect_uri'])->not->toContain('/auth/tiktok/callback');
});

test('the connect callback route is reachable by an authenticated creator', function () {
    $user = onboardedCreator();

    // The bug: the login callback bounces an authenticated user to the dashboard.
    $this->actingAs($user)
        ->get('/auth/tiktok/callback?code=x&state=y')
        ->assertRedirect(route('dashboard'));

    // The connect callback actually runs its controller (419 here because no
    // state was seeded, which proves the controller was entered).
    $this->actingAs($user)
        ->get(route('creator.social.callback', ['platform' => 'tiktok']).'?code=x&state=y')
        ->assertStatus(419);
});

test('a successful connect returns the creator to where they started', function () {
    $user = onboardedCreator();

    $this->actingAs($user)
        ->from(route('social-accounts.edit'))
        ->get(route('creator.social.connect', ['platform' => 'tiktok']))
        ->assertRedirectContains('tiktok.com');

    $state = session('social_oauth_state_tiktok');

    $this->actingAs($user)
        ->get(route('creator.social.callback', ['platform' => 'tiktok'])."?code=abc&state={$state}")
        ->assertRedirect(route('social-accounts.edit'));

    $this->assertDatabaseHas('social_accounts', [
        'user_id' => $user->id,
        'handle' => 'tiktok_creator_stub',
    ]);
});

test('a stale intended url does not divert the creator to the dashboard', function () {
    $user = onboardedCreator();

    $this->actingAs($user)
        ->from(route('social-accounts.edit'))
        ->get(route('creator.social.connect', ['platform' => 'tiktok']));

    $state = session('social_oauth_state_tiktok');

    // Something earlier in the session parked an intended url.
    session()->put('url.intended', route('dashboard'));

    $this->actingAs($user)
        ->get(route('creator.social.callback', ['platform' => 'tiktok'])."?code=abc&state={$state}")
        ->assertRedirect(route('social-accounts.edit'));
});
