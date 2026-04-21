<?php

use App\Http\Controllers\Campaign\BrandCampaignController;
use App\Http\Controllers\Campaign\CampaignApplicationController;
use App\Http\Controllers\Campaign\CreatorCampaignController;
use App\Http\Middleware\EnsureOnboardingComplete;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Campaign Routes
|--------------------------------------------------------------------------
|
| Brand campaign management (CRUD, publish, close, cancel).
| Creator campaign discovery (browse, view, apply).
|
*/

// Brand campaign routes — requires subscription + onboarding
Route::middleware(['auth', 'verified', EnsureOnboardingComplete::class, 'role:brand'])
    ->prefix('campaigns')
    ->group(function () {
        // Dashboard & CRUD
        Route::get('/', [BrandCampaignController::class, 'index'])
            ->name('campaigns.brand.index');

        Route::get('/create', [BrandCampaignController::class, 'create'])
            ->name('campaigns.brand.create')
            ->middleware(['brand.subscribed', 'brand.campaign_limit']);

        Route::post('/', [BrandCampaignController::class, 'store'])
            ->name('campaigns.brand.store')
            ->middleware(['brand.subscribed', 'brand.campaign_limit']);

        Route::get('/{campaign}/edit', [BrandCampaignController::class, 'edit'])
            ->name('campaigns.brand.edit');

        Route::put('/{campaign}', [BrandCampaignController::class, 'update'])
            ->name('campaigns.brand.update');

        Route::get('/{campaign}', [BrandCampaignController::class, 'show'])
            ->name('campaigns.brand.show');

        // Lifecycle actions
        Route::post('/{campaign}/publish', [BrandCampaignController::class, 'publish'])
            ->name('campaigns.brand.publish');

        Route::post('/{campaign}/close', [BrandCampaignController::class, 'close'])
            ->name('campaigns.brand.close');

        Route::post('/{campaign}/cancel', [BrandCampaignController::class, 'cancel'])
            ->name('campaigns.brand.cancel');

        // Pitch applications (brand views & manages)
        Route::get('/{campaign}/applications', [CampaignApplicationController::class, 'index'])
            ->name('campaigns.applications.index');

        Route::post('/{campaign}/applications/{application}/approve', [CampaignApplicationController::class, 'approve'])
            ->name('campaigns.applications.approve');

        Route::post('/{campaign}/applications/{application}/reject', [CampaignApplicationController::class, 'reject'])
            ->name('campaigns.applications.reject');
    });

// Creator campaign routes — discovery & applications
Route::middleware(['auth', 'verified', EnsureOnboardingComplete::class, 'role:creator'])
    ->prefix('discover')
    ->group(function () {
        Route::get('/', [CreatorCampaignController::class, 'index'])
            ->name('campaigns.creator.index');

        Route::get('/{campaign}', [CreatorCampaignController::class, 'show'])
            ->name('campaigns.creator.show');

        // Pitch application submission
        Route::post('/{campaign}/apply', [CampaignApplicationController::class, 'store'])
            ->name('campaigns.applications.store');
    });
