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
            if ($user->hasRole('brand')) {
                $status = $user->subscriptionStatuses()->where('role', 'brand')->first();
                $billing = [
                    'plan' => $status?->plan_key,
                    'subscribed' => $status?->isActive() ?? false,
                ];
            } elseif ($user->hasRole('creator')) {
                $status = $user->subscriptionStatuses()->where('role', 'creator')->first();
                $billing = [
                    'plan' => $status?->plan_key ?? 'free',
                    'subscribed' => $status?->isActive() ?? true, // creators are always 'subscribed' (free tier is valid)
                ];
            }
        }

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
            'unreadNotifications' => $user ? $user->unreadNotifications()->count() : 0,
        ];
    }
}
