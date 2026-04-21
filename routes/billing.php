<?php

declare(strict_types=1);

use App\Http\Controllers\Billing\BillingController;
use App\Http\Controllers\Billing\WebhookController;
use App\Http\Middleware\EnsureOnboardingComplete;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Stripe Webhook (no auth, verified by Cashier signature check)
|--------------------------------------------------------------------------
*/
Route::post('/stripe/webhook', [WebhookController::class, 'handleWebhook'])
    ->name('cashier.webhook');

/*
|--------------------------------------------------------------------------
| Billing Portal & Shared Actions
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified', EnsureOnboardingComplete::class])->group(function () {
    Route::post('/billing/portal', [BillingController::class, 'portal'])
        ->name('billing.portal');
});

/*
|--------------------------------------------------------------------------
| Brand Billing
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified', EnsureOnboardingComplete::class, 'role:brand'])->group(function () {
    Route::get('/settings/billing/brand', [BillingController::class, 'brandIndex'])
        ->name('billing.brand.index');

    Route::post('/billing/brand/checkout', [BillingController::class, 'brandCheckout'])
        ->name('billing.brand.checkout');

    Route::get('/billing/brand/success', [BillingController::class, 'brandSuccess'])
        ->name('billing.brand.success');

    Route::post('/billing/brand/cancel', [BillingController::class, 'brandCancel'])
        ->name('billing.brand.cancel');

    Route::post('/billing/brand/resume', [BillingController::class, 'brandResume'])
        ->name('billing.brand.resume');
});

/*
|--------------------------------------------------------------------------
| Creator Billing
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified', EnsureOnboardingComplete::class, 'role:creator'])->group(function () {
    Route::get('/settings/billing/creator', [BillingController::class, 'creatorIndex'])
        ->name('billing.creator.index');

    Route::post('/billing/creator/checkout', [BillingController::class, 'creatorCheckout'])
        ->name('billing.creator.checkout');

    Route::get('/billing/creator/success', [BillingController::class, 'creatorSuccess'])
        ->name('billing.creator.success');

    Route::post('/billing/creator/cancel', [BillingController::class, 'creatorCancel'])
        ->name('billing.creator.cancel');

    Route::post('/billing/creator/resume', [BillingController::class, 'creatorResume'])
        ->name('billing.creator.resume');
});

/*
|--------------------------------------------------------------------------
| Onboarding checkout (no onboarding complete requirement)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified', 'role:brand'])->group(function () {
    Route::post('/billing/onboarding/brand/checkout', [BillingController::class, 'onboardingBrandCheckout'])
        ->name('billing.onboarding.brand.checkout');
});
