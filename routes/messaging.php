<?php

declare(strict_types=1);

use App\Http\Controllers\Messaging\MessageController;
use App\Http\Controllers\Messaging\MessageThreadController;
use App\Http\Controllers\Messaging\NotificationController;
use App\Http\Controllers\Messaging\NotificationPreferenceController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    // Message threads
    Route::get('/messages', [MessageThreadController::class, 'index'])->name('messages.index');
    Route::get('/messages/entry/{entry}', [MessageThreadController::class, 'show'])->name('messages.show');

    // Send message
    Route::post('/messages/{thread}', [MessageController::class, 'store'])->name('messages.store');

    // Notifications (JSON endpoints)
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');

    // Notification preferences
    Route::get('/settings/notifications', [NotificationPreferenceController::class, 'index'])->name('settings.notifications');
    Route::put('/settings/notifications', [NotificationPreferenceController::class, 'update'])->name('settings.notifications.update');
});
