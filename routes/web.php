<?php

use App\Http\Controllers\Auth\PhoneAuthController;
use App\Http\Controllers\Auth\RoleSelectionController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Middleware\EnsureOnboardingComplete;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::inertia('/terms', 'legal/terms')->name('terms');
Route::inertia('/privacy', 'legal/privacy')->name('privacy');

Route::middleware('guest')->group(function () {
    Route::get('auth/{provider}/redirect', [SocialAuthController::class, 'redirect'])->name('social.redirect');
    Route::get('auth/{provider}/callback', [SocialAuthController::class, 'callback'])->name('social.callback');

    // Passwordless phone (SMS OTP) signup / login
    Route::get('auth/phone', [PhoneAuthController::class, 'show'])->name('phone.login');
    Route::post('auth/phone', [PhoneAuthController::class, 'sendCode'])
        ->middleware('throttle:6,1')->name('phone.send');
    Route::get('auth/phone/verify', [PhoneAuthController::class, 'showVerify'])->name('phone.verify');
    Route::post('auth/phone/verify', [PhoneAuthController::class, 'verify'])
        ->middleware('throttle:6,1')->name('phone.verify.store');
    Route::post('auth/phone/resend', [PhoneAuthController::class, 'resend'])
        ->middleware('throttle:6,1')->name('phone.resend');
});

// Role picker for social / phone signups that arrive without a role. Sits
// behind auth+verified but NOT the onboarding gate (which redirects here).
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('auth/select-role', [RoleSelectionController::class, 'show'])->name('role.select');
    Route::post('auth/select-role', [RoleSelectionController::class, 'store'])->name('role.select.store');
});

Route::middleware(['auth', 'verified', EnsureOnboardingComplete::class])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
});

require __DIR__.'/onboarding.php';
require __DIR__.'/settings.php';
require __DIR__.'/billing.php';
require __DIR__.'/campaign.php';
require __DIR__.'/entry.php';
require __DIR__.'/creator.php';
require __DIR__.'/profiles.php';
require __DIR__.'/admin.php';
require __DIR__.'/messaging.php';
require __DIR__.'/analytics.php';
require __DIR__.'/growth.php';
