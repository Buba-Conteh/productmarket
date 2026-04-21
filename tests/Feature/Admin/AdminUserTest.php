<?php

declare(strict_types=1);

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleSeeder::class);
});

function makeAdmin(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('admin');

    return $user;
}

function makeRegularUser(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('brand');

    return $user;
}

test('admin can list users', function () {
    $admin = makeAdmin();
    User::factory(5)->create();

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/index')
            ->has('users.data')
            ->has('filters')
        );
});

test('non-admin cannot list users', function () {
    $user = makeRegularUser();
    $user->brandProfile()->create([
        'company_name' => 'Test Co',
        'onboarding_completed_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('admin.users.index'))
        ->assertForbidden();
});

test('admin can filter users by search', function () {
    $admin = makeAdmin();
    User::factory()->create(['name' => 'Alice Brand', 'email' => 'alice@example.com']);
    User::factory()->create(['name' => 'Bob Smith', 'email' => 'bob@example.com']);

    $this->actingAs($admin)
        ->get(route('admin.users.index', ['search' => 'Alice']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/users/index')
            ->where('users.data.0.name', 'Alice Brand')
            ->where('users.total', 1)
        );
});

test('admin can suspend a user', function () {
    $admin = makeAdmin();
    $target = makeRegularUser();

    $this->actingAs($admin)
        ->patch(route('admin.users.update-status', $target), ['status' => 'suspended'])
        ->assertRedirect();

    expect($target->fresh()->status)->toBe('suspended');
});

test('admin can ban a user', function () {
    $admin = makeAdmin();
    $target = makeRegularUser();

    $this->actingAs($admin)
        ->patch(route('admin.users.update-status', $target), ['status' => 'banned'])
        ->assertRedirect();

    expect($target->fresh()->status)->toBe('banned');
});

test('admin can reactivate a user', function () {
    $admin = makeAdmin();
    $target = User::factory()->create([
        'email_verified_at' => now(),
        'status' => 'suspended',
    ]);
    $target->assignRole('brand');

    $this->actingAs($admin)
        ->patch(route('admin.users.update-status', $target), ['status' => 'active'])
        ->assertRedirect();

    expect($target->fresh()->status)->toBe('active');
});

test('admin cannot change their own status', function () {
    $admin = makeAdmin();

    $this->actingAs($admin)
        ->patch(route('admin.users.update-status', $admin), ['status' => 'suspended'])
        ->assertRedirect();

    // Status should remain unchanged.
    expect($admin->fresh()->status)->toBe('active');
});

test('status update rejects invalid status values', function () {
    $admin = makeAdmin();
    $target = makeRegularUser();

    $this->actingAs($admin)
        ->patch(route('admin.users.update-status', $target), ['status' => 'deleted'])
        ->assertSessionHasErrors('status');
});
