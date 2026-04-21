<?php

declare(strict_types=1);

namespace App\Http\Controllers\Messaging;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Models\MessageThread;
use App\Notifications\NewMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class MessageController extends Controller
{
    public function store(Request $request, MessageThread $thread): RedirectResponse
    {
        $user = $request->user();

        $this->authorizeThreadAccess($user, $thread);

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $message = $thread->messages()->create([
            'sender_user_id' => $user->id,
            'body' => $validated['body'],
        ]);

        $message->load('sender');

        $thread->update(['last_message_at' => now()]);

        // Broadcast message via Reverb
        MessageSent::dispatch($message);

        // Notify the other party in-app
        $otherUser = $this->getOtherPartyUser($user, $thread);
        if ($otherUser) {
            $otherUser->notify(new NewMessage($message));
        }

        return back();
    }

    private function authorizeThreadAccess(mixed $user, MessageThread $thread): void
    {
        $thread->load('entry.campaign.brandProfile', 'entry.creator');

        $brandUserId = $thread->entry->campaign->brandProfile->user_id ?? null;
        $creatorUserId = $thread->entry->creator->user_id ?? null;

        abort_unless(
            $user->id === $brandUserId || $user->id === $creatorUserId,
            403,
        );
    }

    private function getOtherPartyUser(mixed $currentUser, MessageThread $thread): mixed
    {
        $brandUser = $thread->entry->campaign->brandProfile->user ?? null;
        $creatorUser = $thread->entry->creator->user ?? null;

        if ($currentUser->id === $brandUser?->id) {
            return $creatorUser;
        }

        return $brandUser;
    }
}
