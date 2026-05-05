<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $billing = null;

        if ($user) {
            $role = $user->hasRole('brand') ? 'brand' : ($user->hasRole('creator') ? 'creator' : null);

            if ($role) {
                $status = cache()->remember(
                    "sub_status_{$user->id}_{$role}",
                    300,
                    fn () => $user->subscriptionStatuses()->where('role', $role)->first()
                );

                $billing = $role === 'brand'
                    ? ['plan' => $status?->plan_key, 'subscribed' => $status?->isActive() ?? false]
                    : ['plan' => $status?->plan_key ?? 'free', 'subscribed' => $status?->isActive() ?? true];
            }
        }

        $unreadCount = $user
            ? cache()->remember("unread_notifications_{$user->id}", 30, fn () => $user->unreadNotifications()->count())
            : 0;

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
                'roles' => $user?->getRoleNames() ?? [],
                'billing' => $billing,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'unreadNotifications' => $unreadCount,
        ];
    }
}
