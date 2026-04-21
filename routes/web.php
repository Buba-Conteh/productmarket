<?php

use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Middleware\EnsureOnboardingComplete;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware('guest')->group(function () {
    Route::get('auth/{provider}/redirect', [SocialAuthController::class, 'redirect'])->name('social.redirect');
    Route::get('auth/{provider}/callback', [SocialAuthController::class, 'callback'])->name('social.callback');
});

Route::middleware(['auth', 'verified', EnsureOnboardingComplete::class])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
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
