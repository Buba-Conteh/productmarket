<?php

declare(strict_types=1);

use App\Http\Controllers\Brand\CreatorSearchController;
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

    // Creator search — brand only
    Route::middleware('role:brand')->group(function (): void {
        Route::get('creators', [CreatorSearchController::class, 'index'])
            ->name('brand.creators.index');
    });
});
