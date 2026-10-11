<?php

declare(strict_types=1);

use App\Models\CreatorProfile;
use App\Models\Platform;
use App\Models\SocialAccount;
use App\Models\User;
use App\Services\Social\PlatformProviderFactory;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    config(['social_oauth.sync.stub_mode' => true]);
});

function availabilityCreator(bool $onboarded = false): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('creator');

    CreatorProfile::create([
        'user_id' => $user->id,
        'display_name' => 'Availability Creator',
        'stripe_connect_status' => 'pending',
        'total_earned' => 0,
        'pending_earnings' => 0,
        'onboarding_completed_at' => $onboarded ? now() : null,
    ]);

    return $user;
}

test('only tiktok is enabled by default', function () {
    expect(app(PlatformProviderFactory::class)->enabledPlatforms())->toBe(['tiktok']);
});

test('platforms can be enabled through config', function () {
    config(['social_oauth.enabled_platforms' => ['tiktok', 'youtube']]);

    $factory = app(PlatformProviderFactory::class);

    expect($factory->isEnabled('tiktok'))->toBeTrue()
        ->and($factory->isEnabled('youtube'))->toBeTrue()
        ->and($factory->isEnabled('youtube-shorts'))->toBeTrue()
        ->and($factory->isEnabled('instagram'))->toBeFalse();
});

test('a disabled platform cannot be newly connected', function () {
    $user = availabilityCreator();

    $this->actingAs($user)
        ->get(route('creator.social.connect', ['platform' => 'instagram']))
        ->assertRedirect(route('onboarding.creator.social'))
        ->assertSessionHasErrors('platform');
});

test('an enabled platform still starts the oauth flow', function () {
    $user = availabilityCreator();

    $response = $this->actingAs($user)
        ->get(route('creator.social.connect', ['platform' => 'tiktok']));

    expect($response->headers->get('Location'))->toContain('tiktok.com');
});

test('a disabled platform callback does not create an account', function () {
    $user = availabilityCreator();

    $this->actingAs($user)
        ->get(route('creator.social.callback', ['platform' => 'instagram']).'?code=abc&state=x')
        ->assertRedirect(route('onboarding.creator.social'))
        ->assertSessionHasErrors('platform');

    expect(SocialAccount::where('user_id', $user->id)->count())->toBe(0);
});

test('an existing connection to a disabled platform can still be disconnected', function () {
    $user = availabilityCreator(onboarded: true);

    $platform = Platform::firstOrCreate(
        ['slug' => 'instagram'],
        ['name' => 'Instagram', 'is_active' => true, 'sort_order' => 2],
    );

    SocialAccount::create([
        'user_id' => $user->id,
        'platform_id' => $platform->id,
        'handle' => 'old_connection',
        'platform_user_id' => 'ig_1',
        'oauth_token' => 'token',
        'follower_count' => 10,
        'verified' => true,
    ]);

    $this->actingAs($user)
        ->delete(route('creator.social.disconnect', ['platform' => 'instagram']))
        ->assertRedirect();

    expect(SocialAccount::where('user_id', $user->id)->count())->toBe(0);
});

test('the onboarding and settings pages receive the enabled platforms', function () {
    $onboarding = availabilityCreator();

    $this->actingAs($onboarding)
        ->get(route('onboarding.creator.social'))
        ->assertInertia(fn ($page) => $page
            ->component('onboarding/creator/social')
            ->where('enabledPlatforms', ['tiktok']));

    $onboarded = availabilityCreator(onboarded: true);

    $this->actingAs($onboarded)
        ->get(route('social-accounts.edit'))
        ->assertInertia(fn ($page) => $page
            ->component('settings/social-accounts')
            ->where('enabledPlatforms', ['tiktok']));
});
