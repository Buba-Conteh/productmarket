<?php

use App\Http\Controllers\Entry\BrandEntryController;
use App\Http\Controllers\Entry\CreatorEntryController;
use App\Http\Middleware\EnsureCreatorEntryLimit;
use App\Http\Middleware\EnsureOnboardingComplete;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Entry Routes
|--------------------------------------------------------------------------
|
| Creator entry submission (wizard, my entries, mark live).
| Brand entry review (dashboard, approve, reject, edit request, winner).
|
*/

// Creator entry routes
Route::middleware(['auth', 'verified', EnsureOnboardingComplete::class, 'role:creator'])
    ->prefix('entries')
    ->group(function () {
        // My entries list
        Route::get('/', [CreatorEntryController::class, 'index'])
            ->name('entries.creator.index');

        // Entry detail
        Route::get('/{entry}', [CreatorEntryController::class, 'show'])
            ->name('entries.creator.show');

        // Mark entry as live
        Route::post('/{entry}/live', [CreatorEntryController::class, 'markLive'])
            ->name('entries.creator.live');
    });

// Creator submission routes (nested under campaign)
Route::middleware(['auth', 'verified', EnsureOnboardingComplete::class, 'role:creator'])
    ->prefix('discover/{campaign}/entry')
    ->group(function () {
        Route::get('/', [CreatorEntryController::class, 'create'])
            ->name('entries.creator.create')
            ->middleware(EnsureCreatorEntryLimit::class);

        Route::post('/', [CreatorEntryController::class, 'store'])
            ->name('entries.creator.store')
            ->middleware(EnsureCreatorEntryLimit::class);

        Route::post('/resubmit', [CreatorEntryController::class, 'resubmit'])
            ->name('entries.creator.resubmit');
    });

// Brand entry review routes (nested under campaign)
Route::middleware(['auth', 'verified', EnsureOnboardingComplete::class, 'role:brand'])
    ->prefix('campaigns/{campaign}/entries')
    ->group(function () {
        Route::get('/', [BrandEntryController::class, 'index'])
            ->name('entries.brand.index');

        Route::get('/{entry}', [BrandEntryController::class, 'show'])
            ->name('entries.brand.show');

        // Approval flows
        Route::post('/{entry}/approve-ripple', [BrandEntryController::class, 'approveRipple'])
            ->name('entries.brand.approve-ripple');

        Route::post('/{entry}/approve-pitch', [BrandEntryController::class, 'approvePitch'])
            ->name('entries.brand.approve-pitch');

        Route::post('/{entry}/confirm-live', [BrandEntryController::class, 'confirmPitchLive'])
            ->name('entries.brand.confirm-live');

        Route::post('/{entry}/select-winner', [BrandEntryController::class, 'selectWinner'])
            ->name('entries.brand.select-winner');

        // Rejection & edit requests
        Route::post('/{entry}/reject', [BrandEntryController::class, 'reject'])
            ->name('entries.brand.reject');

        Route::post('/{entry}/request-edit', [BrandEntryController::class, 'requestEdit'])
            ->name('entries.brand.request-edit');
    });
