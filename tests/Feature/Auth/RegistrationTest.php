<?php

use App\Models\Referral;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Fortify\Features;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
    $this->seed(RoleSeeder::class);
});

function registrationPayload(array $overrides = []): array
{
    return array_merge([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'Str0ng!Passw0rd',
        'password_confirmation' => 'Str0ng!Passw0rd',
    ], $overrides);
}

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register without choosing a role', function () {
    $response = $this->post(route('register.store'), registrationPayload());

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));

    $user = User::where('email', 'test@example.com')->first();
    expect($user->hasSelectedRole())->toBeFalse();
});

test('a preferred role from the landing page is remembered for the role step', function () {
    $this->post(route('register.store'), registrationPayload(['preferred_role' => 'brand']));

    $user = User::where('email', 'test@example.com')->first();
    $user->markEmailAsVerified();

    $this->actingAs($user)
        ->get(route('role.select'))
        ->assertInertia(fn ($page) => $page
            ->component('auth/select-role')
            ->where('preselectedRole', 'brand'));
});

test('an invalid preferred role is ignored', function () {
    $this->post(route('register.store'), registrationPayload(['preferred_role' => 'admin']));

    $this->assertAuthenticated();
    expect(session()->has('preferred_role'))->toBeFalse();
});

test('the role is assigned on the role-select step', function () {
    $this->post(route('register.store'), registrationPayload());

    $user = User::where('email', 'test@example.com')->first();
    $user->markEmailAsVerified();

    $this->actingAs($user)
        ->post(route('role.select.store'), ['role' => 'creator'])
        ->assertRedirect(route('dashboard'));

    expect($user->fresh()->hasRole('creator'))->toBeTrue();
});

test('a referral code is attached once the role is chosen', function () {
    $referrer = User::factory()->create(['referral_code' => 'REFER123']);

    $this->post(route('register.store'), registrationPayload(['ref' => 'REFER123']));

    $user = User::where('email', 'test@example.com')->first();
    expect(Referral::where('referred_user_id', $user->id)->exists())->toBeFalse();

    $user->markEmailAsVerified();

    $this->actingAs($user)
        ->post(route('role.select.store'), ['role' => 'brand']);

    $referral = Referral::where('referred_user_id', $user->id)->first();
    expect($referral->referrer_user_id)->toBe($referrer->id)
        ->and($referral->type)->toBe('brand');
});

test('registration still requires a password confirmation', function () {
    $response = $this->post(route('register.store'), registrationPayload([
        'password_confirmation' => 'different',
    ]));

    $response->assertSessionHasErrors('password');
    $this->assertGuest();
});

test('an older client that still sends a role gets it assigned at signup', function () {
    $referrer = User::factory()->create(['referral_code' => 'LEGACY12']);

    $this->post(route('register.store'), registrationPayload([
        'role' => 'brand',
        'ref' => 'LEGACY12',
    ]));

    $user = User::where('email', 'test@example.com')->first();
    expect($user->hasRole('brand'))->toBeTrue()
        ->and(Referral::where('referred_user_id', $user->id)->value('referrer_user_id'))->toBe($referrer->id);
});

test('an invalid legacy role does not assign anything', function () {
    $this->post(route('register.store'), registrationPayload(['role' => 'admin']));

    $user = User::where('email', 'test@example.com')->first();
    expect($user->hasSelectedRole())->toBeFalse()
        ->and($user->hasRole('admin'))->toBeFalse();
});
