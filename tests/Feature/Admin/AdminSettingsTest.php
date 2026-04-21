<?php

declare(strict_types=1);

use App\Models\PlatformSetting;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    PlatformSetting::create([
        'id' => 1,
        'platform_fee_pct' => 15.00,
        'contest_split_first' => 50.00,
        'contest_split_second' => 25.00,
        'contest_split_third' => 15.00,
        'contest_split_pool' => 10.00,
        'min_creator_payout' => 20.00,
        'referral_creator_bonus' => 10.00,
        'referral_brand_credit' => 25.00,
    ]);
});

function adminForSettings(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('admin');

    return $user;
}

function brandForSettings(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('brand');

    return $user;
}

test('admin can view platform settings', function () {
    $admin = adminForSettings();

    $this->actingAs($admin)
        ->get(route('admin.settings.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/settings')
            ->has('settings')
        );
});

test('non-admin cannot view platform settings', function () {
    $user = brandForSettings();
    $user->brandProfile()->create([
        'company_name' => 'Test Co',
        'onboarding_completed_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('admin.settings.edit'))
        ->assertForbidden();
});

test('admin can update platform settings', function () {
    $admin = adminForSettings();

    $this->actingAs($admin)
        ->put(route('admin.settings.update'), [
            'platform_fee_pct' => 12.00,
            'contest_split_first' => 50.00,
            'contest_split_second' => 25.00,
            'contest_split_third' => 15.00,
            'contest_split_pool' => 10.00,
            'min_creator_payout' => 25.00,
            'referral_creator_bonus' => 15.00,
            'referral_brand_credit' => 30.00,
        ])
        ->assertRedirect();

    expect(PlatformSetting::current()->platform_fee_pct)->toBe('12.00');
    expect(PlatformSetting::current()->min_creator_payout)->toBe('25.00');
});

test('settings update fails when split percentages exceed 100', function () {
    $admin = adminForSettings();

    $this->actingAs($admin)
        ->put(route('admin.settings.update'), [
            'platform_fee_pct' => 15.00,
            'contest_split_first' => 60.00,
            'contest_split_second' => 30.00,
            'contest_split_third' => 20.00,
            'contest_split_pool' => 10.00,
            'min_creator_payout' => 20.00,
            'referral_creator_bonus' => 10.00,
            'referral_brand_credit' => 25.00,
        ])
        ->assertSessionHasErrors('contest_split_first');
});

test('settings update requires all fields', function () {
    $admin = adminForSettings();

    $this->actingAs($admin)
        ->put(route('admin.settings.update'), [])
        ->assertSessionHasErrors([
            'platform_fee_pct',
            'contest_split_first',
            'min_creator_payout',
        ]);
});
