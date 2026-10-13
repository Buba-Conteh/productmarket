<?php

declare(strict_types=1);

namespace App\Http\Controllers\Settings;

use App\Exceptions\UnsupportedPayoutCountryException;
use App\Http\Controllers\Controller;
use App\Services\CreatorWalletService;
use App\Services\StripeConnectService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Stripe\Exception\ApiErrorException;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * Lets a creator connect or manage their Stripe Express payout account at any
 * time after onboarding.
 */
final class PayoutAccountController extends Controller
{
    public function edit(Request $request, StripeConnectService $stripeConnect, CreatorWalletService $wallet): Response
    {
        $profile = $request->user()->creatorProfile;

        // Self-heal: if Stripe finished verification since we last looked, pick it up.
        if ($profile->stripe_connect_id && $profile->stripe_connect_status !== 'active') {
            try {
                $stripeConnect->syncAccountStatus($profile);
            } catch (ApiErrorException $e) {
                Log::warning('Could not sync Stripe Connect status', [
                    'creator_profile_id' => $profile->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return Inertia::render('settings/payout-account', [
            'account' => [
                'connected' => $profile->stripe_connect_id !== null,
                'status' => $profile->stripe_connect_id ? $profile->stripe_connect_status : null,
                'country' => $request->user()->country,
            ],
            'wallet' => $wallet->summary($profile)->toArray(),
        ]);
    }

    /**
     * Create the Express account if needed, then send the creator to Stripe's
     * hosted onboarding to add or finish their bank details.
     */
    public function connect(Request $request, StripeConnectService $stripeConnect): SymfonyResponse
    {
        $user = $request->user();
        $profile = $user->creatorProfile;

        // Creators who never set a country pick one here; the payout account
        // must be created in the country where their bank account is.
        if (! $user->country) {
            $validated = $request->validate([
                'country' => ['required', 'string', 'size:2', 'alpha'],
            ]);

            $user->update(['country' => strtoupper($validated['country'])]);
        }

        try {
            $stripeConnect->prepareAccount($profile);

            $url = $stripeConnect->createOnboardingLink(
                $profile,
                route('settings.payout-account.return'),
                route('settings.payout-account.refresh'),
            );
        } catch (UnsupportedPayoutCountryException $e) {
            return redirect()->route('settings.payout-account.edit')->with('error', $e->getMessage());
        } catch (ApiErrorException $e) {
            Log::error('Stripe Connect onboarding link failed', [
                'creator_profile_id' => $profile->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'We could not reach Stripe. Please try again in a moment.');
        }

        return Inertia::location($url);
    }

    /**
     * Open the creator's Stripe Express dashboard to change their bank account or card.
     */
    public function dashboard(Request $request, StripeConnectService $stripeConnect): SymfonyResponse
    {
        $profile = $request->user()->creatorProfile;

        if (! $profile->canReceivePayouts()) {
            return redirect()->route('settings.payout-account.edit');
        }

        try {
            return Inertia::location($stripeConnect->createDashboardLink($profile));
        } catch (ApiErrorException $e) {
            Log::error('Stripe Express dashboard link failed', [
                'creator_profile_id' => $profile->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'We could not reach Stripe. Please try again in a moment.');
        }
    }

    /**
     * Stripe redirects here when the creator finishes (or leaves) onboarding.
     */
    public function return(Request $request, StripeConnectService $stripeConnect): RedirectResponse
    {
        $profile = $request->user()->creatorProfile;

        if ($profile->stripe_connect_id) {
            try {
                $status = $stripeConnect->syncAccountStatus($profile);
            } catch (ApiErrorException) {
                $status = $profile->stripe_connect_status;
            }

            if ($status === 'active') {
                return redirect()->route('settings.payout-account.edit')
                    ->with('success', 'Payout account connected. Any pending earnings are on their way.');
            }
        }

        return redirect()->route('settings.payout-account.edit');
    }

    /**
     * Stripe redirects here when the onboarding link has expired — issue a fresh one.
     */
    public function refresh(Request $request, StripeConnectService $stripeConnect): SymfonyResponse
    {
        return $this->connect($request, $stripeConnect);
    }
}
