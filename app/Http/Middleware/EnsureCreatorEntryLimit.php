<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\BillingService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks entry submission when a free-tier creator has hit their monthly cap (2 entries).
 * Applied to routes that create or submit entries.
 */
final class EnsureCreatorEntryLimit
{
    public function __construct(private readonly BillingService $billing) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasRole('creator')) {
            return $next($request);
        }

        if (! $this->billing->creatorCanSubmitEntry($user)) {
            $limit = $this->billing->creatorMonthlyEntryLimit($user);

            return redirect()->route('billing.creator.index')
                ->with('error', "You have reached your free plan limit of {$limit} entries this month. Upgrade to Creator Pro for unlimited entries.");
        }

        return $next($request);
    }
}
