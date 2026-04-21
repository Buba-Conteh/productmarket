<?php

declare(strict_types=1);

use App\Models\MessageThread;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/

Broadcast::channel('thread.{threadId}', function ($user, string $threadId): bool {
    $thread = MessageThread::with('entry.campaign.brandProfile', 'entry.creatorProfile')->find($threadId);

    if (! $thread) {
        return false;
    }

    $brandUserId = $thread->entry->campaign->brandProfile->user_id ?? null;
    $creatorUserId = $thread->entry->creatorProfile->user_id ?? null;

    return $user->id === $brandUserId || $user->id === $creatorUserId;
});

Broadcast::channel('notifications.{userId}', function ($user, string $userId): bool {
    return $user->id === $userId;
});
