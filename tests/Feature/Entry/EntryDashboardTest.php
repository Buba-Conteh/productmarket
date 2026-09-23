<?php

declare(strict_types=1);

use App\Models\BrandProfile;
use App\Models\Campaign;
use App\Models\CreatorProfile;
use App\Models\Industry;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleSeeder::class);
});

function dashboardBrand(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('brand');

    $industry = Industry::firstOrCreate(
        ['slug' => 'retail'],
        ['name' => 'Retail', 'is_active' => true, 'sort_order' => 1],
    );

    BrandProfile::create([
        'user_id' => $user->id,
        'company_name' => 'Dash Co',
        'industry_id' => $industry->id,
        'onboarding_completed_at' => now(),
    ]);

    return $user;
}

function dashboardCreator(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('creator');

    CreatorProfile::create([
        'user_id' => $user->id,
        'display_name' => 'Dash Creator',
        'stripe_connect_status' => 'pending',
        'total_earned' => 0,
        'pending_earnings' => 0,
        'onboarding_completed_at' => now(),
    ]);

    return $user;
}

it('renders the brand entry review dashboard with its summary', function () {
    $brand = dashboardBrand();

    $campaign = Campaign::create([
        'brand_profile_id' => $brand->brandProfile->id,
        'type' => 'contest',
        'title' => 'Review Me',
        'brief' => '<p>Brief</p>',
        'requirements' => [],
        'required_hashtags' => [],
        'target_regions' => [],
        'inspiration_links' => [],
        'platform_fee_pct' => 15,
        'status' => 'active',
        'published_at' => now(),
    ]);

    $this->actingAs($brand)
        ->get("/campaigns/{$campaign->id}/entries")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('entries/brand/index')
            ->has('summary.total_entries')
            ->has('summary.total_views')
            ->has('summary.total_comments')
            ->has('summary.paid_out')
            ->where('filters.sort', 'newest')
        );
});

it('accepts search and sort on the brand entry review dashboard', function () {
    $brand = dashboardBrand();

    $campaign = Campaign::create([
        'brand_profile_id' => $brand->brandProfile->id,
        'type' => 'pitch',
        'title' => 'Sortable',
        'brief' => '<p>Brief</p>',
        'requirements' => [],
        'required_hashtags' => [],
        'target_regions' => [],
        'inspiration_links' => [],
        'platform_fee_pct' => 15,
        'status' => 'active',
        'published_at' => now(),
    ]);

    foreach (['views', 'bid', 'oldest'] as $sort) {
        $this->actingAs($brand)
            ->get("/campaigns/{$campaign->id}/entries?sort={$sort}&search=nova")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('filters.sort', $sort));
    }
});

it('renders the creator entries page with a portfolio summary', function () {
    $creator = dashboardCreator();

    $this->actingAs($creator)
        ->get('/entries')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('entries/creator/index')
            ->has('summary.total_views')
            ->has('summary.total_comments')
            ->has('summary.total_earned')
            ->has('invitations')
        );
});
