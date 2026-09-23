<?php

declare(strict_types=1);

use App\Http\Controllers\Brand\CreatorSearchController;
use App\Http\Controllers\Campaign\CampaignInvitationController;
use App\Http\Controllers\Profiles\BrandProfileController;
use App\Http\Controllers\Profiles\CreatorProfileController;
use App\Http\Middleware\EnsureOnboardingComplete;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', EnsureOnboardingComplete::class])->group(function (): void {
    // Public-facing creator profile (accessible to any authenticated user)
    Route::get('creators/{creatorProfile}', [CreatorProfileController::class, 'show'])
        ->name('profiles.creator.show');

    Route::get('creators/{creatorProfile}/media-kit', [CreatorProfileController::class, 'mediaKit'])
        ->name('profiles.creator.media-kit');

    // Public-facing brand profile
    Route::get('brands/{brandProfile}', [BrandProfileController::class, 'show'])
        ->name('profiles.brand.show');

    // Creator search + campaign invitations — brand only
    Route::middleware('role:brand')->group(function (): void {
        Route::get('creators', [CreatorSearchController::class, 'index'])
            ->name('brand.creators.index');

        Route::post('creators/{creatorProfile}/invite', [CampaignInvitationController::class, 'store'])
            ->name('brand.creators.invite')
            ->middleware('throttle:30,1');
    });

    // Invitation responses — creator only
    Route::middleware('role:creator')->group(function (): void {
        Route::post('invitations/{invitation}/accept', [CampaignInvitationController::class, 'accept'])
            ->name('invitations.accept');

        Route::post('invitations/{invitation}/decline', [CampaignInvitationController::class, 'decline'])
            ->name('invitations.decline');
    });
});
