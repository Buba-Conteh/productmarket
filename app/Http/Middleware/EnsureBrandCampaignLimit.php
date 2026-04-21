<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\BillingService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks campaign creation when the brand has reached their plan's campaign limit.
 * Apply only to routes that create or publish campaigns.
 */
final class EnsureBrandCampaignLimit
{
    public function __construct(private readonly BillingService $billing) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasRole('brand')) {
            return $next($request);
        }

        if (! $this->billing->brandCanCreateCampaign($user)) {
            $limit = $this->billing->brandCampaignLimit($user);
            $message = $limit === 0
                ? 'You need an active subscription to create campaigns.'
                : "You have reached your plan's limit of {$limit} active campaigns. Upgrade to create more.";

            return redirect()->route('billing.brand.index')->with('error', $message);
        }

        return $next($request);
    }
}
