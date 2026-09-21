<?php

declare(strict_types=1);

use App\Models\Campaign;
use App\Models\Entry;
use App\Models\User;
use App\Notifications\EntrySubmitted;
use App\Services\EntryService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleSeeder::class);
});

function notificationBrandUser(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('brand');
    $user->brandProfile()->create([
        'company_name' => 'Notify Co',
        'onboarding_completed_at' => now(),
    ]);

    return $user->fresh();
}

function notificationCreatorUser(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('creator');
    $user->creatorProfile()->create([
        'display_name' => 'Notify Creator',
        'onboarding_completed_at' => now(),
    ]);

    return $user->fresh();
}

function notificationCampaign(User $brand, string $type = 'contest'): Campaign
{
    return Campaign::create([
        'brand_profile_id' => $brand->brandProfile->id,
        'type' => $type,
        'title' => 'Notification Campaign',
        'brief' => '<p>Brief</p>',
        'platform_fee_pct' => 15,
        'status' => 'active',
        'published_at' => now(),
    ]);
}

function notificationEntry(Campaign $campaign, User $creator, string $status = 'pending_review'): Entry
{
    return Entry::create([
        'campaign_id' => $campaign->id,
        'creator_profile_id' => $creator->creatorProfile->id,
        'type' => $campaign->type,
        'status' => $status,
        'requirements_acknowledged' => true,
        'submitted_at' => now(),
    ]);
}

test('an entry submission stores an in-app notification for the brand with a real route', function () {
    $brand = notificationBrandUser();
    $creator = notificationCreatorUser();
    $campaign = notificationCampaign($brand);
    $entry = notificationEntry($campaign, $creator);

    $brand->notify(new EntrySubmitted($entry));

    $notification = $brand->fresh()->notifications()->first();

    expect($notification)->not->toBeNull()
        ->and($notification->data['type'])->toBe('entry_submitted')
        ->and($notification->data['message'])->toContain('Notify Creator')
        ->and($notification->data['url'])->toBe(route('entries.brand.show', [$campaign, $entry], false));
});

test('the bell endpoint returns recent notifications and the unread count', function () {
    $brand = notificationBrandUser();
    $creator = notificationCreatorUser();
    $entry = notificationEntry(notificationCampaign($brand), $creator);

    $brand->notify(new EntrySubmitted($entry));

    $this->actingAs($brand)
        ->getJson(route('notifications.index'))
        ->assertOk()
        ->assertJsonPath('unread_count', 1)
        ->assertJsonPath('notifications.0.type', 'entry_submitted')
        ->assertJsonPath('notifications.0.read_at', null);
});

test('the shared unread count is refreshed when a notification arrives', function () {
    $brand = notificationBrandUser();
    $creator = notificationCreatorUser();
    $entry = notificationEntry(notificationCampaign($brand), $creator);

    // Prime the cached badge count with zero, as a page load would.
    $this->actingAs($brand)->get(route('dashboard'));
    expect(Cache::get("unread_notifications_{$brand->id}"))->toBe(0);

    $brand->notify(new EntrySubmitted($entry));

    $this->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('unreadNotifications', 1));
});

test('a single notification can be marked as read', function () {
    $brand = notificationBrandUser();
    $creator = notificationCreatorUser();
    $entry = notificationEntry(notificationCampaign($brand), $creator);

    $brand->notify(new EntrySubmitted($entry));
    $brand->notify(new EntrySubmitted($entry));

    $id = $brand->fresh()->unreadNotifications()->first()->id;

    $this->actingAs($brand)
        ->postJson(route('notifications.read', $id))
        ->assertOk()
        ->assertJsonPath('unread_count', 1);

    expect($brand->fresh()->unreadNotifications()->count())->toBe(1);
});

test('all notifications can be marked as read', function () {
    $brand = notificationBrandUser();
    $creator = notificationCreatorUser();
    $entry = notificationEntry(notificationCampaign($brand), $creator);

    $brand->notify(new EntrySubmitted($entry));
    $brand->notify(new EntrySubmitted($entry));

    $this->actingAs($brand)
        ->postJson(route('notifications.read-all'))
        ->assertOk()
        ->assertJsonPath('unread_count', 0);

    expect($brand->fresh()->unreadNotifications()->count())->toBe(0);
});

test('users cannot mark another user\'s notification as read', function () {
    $brand = notificationBrandUser();
    $otherBrand = notificationBrandUser();
    $creator = notificationCreatorUser();
    $entry = notificationEntry(notificationCampaign($brand), $creator);

    $brand->notify(new EntrySubmitted($entry));
    $id = $brand->fresh()->notifications()->first()->id;

    $this->actingAs($otherBrand)
        ->postJson(route('notifications.read', $id))
        ->assertNotFound();
});

test('a pitch application notifies the brand, and its review notifies the creator', function () {
    $brand = notificationBrandUser();
    $creator = notificationCreatorUser();
    $campaign = notificationCampaign($brand, 'pitch');

    $this->actingAs($creator)
        ->post(route('campaigns.applications.store', $campaign), ['pitch' => 'Pick me'])
        ->assertRedirect();

    $brandNotification = $brand->fresh()->notifications()->first();

    expect($brandNotification->data['type'])->toBe('application_submitted')
        ->and($brandNotification->data['url'])->toBe(route('campaigns.applications.index', $campaign, false));

    $application = $campaign->applications()->first();

    $this->actingAs($brand)
        ->post(route('campaigns.applications.approve', [$campaign, $application]))
        ->assertRedirect();

    $creatorNotification = $creator->fresh()->notifications()->first();

    expect($creatorNotification->data['type'])->toBe('application_reviewed')
        ->and($creatorNotification->data['status'])->toBe('approved')
        ->and($creatorNotification->data['url'])->toBe(route('campaigns.creator.show', $campaign, false));
});

test('marking an entry live notifies the brand', function () {
    $brand = notificationBrandUser();
    $creator = notificationCreatorUser();
    $campaign = notificationCampaign($brand, 'ripple');
    $entry = notificationEntry($campaign, $creator, 'approved');

    app(EntryService::class)->markLive($entry);

    $notification = $brand->fresh()->notifications()->first();

    expect($notification->data['type'])->toBe('entry_live')
        ->and($notification->data['url'])->toBe(route('entries.brand.show', [$campaign, $entry], false));
});
