<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\BillingService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ensures the authenticated brand user has an active subscription.
 * Applied to routes that require a paid plan (e.g. campaign creation).
 */
final class EnsureBrandSubscription
{
    public function __construct(private readonly BillingService $billing) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasRole('brand')) {
            return $next($request);
        }

        if (! $user->subscribed('brand')) {
            if ($request->expectsJson() || $request->inertia()) {
                return redirect()->route('billing.brand.index')
                    ->with('error', 'You need an active subscription to access this feature.');
            }

            return redirect()->route('billing.brand.index')
                ->with('error', 'You need an active subscription to access this feature.');
        }

        return $next($request);
    }
}
