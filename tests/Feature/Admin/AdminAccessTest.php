<?php

declare(strict_types=1);

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleSeeder::class);
});

function createAdminUser(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('admin');

    return $user;
}

function createBrandUserForAdmin(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('brand');

    return $user;
}

function createCreatorUserForAdmin(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('creator');

    return $user;
}

test('guests are redirected from admin dashboard to login', function () {
    $this->get(route('admin.dashboard'))
        ->assertRedirect(route('login'));
});

test('brand users cannot access admin dashboard', function () {
    $user = createBrandUserForAdmin();
    $user->brandProfile()->create([
        'company_name' => 'Test Co',
        'onboarding_completed_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('admin.dashboard'))
        ->assertForbidden();
});

test('creator users cannot access admin dashboard', function () {
    $user = createCreatorUserForAdmin();
    $user->creatorProfile()->create([
        'display_name' => 'Test Creator',
        'onboarding_completed_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('admin.dashboard'))
        ->assertForbidden();
});

test('admin can access admin dashboard', function () {
    $admin = createAdminUser();

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->has('stats')
        );
});

test('admin dashboard shows correct user counts', function () {
    $admin = createAdminUser();
    createBrandUserForAdmin();
    createBrandUserForAdmin();
    createCreatorUserForAdmin();

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->where('stats.total_brands', 2)
            ->where('stats.total_creators', 1)
        );
});
