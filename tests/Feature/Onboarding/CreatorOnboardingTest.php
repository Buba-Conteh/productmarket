<?php

declare(strict_types=1);

use App\Models\Niche;
use App\Models\User;
use Database\Seeders\NicheSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->seed(NicheSeeder::class);
});

function createCreatorUser(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('creator');

    return $user;
}

test('un-onboarded creator is redirected from dashboard to onboarding', function () {
    $user = createCreatorUser();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirect(route('onboarding.creator.profile'));
});

test('creator can view profile step', function () {
    $user = createCreatorUser();

    $this->actingAs($user)
        ->get(route('onboarding.creator.profile'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('onboarding/creator/profile'));
});

test('creator can submit profile', function () {
    $user = createCreatorUser();

    $this->actingAs($user)
        ->post(route('onboarding.creator.profile.store'), [
            'display_name' => 'Cool Creator',
            'bio' => 'I make awesome content',
            'country' => 'US',
        ])
        ->assertRedirect(route('onboarding.creator.niches'));

    $this->assertDatabaseHas('creator_profiles', [
        'user_id' => $user->id,
        'display_name' => 'Cool Creator',
    ]);

    $user->refresh();
    expect($user->country)->toBe('US');
});

test('creator profile requires display name', function () {
    $user = createCreatorUser();

    $this->actingAs($user)
        ->post(route('onboarding.creator.profile.store'), [])
        ->assertSessionHasErrors(['display_name']);
});

test('creator can view niches step', function () {
    $user = createCreatorUser();
    $user->creatorProfile()->create(['display_name' => 'Test']);

    $this->actingAs($user)
        ->get(route('onboarding.creator.niches'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('onboarding/creator/niches')
            ->has('niches')
        );
});

test('creator niches redirects to profile if no profile exists', function () {
    $user = createCreatorUser();

    $this->actingAs($user)
        ->get(route('onboarding.creator.niches'))
        ->assertRedirect(route('onboarding.creator.profile'));
});

test('creator can submit niches', function () {
    $user = createCreatorUser();
    $user->creatorProfile()->create(['display_name' => 'Test']);

    $nicheIds = Niche::take(3)->pluck('id')->toArray();

    $this->actingAs($user)
        ->post(route('onboarding.creator.niches.store'), [
            'niches' => $nicheIds,
        ])
        ->assertRedirect(route('onboarding.creator.social'));

    expect($user->creatorProfile->niches)->toHaveCount(3);
});

test('creator must select at least one niche', function () {
    $user = createCreatorUser();
    $user->creatorProfile()->create(['display_name' => 'Test']);

    $this->actingAs($user)
        ->post(route('onboarding.creator.niches.store'), [
            'niches' => [],
        ])
        ->assertSessionHasErrors(['niches']);
});

test('creator cannot select more than 5 niches', function () {
    $user = createCreatorUser();
    $user->creatorProfile()->create(['display_name' => 'Test']);

    $nicheIds = Niche::take(6)->pluck('id')->toArray();

    $this->actingAs($user)
        ->post(route('onboarding.creator.niches.store'), [
            'niches' => $nicheIds,
        ])
        ->assertSessionHasErrors(['niches']);
});

test('creator can view social step', function () {
    $user = createCreatorUser();
    $user->creatorProfile()->create(['display_name' => 'Test']);

    $this->actingAs($user)
        ->get(route('onboarding.creator.social'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('onboarding/creator/social'));
});

test('creator can skip social and view payout step', function () {
    $user = createCreatorUser();
    $user->creatorProfile()->create(['display_name' => 'Test']);

    $this->actingAs($user)
        ->post(route('onboarding.creator.social.store'))
        ->assertRedirect(route('onboarding.creator.payout'));
});

test('creator can view payout step', function () {
    $user = createCreatorUser();
    $user->creatorProfile()->create(['display_name' => 'Test']);

    $this->actingAs($user)
        ->get(route('onboarding.creator.payout'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('onboarding/creator/payout'));
});

test('creator can complete onboarding', function () {
    $user = createCreatorUser();
    $user->creatorProfile()->create(['display_name' => 'Test']);

    $this->actingAs($user)
        ->post(route('onboarding.creator.complete'))
        ->assertRedirect(route('dashboard'));

    $user->refresh();
    expect($user->creatorProfile->onboarding_completed_at)->not->toBeNull();
});

test('onboarded creator can access dashboard', function () {
    $user = createCreatorUser();
    $user->creatorProfile()->create([
        'display_name' => 'Test',
        'onboarding_completed_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk();
});

test('onboarded creator is redirected from onboarding to dashboard', function () {
    $user = createCreatorUser();
    $user->creatorProfile()->create([
        'display_name' => 'Test',
        'onboarding_completed_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('onboarding.creator.profile'))
        ->assertRedirect(route('dashboard'));
});
