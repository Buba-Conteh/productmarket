<?php

declare(strict_types=1);

namespace App\Http\Controllers\Messaging;

use App\Http\Controllers\Controller;
use App\Models\UserNotificationPreference;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class NotificationPreferenceController extends Controller
{
    private const TYPES = [
        'entry_submitted',
        'entry_approved',
        'entry_rejected',
        'entry_edit_requested',
        'entry_won',
        'payout_processed',
        'new_message',
    ];

    public function index(Request $request): Response
    {
        $user = $request->user();

        $existing = $user->notificationPreferences()
            ->whereIn('type', self::TYPES)
            ->get()
            ->keyBy('type');

        $preferences = collect(self::TYPES)->map(fn (string $type) => [
            'type' => $type,
            'in_app_enabled' => $existing->get($type)?->in_app_enabled ?? true,
            'email_enabled' => $existing->get($type)?->email_enabled ?? true,
        ]);

        return Inertia::render('settings/notification-preferences', [
            'preferences' => $preferences,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'preferences' => ['required', 'array'],
            'preferences.*.type' => ['required', 'string', 'in:'.implode(',', self::TYPES)],
            'preferences.*.in_app_enabled' => ['required', 'boolean'],
            'preferences.*.email_enabled' => ['required', 'boolean'],
        ]);

        $user = $request->user();

        foreach ($validated['preferences'] as $pref) {
            UserNotificationPreference::updateOrCreate(
                ['user_id' => $user->id, 'type' => $pref['type']],
                ['in_app_enabled' => $pref['in_app_enabled'], 'email_enabled' => $pref['email_enabled']],
            );
        }

        return back()->with('success', 'Notification preferences saved.');
    }
}
