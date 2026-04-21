<?php

declare(strict_types=1);

use App\Http\Controllers\Analytics\AdminAnalyticsController;
use App\Http\Controllers\Analytics\BrandAnalyticsController;
use App\Http\Controllers\Analytics\CreatorAnalyticsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/analytics', [BrandAnalyticsController::class, 'index'])
        ->middleware('role:brand')
        ->name('analytics.brand');

    Route::get('/creator/analytics', [CreatorAnalyticsController::class, 'index'])
        ->middleware('role:creator')
        ->name('analytics.creator');

    Route::get('/admin/analytics', [AdminAnalyticsController::class, 'index'])
        ->middleware('role:admin')
        ->name('analytics.admin');
});
