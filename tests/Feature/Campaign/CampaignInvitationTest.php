<?php

declare(strict_types=1);

use App\Models\BrandProfile;
use App\Models\Campaign;
use App\Models\CampaignInvitation;
use App\Models\CreatorProfile;
use App\Models\Industry;
use App\Models\User;
use App\Notifications\CampaignInvitationSent;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    Notification::fake();
});

function invitingBrand(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('brand');

    $industry = Industry::firstOrCreate(
        ['slug' => 'fitness-tech'],
        ['name' => 'Fitness Tech', 'is_active' => true, 'sort_order' => 1],
    );

    BrandProfile::create([
        'user_id' => $user->id,
        'company_name' => 'Acme Co',
        'industry_id' => $industry->id,
        'onboarding_completed_at' => now(),
    ]);

    return $user;
}

function invitedCreator(string $name = 'Nova Creator'): CreatorProfile
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('creator');

    return CreatorProfile::create([
        'user_id' => $user->id,
        'display_name' => $name,
        'stripe_connect_status' => 'pending',
        'total_earned' => 0,
        'pending_earnings' => 0,
        'onboarding_completed_at' => now(),
    ]);
}

function liveCampaign(User $brand, string $status = 'active'): Campaign
{
    return Campaign::create([
        'brand_profile_id' => $brand->brandProfile->id,
        'type' => 'contest',
        'title' => 'Summer Push',
        'brief' => '<p>Make something great.</p>',
        'requirements' => [],
        'required_hashtags' => [],
        'target_regions' => [],
        'inspiration_links' => [],
        'platform_fee_pct' => 15,
        'status' => $status,
        'published_at' => now(),
    ]);
}

it('lets a brand invite a creator to a live campaign', function () {
    $brand = invitingBrand();
    $creator = invitedCreator();
    $campaign = liveCampaign($brand);

    $this->actingAs($brand)
        ->post("/creators/{$creator->id}/invite", [
            'campaign_id' => $campaign->id,
            'message' => 'Your fitness content is a great fit.',
        ])
        ->assertRedirect();

    $invitation = CampaignInvitation::first();

    expect($invitation)->not->toBeNull()
        ->and($invitation->campaign_id)->toBe($campaign->id)
        ->and($invitation->creator_profile_id)->toBe($creator->id)
        ->and($invitation->status)->toBe('pending')
        ->and($invitation->message)->toBe('Your fitness content is a great fit.');

    Notification::assertSentTo($creator->user, CampaignInvitationSent::class);
});

it('re-inviting updates the existing invitation instead of duplicating it', function () {
    $brand = invitingBrand();
    $creator = invitedCreator();
    $campaign = liveCampaign($brand);

    foreach (['First ask', 'Second ask'] as $message) {
        $this->actingAs($brand)->post("/creators/{$creator->id}/invite", [
            'campaign_id' => $campaign->id,
            'message' => $message,
        ]);
    }

    expect(CampaignInvitation::count())->toBe(1)
        ->and(CampaignInvitation::first()->message)->toBe('Second ask');
});

it('rejects an invitation to a campaign the brand does not own', function () {
    $owner = invitingBrand();
    $campaign = liveCampaign($owner);

    $otherBrand = invitingBrand();
    $creator = invitedCreator();

    $this->actingAs($otherBrand)
        ->post("/creators/{$creator->id}/invite", ['campaign_id' => $campaign->id])
        ->assertNotFound();

    expect(CampaignInvitation::count())->toBe(0);
});

it('rejects an invitation to a campaign that is not live', function () {
    $brand = invitingBrand();
    $creator = invitedCreator();
    $campaign = liveCampaign($brand, status: 'draft');

    $this->actingAs($brand)
        ->post("/creators/{$creator->id}/invite", ['campaign_id' => $campaign->id])
        ->assertStatus(422);
});

it('lets the invited creator accept and decline', function () {
    $brand = invitingBrand();
    $creator = invitedCreator();
    $campaign = liveCampaign($brand);

    $invitation = CampaignInvitation::create([
        'campaign_id' => $campaign->id,
        'creator_profile_id' => $creator->id,
        'invited_by_user_id' => $brand->id,
        'status' => 'pending',
    ]);

    $this->actingAs($creator->user)
        ->post("/invitations/{$invitation->id}/accept")
        ->assertRedirect("/discover/{$campaign->id}");

    expect($invitation->fresh()->status)->toBe('accepted')
        ->and($invitation->fresh()->responded_at)->not->toBeNull();

    $this->actingAs($creator->user)
        ->post("/invitations/{$invitation->id}/decline");

    expect($invitation->fresh()->status)->toBe('declined');
});

it('forbids a creator from responding to someone else\'s invitation', function () {
    $brand = invitingBrand();
    $creator = invitedCreator();
    $intruder = invitedCreator('Someone Else');
    $campaign = liveCampaign($brand);

    $invitation = CampaignInvitation::create([
        'campaign_id' => $campaign->id,
        'creator_profile_id' => $creator->id,
        'invited_by_user_id' => $brand->id,
        'status' => 'pending',
    ]);

    $this->actingAs($intruder->user)
        ->post("/invitations/{$invitation->id}/accept")
        ->assertForbidden();

    expect($invitation->fresh()->status)->toBe('pending');
});

it('shows the creator directory with aggregate social totals', function () {
    $brand = invitingBrand();
    invitedCreator();

    $this->actingAs($brand)
        ->get('/creators')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('brand/creators/index')
            ->has('creators.data.0.totals.followers')
            ->has('creators.data.0.totals.likes')
            ->has('creators.data.0.totals.comments')
            ->has('invitableCampaigns')
        );
});

it('lists the brand\'s live campaigns as invitable', function () {
    $brand = invitingBrand();
    invitedCreator();
    liveCampaign($brand);
    liveCampaign($brand, status: 'draft');

    $this->actingAs($brand)
        ->get('/creators')
        ->assertInertia(fn ($page) => $page->has('invitableCampaigns', 1));
});
