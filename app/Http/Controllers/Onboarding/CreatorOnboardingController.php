<?php

declare(strict_types=1);

namespace App\Http\Controllers\Onboarding;

use App\Http\Controllers\Controller;
use App\Models\Niche;
use App\Services\StripeConnectService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class CreatorOnboardingController extends Controller
{
    public function __construct(private readonly StripeConnectService $stripeConnect) {}

    public function profile(Request $request): Response|RedirectResponse
    {
        if ($this->isOnboarded($request)) {
            return redirect()->route('dashboard');
        }

        $creatorProfile = $request->user()->creatorProfile;

        return Inertia::render('onboarding/creator/profile', [
            'profile' => $creatorProfile,
        ]);
    }

    public function storeProfile(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'display_name' => ['required', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = $request->user();

        // Also update the user's country and avatar fields
        $userFields = $request->validate([
            'country' => ['nullable', 'string', 'size:2'],
        ]);

        if (! empty($userFields)) {
            $user->update($userFields);
        }

        $user->creatorProfile()->updateOrCreate(
            ['user_id' => $user->id],
            $validated,
        );

        return redirect()->route('onboarding.creator.niches');
    }

    public function niches(Request $request): Response|RedirectResponse
    {
        if ($this->isOnboarded($request)) {
            return redirect()->route('dashboard');
        }

        $profile = $request->user()->creatorProfile;

        if (! $profile) {
            return redirect()->route('onboarding.creator.profile');
        }

        $niches = Niche::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('onboarding/creator/niches', [
            'niches' => $niches,
            'selectedNiches' => $profile->niches->pluck('id'),
        ]);
    }

    public function storeNiches(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'niches' => ['required', 'array', 'min:1', 'max:5'],
            'niches.*' => ['string', 'exists:niches,id'],
        ]);

        $profile = $request->user()->creatorProfile;

        if (! $profile) {
            return redirect()->route('onboarding.creator.profile');
        }

        $profile->niches()->sync($validated['niches']);

        return redirect()->route('onboarding.creator.social');
    }

    public function social(Request $request): Response|RedirectResponse
    {
        if ($this->isOnboarded($request)) {
            return redirect()->route('dashboard');
        }

        $profile = $request->user()->creatorProfile;

        if (! $profile) {
            return redirect()->route('onboarding.creator.profile');
        }

        $socialAccounts = $request->user()->socialAccounts()->with('platform')->get();

        return Inertia::render('onboarding/creator/social', [
            'socialAccounts' => $socialAccounts,
        ]);
    }

    public function storeSocial(Request $request): RedirectResponse
    {
        return redirect()->route('onboarding.creator.payout');
    }

    public function payout(Request $request): Response|RedirectResponse
    {
        if ($this->isOnboarded($request)) {
            return redirect()->route('dashboard');
        }

        $profile = $request->user()->creatorProfile;

        if (! $profile) {
            return redirect()->route('onboarding.creator.profile');
        }

        return Inertia::render('onboarding/creator/payout', [
            'profile' => [
                'stripe_connect_id' => $profile->stripe_connect_id,
                'stripe_connect_status' => $profile->stripe_connect_status,
            ],
            'plans' => config('billing.creator_plans'),
        ]);
    }

    /**
     * Initiate Stripe Connect Express onboarding: create an account if needed,
     * then redirect the creator to Stripe's hosted onboarding flow.
     */
    public function connectStripe(Request $request): RedirectResponse
    {
        $profile = $request->user()->creatorProfile;

        if (! $profile) {
            return redirect()->route('onboarding.creator.profile');
        }

        if (! $profile->stripe_connect_id) {
            $this->stripeConnect->createExpressAccount($profile);
        }

        $onboardingUrl = $this->stripeConnect->createOnboardingLink(
            $profile,
            route('onboarding.creator.stripe.return'),
            route('onboarding.creator.stripe.refresh'),
        );

        return redirect()->away($onboardingUrl);
    }

    /**
     * Stripe redirects here after the creator finishes (or exits) onboarding.
     * We sync the account status and return them to the payout step.
     */
    public function stripeReturn(Request $request): RedirectResponse
    {
        $profile = $request->user()->creatorProfile;

        if ($profile?->stripe_connect_id) {
            $this->stripeConnect->syncAccountStatus($profile);
        }

        return redirect()->route('onboarding.creator.payout');
    }

    /**
     * Stripe redirects here when the onboarding link expires.
     * We generate a fresh link and redirect the creator back to Stripe.
     */
    public function stripeRefresh(Request $request): RedirectResponse
    {
        $profile = $request->user()->creatorProfile;

        if (! $profile?->stripe_connect_id) {
            return redirect()->route('onboarding.creator.payout');
        }

        $onboardingUrl = $this->stripeConnect->createOnboardingLink(
            $profile,
            route('onboarding.creator.stripe.return'),
            route('onboarding.creator.stripe.refresh'),
        );

        return redirect()->away($onboardingUrl);
    }

    public function complete(Request $request): RedirectResponse
    {
        $profile = $request->user()->creatorProfile;

        if (! $profile) {
            return redirect()->route('onboarding.creator.profile');
        }

        $profile->update(['onboarding_completed_at' => now()]);

        return redirect()->route('dashboard');
    }

    private function isOnboarded(Request $request): bool
    {
        $profile = $request->user()->creatorProfile;

        return $profile && $profile->isOnboarded();
    }
}
