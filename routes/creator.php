<?php

declare(strict_types=1);

use App\Http\Controllers\Creator\EarningsController;
use App\Http\Controllers\Creator\SocialAccountController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:creator'])->group(function (): void {
    Route::get('wallet', [EarningsController::class, 'index'])->name('creator.earnings.index');

    Route::prefix('creator/social')->name('creator.social.')->group(function (): void {
        Route::get('{platform}/connect', [SocialAccountController::class, 'redirect'])->name('connect');
        Route::get('{platform}/callback', [SocialAccountController::class, 'callback'])->name('callback');
        Route::delete('{platform}', [SocialAccountController::class, 'destroy'])->name('disconnect');
    });
});
