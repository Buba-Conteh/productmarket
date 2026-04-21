<?php

declare(strict_types=1);

use App\Models\Industry;
use App\Models\User;
use Database\Seeders\IndustrySeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->seed(IndustrySeeder::class);
});

function createBrandUser(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('brand');

    return $user;
}

test('un-onboarded brand is redirected from dashboard to onboarding', function () {
    $user = createBrandUser();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirect(route('onboarding.brand.company'));
});

test('brand can view company profile step', function () {
    $user = createBrandUser();

    $this->actingAs($user)
        ->get(route('onboarding.brand.company'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('onboarding/brand/company')
            ->has('industries')
        );
});

test('brand can submit company profile', function () {
    $user = createBrandUser();
    $industry = Industry::first();

    $this->actingAs($user)
        ->post(route('onboarding.brand.company.store'), [
            'company_name' => 'Test Brand Co',
            'website' => 'https://testbrand.com',
            'industry_id' => $industry->id,
            'description' => 'A test brand company',
        ])
        ->assertRedirect(route('onboarding.brand.billing'));

    $this->assertDatabaseHas('brand_profiles', [
        'user_id' => $user->id,
        'company_name' => 'Test Brand Co',
        'industry_id' => $industry->id,
    ]);
});

test('brand company profile requires company name and industry', function () {
    $user = createBrandUser();

    $this->actingAs($user)
        ->post(route('onboarding.brand.company.store'), [])
        ->assertSessionHasErrors(['company_name', 'industry_id']);
});

test('brand can view billing step', function () {
    $user = createBrandUser();
    $user->brandProfile()->create([
        'company_name' => 'Test Co',
        'industry_id' => Industry::first()->id,
    ]);

    $this->actingAs($user)
        ->get(route('onboarding.brand.billing'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('onboarding/brand/billing'));
});

test('brand billing redirects to company if no profile exists', function () {
    $user = createBrandUser();

    $this->actingAs($user)
        ->get(route('onboarding.brand.billing'))
        ->assertRedirect(route('onboarding.brand.company'));
});

test('brand can skip billing and view tour', function () {
    $user = createBrandUser();
    $user->brandProfile()->create([
        'company_name' => 'Test Co',
        'industry_id' => Industry::first()->id,
    ]);

    $this->actingAs($user)
        ->post(route('onboarding.brand.billing.store'))
        ->assertRedirect(route('onboarding.brand.tour'));
});

test('brand can view tour step', function () {
    $user = createBrandUser();
    $user->brandProfile()->create([
        'company_name' => 'Test Co',
        'industry_id' => Industry::first()->id,
    ]);

    $this->actingAs($user)
        ->get(route('onboarding.brand.tour'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('onboarding/brand/tour'));
});

test('brand can complete onboarding', function () {
    $user = createBrandUser();
    $user->brandProfile()->create([
        'company_name' => 'Test Co',
        'industry_id' => Industry::first()->id,
    ]);

    $this->actingAs($user)
        ->post(route('onboarding.brand.complete'))
        ->assertRedirect(route('dashboard'));

    $user->refresh();
    expect($user->brandProfile->onboarding_completed_at)->not->toBeNull();
});

test('onboarded brand can access dashboard', function () {
    $user = createBrandUser();
    $user->brandProfile()->create([
        'company_name' => 'Test Co',
        'industry_id' => Industry::first()->id,
        'onboarding_completed_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk();
});

test('onboarded brand is redirected from onboarding to dashboard', function () {
    $user = createBrandUser();
    $user->brandProfile()->create([
        'company_name' => 'Test Co',
        'industry_id' => Industry::first()->id,
        'onboarding_completed_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('onboarding.brand.company'))
        ->assertRedirect(route('dashboard'));
});
