<?php

declare(strict_types=1);

use App\Jobs\PublishToTikTokJob;
use App\Models\BrandProfile;
use App\Models\Campaign;
use App\Models\CreatorProfile;
use App\Models\Entry;
use App\Models\Industry;
use App\Models\Platform;
use App\Models\SocialAccount;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    config(['social_oauth.tiktok.posting_stub_mode' => true]);
    Queue::fake();
});

/**
 * @return array{user: User, entry: Entry}
 */
function tiktokPostableEntry(?int $durationSec = 30): array
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('creator');

    $creator = CreatorProfile::create([
        'user_id' => $user->id,
        'display_name' => 'TikTok Creator',
        'stripe_connect_status' => 'pending',
        'total_earned' => 0,
        'pending_earnings' => 0,
        'onboarding_completed_at' => now(),
    ]);

    $platform = Platform::firstOrCreate(
        ['slug' => 'tiktok'],
        ['name' => 'TikTok', 'is_active' => true, 'sort_order' => 1],
    );

    SocialAccount::create([
        'user_id' => $user->id,
        'platform_id' => $platform->id,
        'handle' => '@tiktok_creator',
        'platform_user_id' => 'tt_1',
        'oauth_token' => 'token',
        'scopes' => ['user.info.basic', 'video.publish'],
        'follower_count' => 1000,
        'verified' => true,
    ]);

    $brandUser = User::factory()->create(['email_verified_at' => now()]);
    $brandUser->assignRole('brand');

    $industry = Industry::firstOrCreate(
        ['slug' => 'retail'],
        ['name' => 'Retail', 'is_active' => true, 'sort_order' => 1],
    );

    $brand = BrandProfile::create([
        'user_id' => $brandUser->id,
        'company_name' => 'TikTok Co',
        'industry_id' => $industry->id,
        'onboarding_completed_at' => now(),
    ]);

    $campaign = Campaign::create([
        'brand_profile_id' => $brand->id,
        'type' => 'contest',
        'title' => 'TikTok Campaign',
        'brief' => '<p>Brief</p>',
        'requirements' => [],
        'required_hashtags' => [],
        'target_regions' => [],
        'inspiration_links' => [],
        'platform_fee_pct' => 15,
        'status' => 'active',
        'published_at' => now(),
    ]);

    $entry = Entry::create([
        'campaign_id' => $campaign->id,
        'creator_profile_id' => $creator->id,
        'type' => 'contest',
        'status' => 'approved',
        'video_url' => 'entries/videos/test.mp4',
        'video_duration_sec' => $durationSec,
        'tags' => [],
    ]);

    $entry->platforms()->attach($platform->id);

    return ['user' => $user, 'entry' => $entry];
}

function validTikTokPost(array $overrides = []): array
{
    return [
        'caption' => 'My video',
        'privacy_level' => 'PUBLIC_TO_EVERYONE',
        'music_consent' => true,
        ...$overrides,
    ];
}

it('returns the creator posting settings for the post form', function () {
    ['user' => $user, 'entry' => $entry] = tiktokPostableEntry(45);

    $this->actingAs($user)
        ->getJson("/entries/{$entry->id}/publish/tiktok/creator-info")
        ->assertOk()
        ->assertJsonPath('username', 'tiktok_creator')
        ->assertJsonPath('video_duration_sec', 45)
        ->assertJsonStructure([
            'nickname',
            'avatar_url',
            'privacy_level_options',
            'comment_disabled',
            'duet_disabled',
            'stitch_disabled',
            'max_video_post_duration_sec',
        ]);
});

it('does not expose creator info to someone who does not own the entry', function () {
    ['entry' => $entry] = tiktokPostableEntry();
    ['user' => $other] = tiktokPostableEntry();

    $this->actingAs($other)
        ->getJson("/entries/{$entry->id}/publish/tiktok/creator-info")
        ->assertForbidden();
});

it('requires the creator to choose a privacy level', function () {
    ['user' => $user, 'entry' => $entry] = tiktokPostableEntry();

    $payload = validTikTokPost();
    unset($payload['privacy_level']);

    $this->actingAs($user)
        ->postJson("/entries/{$entry->id}/publish/tiktok", $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors('privacy_level');

    Queue::assertNothingPushed();
});

it('rejects a privacy level the creator account does not offer', function () {
    ['user' => $user, 'entry' => $entry] = tiktokPostableEntry();

    $this->actingAs($user)
        ->postJson("/entries/{$entry->id}/publish/tiktok", validTikTokPost([
            'privacy_level' => 'FOLLOWER_OF_CREATOR',
        ]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('privacy_level');
});

it('requires the music usage confirmation', function () {
    ['user' => $user, 'entry' => $entry] = tiktokPostableEntry();

    $payload = validTikTokPost();
    unset($payload['music_consent']);

    $this->actingAs($user)
        ->postJson("/entries/{$entry->id}/publish/tiktok", $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors('music_consent');
});

it('does not allow branded content to be posted privately', function () {
    ['user' => $user, 'entry' => $entry] = tiktokPostableEntry();

    $this->actingAs($user)
        ->postJson("/entries/{$entry->id}/publish/tiktok", validTikTokPost([
            'privacy_level' => 'SELF_ONLY',
            'brand_content_toggle' => true,
        ]))
        ->assertUnprocessable();

    Queue::assertNothingPushed();
});

it('blocks videos longer than the creator is allowed to post', function () {
    ['user' => $user, 'entry' => $entry] = tiktokPostableEntry(durationSec: 601);

    $this->actingAs($user)
        ->postJson("/entries/{$entry->id}/publish/tiktok", validTikTokPost())
        ->assertUnprocessable();

    Queue::assertNothingPushed();
});

it('queues a post that satisfies every requirement', function () {
    ['user' => $user, 'entry' => $entry] = tiktokPostableEntry();

    $this->actingAs($user)
        ->postJson("/entries/{$entry->id}/publish/tiktok", validTikTokPost())
        ->assertOk()
        ->assertJsonPath('publish_status', 'pending');

    Queue::assertPushed(PublishToTikTokJob::class);
});
