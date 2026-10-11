<?php

declare(strict_types=1);

use App\Models\BrandProfile;
use App\Models\Campaign;
use App\Models\CampaignInvitation;
use App\Models\CreatorProfile;
use App\Models\CreatorVideo;
use App\Models\Industry;
use App\Models\Platform;
use App\Models\SocialAccount;
use App\Models\User;
use App\Notifications\CampaignInvitationSent;
use App\Services\Creators\FeaturedVideoService;
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

function directoryVideo(CreatorProfile $creator, string $slug, string $videoId, int $views): void
{
    $platform = Platform::firstOrCreate(
        ['slug' => $slug],
        ['name' => ucfirst($slug), 'is_active' => true, 'sort_order' => 1],
    );

    $account = SocialAccount::firstOrCreate(
        ['user_id' => $creator->user_id, 'platform_id' => $platform->id],
        [
            'handle' => "{$slug}_handle",
            'platform_user_id' => "{$slug}_1",
            'oauth_token' => 'token',
            'follower_count' => 1000,
            'verified' => true,
        ],
    );

    CreatorVideo::create([
        'social_account_id' => $account->id,
        'platform_id' => $platform->id,
        'platform_video_id' => $videoId,
        'title' => "Video {$videoId}",
        'thumbnail_url' => "https://cdn.test/{$videoId}.jpg",
        'share_url' => "https://www.{$slug}.com/p/{$videoId}/",
        'view_count' => $views,
    ]);
}

it('includes featured videos on directory results, most viewed first, with embed urls', function () {
    $brand = invitingBrand();
    $creator = invitedCreator();
    directoryVideo($creator, 'tiktok', '111', views: 50);
    directoryVideo($creator, 'youtube', 'abc', views: 900);
    directoryVideo($creator, 'instagram', 'C1x', views: 300);

    $this->actingAs($brand)
        ->get('/creators')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('creators.data.0.featured_videos', 3)
            ->where('creators.data.0.featured_videos.0.embed_url', 'https://www.youtube.com/embed/abc')
            ->where('creators.data.0.featured_videos.1.embed_url', 'https://www.instagram.com/p/C1x/embed')
            ->where('creators.data.0.featured_videos.2.embed_url', 'https://www.tiktok.com/embed/v2/111')
            ->where('creators.data.0.featured_videos.0.source', 'platform')
        );
});

it('caps featured videos per creator and leaves stub videos unembedded', function () {
    $brand = invitingBrand();
    $creator = invitedCreator();

    foreach (range(1, 12) as $i) {
        directoryVideo($creator, 'tiktok', "tiktok_stub_video_{$i}", views: $i);
    }

    $this->actingAs($brand)
        ->get('/creators')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('creators.data.0.featured_videos', FeaturedVideoService::PER_CREATOR)
            ->where('creators.data.0.featured_videos.0.embed_url', null)
            ->where('creators.data.0.featured_videos.0.view_count', 12)
        );
});

it('returns an empty featured reel for creators with no videos', function () {
    $brand = invitingBrand();
    invitedCreator();

    $this->actingAs($brand)
        ->get('/creators')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('creators.data.0.featured_videos', 0));
});
