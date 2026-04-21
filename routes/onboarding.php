<?php

declare(strict_types=1);

use App\Http\Controllers\Onboarding\BrandOnboardingController;
use App\Http\Controllers\Onboarding\CreatorOnboardingController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->prefix('onboarding')->group(function (): void {
    // Brand onboarding (3 steps: company → billing → tour)
    Route::middleware('role:brand')->prefix('brand')->group(function (): void {
        Route::get('company', [BrandOnboardingController::class, 'company'])->name('onboarding.brand.company');
        Route::post('company', [BrandOnboardingController::class, 'storeCompany'])->name('onboarding.brand.company.store');
        Route::get('billing', [BrandOnboardingController::class, 'billing'])->name('onboarding.brand.billing');
        Route::post('billing', [BrandOnboardingController::class, 'storeBilling'])->name('onboarding.brand.billing.store');
        Route::get('tour', [BrandOnboardingController::class, 'tour'])->name('onboarding.brand.tour');
        Route::post('complete', [BrandOnboardingController::class, 'complete'])->name('onboarding.brand.complete');
    });

    // Creator onboarding (4 steps: profile → niches → social → payout)
    Route::middleware('role:creator')->prefix('creator')->group(function (): void {
        Route::get('profile', [CreatorOnboardingController::class, 'profile'])->name('onboarding.creator.profile');
        Route::post('profile', [CreatorOnboardingController::class, 'storeProfile'])->name('onboarding.creator.profile.store');
        Route::get('niches', [CreatorOnboardingController::class, 'niches'])->name('onboarding.creator.niches');
        Route::post('niches', [CreatorOnboardingController::class, 'storeNiches'])->name('onboarding.creator.niches.store');
        Route::get('social', [CreatorOnboardingController::class, 'social'])->name('onboarding.creator.social');
        Route::post('social', [CreatorOnboardingController::class, 'storeSocial'])->name('onboarding.creator.social.store');
        Route::get('payout', [CreatorOnboardingController::class, 'payout'])->name('onboarding.creator.payout');
        Route::post('stripe/connect', [CreatorOnboardingController::class, 'connectStripe'])->name('onboarding.creator.stripe.connect');
        Route::get('stripe/return', [CreatorOnboardingController::class, 'stripeReturn'])->name('onboarding.creator.stripe.return');
        Route::get('stripe/refresh', [CreatorOnboardingController::class, 'stripeRefresh'])->name('onboarding.creator.stripe.refresh');
        Route::post('complete', [CreatorOnboardingController::class, 'complete'])->name('onboarding.creator.complete');
    });
});
