<?php

declare(strict_types=1);

use App\Models\CreatorProfile;
use App\Models\CreatorVideo;
use App\Models\Platform;
use App\Models\SocialAccount;
use App\Models\User;
use App\Services\Social\SocialAccountService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    config(['social_oauth.sync.stub_mode' => true]);
});

function showcaseCreator(): CreatorProfile
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('creator');

    return CreatorProfile::create([
        'user_id' => $user->id,
        'display_name' => 'Showcase Creator',
        'stripe_connect_status' => 'pending',
        'total_earned' => 0,
        'pending_earnings' => 0,
        'onboarding_completed_at' => now(),
    ]);
}

function connectedAccount(User $user, string $slug): SocialAccount
{
    $platform = Platform::firstOrCreate(
        ['slug' => $slug],
        ['name' => ucfirst($slug), 'is_active' => true, 'sort_order' => 1],
    );

    return SocialAccount::create([
        'user_id' => $user->id,
        'platform_id' => $platform->id,
        'handle' => "{$slug}_handle",
        'platform_user_id' => "{$slug}_1",
        'oauth_token' => 'token',
        'follower_count' => 1000,
        'verified' => true,
    ]);
}

it('syncs videos from every platform into creator_videos', function (string $slug) {
    $creator = showcaseCreator();
    $account = connectedAccount($creator->user, $slug);

    $count = app(SocialAccountService::class)->syncVideos($account);

    expect($count)->toBeGreaterThan(0)
        ->and(CreatorVideo::where('social_account_id', $account->id)->count())->toBe($count);

    $video = CreatorVideo::where('social_account_id', $account->id)->first();

    expect($video->platform_video_id)->not->toBeEmpty()
        ->and($video->thumbnail_url)->not->toBeNull()
        ->and($video->posted_at)->not->toBeNull();
})->with(['tiktok', 'instagram', 'youtube']);

it('re-syncing updates videos in place rather than duplicating them', function () {
    $creator = showcaseCreator();
    $account = connectedAccount($creator->user, 'tiktok');
    $service = app(SocialAccountService::class);

    $first = $service->syncVideos($account);
    $ids = CreatorVideo::where('social_account_id', $account->id)->pluck('id')->sort()->values();

    $second = $service->syncVideos($account);
    $after = CreatorVideo::where('social_account_id', $account->id)->pluck('id')->sort()->values();

    expect($second)->toBe($first)
        ->and($after->all())->toBe($ids->all());
});

it('captures the platform profile picture on stats sync', function () {
    $creator = showcaseCreator();
    $account = connectedAccount($creator->user, 'tiktok');

    app(SocialAccountService::class)->syncStats($account);

    expect($account->fresh()->avatar_url)->not->toBeNull();
});

it('falls back to the platform picture for the user avatar', function () {
    $creator = showcaseCreator();
    $account = connectedAccount($creator->user, 'tiktok');
    $account->update(['avatar_url' => 'https://cdn.example.test/pic.jpg']);

    $user = $creator->user->fresh()->load('socialAccounts');

    expect($user->avatar_url)->toBe('https://cdn.example.test/pic.jpg');
});

it('prefers an uploaded avatar over the platform picture', function () {
    Storage::fake('public');

    $creator = showcaseCreator();
    $account = connectedAccount($creator->user, 'tiktok');
    $account->update(['avatar_url' => 'https://cdn.example.test/pic.jpg']);

    $this->actingAs($creator->user)
        ->post('/settings/profile/avatar', [
            'avatar' => UploadedFile::fake()->image('me.jpg', 400, 400),
        ])
        ->assertRedirect();

    $user = $creator->user->fresh()->load('socialAccounts');

    expect($user->avatar)->not->toBeNull()
        ->and($user->avatar_url)->not->toBe('https://cdn.example.test/pic.jpg');
});

it('removing an uploaded avatar falls back to the platform picture', function () {
    Storage::fake('public');

    $creator = showcaseCreator();
    $account = connectedAccount($creator->user, 'tiktok');
    $account->update(['avatar_url' => 'https://cdn.example.test/pic.jpg']);
    $creator->user->update(['avatar' => 'avatars/old.jpg']);

    $this->actingAs($creator->user)
        ->delete('/settings/profile/avatar')
        ->assertRedirect();

    $user = $creator->user->fresh()->load('socialAccounts');

    expect($user->avatar)->toBeNull()
        ->and($user->avatar_url)->toBe('https://cdn.example.test/pic.jpg');
});

it('rejects a non-image avatar upload', function () {
    Storage::fake('public');

    $creator = showcaseCreator();

    $this->actingAs($creator->user)
        ->post('/settings/profile/avatar', [
            'avatar' => UploadedFile::fake()->create('resume.pdf', 100, 'application/pdf'),
        ])
        ->assertSessionHasErrors('avatar');
});

it('renders the creator profile with a rail per platform and in-platform videos', function () {
    $creator = showcaseCreator();
    $service = app(SocialAccountService::class);

    foreach (['tiktok', 'instagram', 'youtube'] as $slug) {
        $service->syncVideos(connectedAccount($creator->user, $slug));
    }

    $viewer = User::factory()->create(['email_verified_at' => now()]);
    $viewer->assignRole('creator');
    CreatorProfile::create([
        'user_id' => $viewer->id,
        'display_name' => 'Viewer',
        'stripe_connect_status' => 'pending',
        'total_earned' => 0,
        'pending_earnings' => 0,
        'onboarding_completed_at' => now(),
    ]);

    $expected = CreatorVideo::query()
        ->selectRaw('social_account_id, count(*) as c')
        ->groupBy('social_account_id')
        ->pluck('c', 'social_account_id');

    expect($expected)->toHaveCount(3);

    $response = $this->actingAs($viewer)
        ->get("/creators/{$creator->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('profiles/creator/show')
            ->has('videoRails', 3)
            ->has('platformVideos')
        );

    // Guards the per-relation eager-load limit: applied globally rather than
    // per parent, the 12-row cap would silently truncate the later rails.
    $rails = $response->viewData('page')['props']['videoRails'];

    foreach ($rails as $rail) {
        expect(count($rail['videos']))->toBe($expected->first());
    }

    expect(collect($rails)->sum(fn ($r) => count($r['videos'])))
        ->toBe((int) $expected->sum());
});

it('omits a rail for an account with nothing synced', function () {
    $creator = showcaseCreator();
    connectedAccount($creator->user, 'tiktok'); // connected, never synced

    $viewer = User::factory()->create(['email_verified_at' => now()]);
    $viewer->assignRole('creator');
    CreatorProfile::create([
        'user_id' => $viewer->id,
        'display_name' => 'Viewer',
        'stripe_connect_status' => 'pending',
        'total_earned' => 0,
        'pending_earnings' => 0,
        'onboarding_completed_at' => now(),
    ]);

    $this->actingAs($viewer)
        ->get("/creators/{$creator->id}")
        ->assertInertia(fn ($page) => $page->has('videoRails', 0));
});
