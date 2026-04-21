<?php

declare(strict_types=1);

use App\Http\Controllers\Growth\AgencyController;
use App\Http\Controllers\Growth\CoBrandController;
use App\Http\Controllers\Growth\ReferralController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    // Referrals — both roles
    Route::get('/referrals', [ReferralController::class, 'index'])->name('referrals.index');

    // Co-brand campaigns — brands only
    Route::middleware('role:brand')->group(function () {
        Route::get('/campaigns/{campaign}/co-brands', [CoBrandController::class, 'index'])->name('co-brands.index');
        Route::post('/campaigns/{campaign}/co-brands', [CoBrandController::class, 'invite'])->name('co-brands.invite');
        Route::post('/campaigns/{campaign}/co-brands/accept', [CoBrandController::class, 'accept'])->name('co-brands.accept');
        Route::post('/campaigns/{campaign}/co-brands/decline', [CoBrandController::class, 'decline'])->name('co-brands.decline');

        // Agency
        Route::get('/agency', [AgencyController::class, 'index'])->name('agency.index');
        Route::post('/agency/members', [AgencyController::class, 'invite'])->name('agency.invite');
        Route::post('/agency/accept', [AgencyController::class, 'accept'])->name('agency.accept');
        Route::delete('/agency/members/{member}', [AgencyController::class, 'remove'])->name('agency.remove');
        Route::post('/agency/enable', [AgencyController::class, 'enableAgency'])->name('agency.enable');
    });
});
