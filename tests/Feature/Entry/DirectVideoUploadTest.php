<?php

declare(strict_types=1);

use App\Models\CreatorProfile;
use App\Models\User;
use App\Support\DirectUpload;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleSeeder::class);

    // Pretend this host has a bucket attached so presigned URLs are available.
    config(['filesystems.default' => 's3']);
    Storage::fake('s3');
});

function uploadingCreator(): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole('creator');

    CreatorProfile::create([
        'user_id' => $user->id,
        'display_name' => 'Upload Creator',
        'stripe_connect_status' => 'pending',
        'total_earned' => 0,
        'pending_earnings' => 0,
        'onboarding_completed_at' => now(),
    ]);

    return $user;
}

it('signs an upload url scoped to the creator', function () {
    $user = uploadingCreator();

    $response = $this->actingAs($user)
        ->postJson('/entries/upload-url', ['extension' => 'mp4', 'size' => 50_000_000]);

    $response->assertOk()
        ->assertJsonStructure(['url', 'headers', 'path', 'signature']);

    expect($response->json('path'))->toStartWith('entries/videos/')
        ->and($response->json('path'))->toEndWith('.mp4')
        ->and($response->json('headers.Content-Type'))->toBe('video/mp4');
});

it('rejects extensions outside the video allowlist', function () {
    $this->actingAs(uploadingCreator())
        ->postJson('/entries/upload-url', ['extension' => 'exe', 'size' => 1000])
        ->assertStatus(422);
});

it('rejects files larger than the cap before signing', function () {
    $this->actingAs(uploadingCreator())
        ->postJson('/entries/upload-url', [
            'extension' => 'mp4',
            'size' => DirectUpload::MAX_BYTES + 1,
        ])
        ->assertStatus(422);
});

it('accepts a signed path once the object is in the bucket', function () {
    $user = uploadingCreator();

    $reserved = DirectUpload::reserve('entries/videos', 'mp4', 'video/mp4', (string) $user->id);
    Storage::disk('s3')->put($reserved['path'], 'video-bytes');

    $claimed = DirectUpload::claim(
        $reserved['path'],
        $reserved['signature'],
        (string) $user->id,
    );

    expect($claimed)->toBe($reserved['path']);
});

it('refuses a forged signature', function () {
    $user = uploadingCreator();
    Storage::disk('s3')->put('entries/videos/forged.mp4', 'video-bytes');

    DirectUpload::claim('entries/videos/forged.mp4', 'not-a-real-signature', (string) $user->id);
})->throws(ValidationException::class);

it('refuses a path signed for a different creator', function () {
    $owner = uploadingCreator();
    $attacker = uploadingCreator();

    $reserved = DirectUpload::reserve('entries/videos', 'mp4', 'video/mp4', (string) $owner->id);
    Storage::disk('s3')->put($reserved['path'], 'video-bytes');

    DirectUpload::claim($reserved['path'], $reserved['signature'], (string) $attacker->id);
})->throws(ValidationException::class);

it('refuses a signed path whose upload never landed', function () {
    $user = uploadingCreator();

    $reserved = DirectUpload::reserve('entries/videos', 'mp4', 'video/mp4', (string) $user->id);

    DirectUpload::claim($reserved['path'], $reserved['signature'], (string) $user->id);
})->throws(ValidationException::class);

it('falls back to the multipart ceiling when no bucket is attached', function () {
    config(['filesystems.default' => 'local']);

    expect(DirectUpload::supported())->toBeFalse()
        ->and(DirectUpload::maxBytes())->toBe(DirectUpload::FALLBACK_MAX_KILOBYTES * 1024);
});
