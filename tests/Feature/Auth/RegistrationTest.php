<?php

use App\Models\User;
use Laravel\Fortify\Features;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
    $this->seed(\Database\Seeders\RoleSeeder::class);
});

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register as a brand', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Brand User',
        'email' => 'brand@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => 'brand',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));

    $user = User::where('email', 'brand@example.com')->first();
    expect($user->hasRole('brand'))->toBeTrue();
});

test('new users can register as a creator', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Creator User',
        'email' => 'creator@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => 'creator',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));

    $user = User::where('email', 'creator@example.com')->first();
    expect($user->hasRole('creator'))->toBeTrue();
});

test('registration requires a valid role', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => 'admin',
    ]);

    $response->assertSessionHasErrors('role');
    $this->assertGuest();
});

test('registration fails without a role', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertSessionHasErrors('role');
    $this->assertGuest();
});