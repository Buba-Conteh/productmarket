<?php

declare(strict_types=1);

namespace App\Http\Controllers\Messaging;

use App\Http\Controllers\Controller;
use App\Models\Entry;
use App\Models\MessageThread;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class MessageThreadController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $threads = MessageThread::with([
            'entry.campaign',
            'entry.creator.user',
            'entry.campaign.brandProfile.user',
            'messages' => fn ($q) => $q->latest()->limit(1),
        ])
            ->whereHas('entry', function ($q) use ($user) {
                if ($user->hasRole('brand')) {
                    $q->whereHas('campaign', fn ($cq) => $cq->where('brand_profile_id', $user->brandProfile->id));
                } else {
                    $q->where('creator_profile_id', $user->creatorProfile->id);
                }
            })
            ->withCount(['messages as unread_count' => function ($q) use ($user) {
                $q->whereNull('read_at')->where('sender_user_id', '!=', $user->id);
            }])
            ->orderByDesc('last_message_at')
            ->get();

        return Inertia::render('messages/index', [
            'threads' => $threads->map(fn ($thread) => [
                'id' => $thread->id,
                'entry_id' => $thread->entry_id,
                'campaign_title' => $thread->entry->campaign->title,
                'other_party' => $user->hasRole('brand')
                    ? ['name' => $thread->entry->creator->display_name]
                    : ['name' => $thread->entry->campaign->brandProfile->user->name],
                'last_message' => $thread->messages->first()?->body,
                'last_message_at' => $thread->last_message_at,
                'unread_count' => $thread->unread_count,
            ]),
        ]);
    }

    public function show(Request $request, Entry $entry): Response
    {
        $user = $request->user();

        $this->authorizeThreadAccess($user, $entry);

        $thread = MessageThread::firstOrCreate(
            ['entry_id' => $entry->id],
            ['last_message_at' => now()],
        );

        $messages = $thread->messages()
            ->with('sender')
            ->orderBy('created_at')
            ->get()
            ->map(fn ($message) => [
                'id' => $message->id,
                'body' => $message->body,
                'sender_id' => $message->sender_user_id,
                'sender_name' => $message->sender->name,
                'sender_avatar' => $message->sender->avatar,
                'is_mine' => $message->sender_user_id === $user->id,
                'read_at' => $message->read_at,
                'created_at' => $message->created_at,
            ]);

        // Mark messages from the other party as read
        $thread->messages()
            ->where('sender_user_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $otherParty = $user->hasRole('brand')
            ? ['name' => $entry->creator->display_name]
            : ['name' => $entry->campaign->brandProfile->user->name];

        return Inertia::render('messages/show', [
            'thread' => [
                'id' => $thread->id,
                'entry_id' => $entry->id,
                'campaign_title' => $entry->campaign->title,
                'other_party' => $otherParty,
            ],
            'messages' => $messages,
            'auth_user_id' => $user->id,
        ]);
    }

    private function authorizeThreadAccess(mixed $user, Entry $entry): void
    {
        $brandUserId = $entry->campaign->brandProfile->user_id ?? null;
        $creatorUserId = $entry->creator->user_id ?? null;

        abort_unless(
            $user->id === $brandUserId || $user->id === $creatorUserId,
            403,
        );
    }
}
