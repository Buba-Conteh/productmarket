<?php

declare(strict_types=1);

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Services\BillingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class BillingController extends Controller
{
    public function __construct(private readonly BillingService $billing) {}

    /**
     * Brand billing dashboard.
     */
    public function brandIndex(Request $request): Response
    {
        $user = $request->user();
        $subscription = $user->subscription('brand');
        $planKey = $this->billing->brandPlanKey($user);
        $plan = $planKey ? config("billing.brand_plans.{$planKey}") : null;

        return Inertia::render('settings/billing/brand', [
            'plans' => config('billing.brand_plans'),
            'currentPlan' => $planKey,
            'planDetails' => $plan,
            'subscription' => $subscription ? [
                'status' => $subscription->stripe_status,
                'ends_at' => $subscription->ends_at?->toIso8601String(),
                'is_annual' => $this->billing->isAnnual($subscription),
                'cancel_url' => route('billing.brand.cancel'),
                'resume_url' => route('billing.brand.resume'),
            ] : null,
            'invoices' => $this->billing->invoices($user),
        ]);
    }

    /**
     * Creator billing dashboard.
     */
    public function creatorIndex(Request $request): Response
    {
        $user = $request->user();
        $subscription = $user->subscription('creator');
        $planKey = $this->billing->creatorPlanKey($user);

        return Inertia::render('settings/billing/creator', [
            'plans' => config('billing.creator_plans'),
            'currentPlan' => $planKey,
            'planDetails' => config("billing.creator_plans.{$planKey}"),
            'subscription' => $subscription && $subscription->active() ? [
                'status' => $subscription->stripe_status,
                'ends_at' => $subscription->ends_at?->toIso8601String(),
                'is_annual' => $this->billing->isAnnual($subscription),
                'cancel_url' => route('billing.creator.cancel'),
                'resume_url' => route('billing.creator.resume'),
            ] : null,
            'invoices' => $this->billing->invoices($user),
        ]);
    }

    /**
     * Redirect to Stripe Checkout for brand plan.
     * ?plan=starter|growth|scale  &interval=monthly|annual
     */
    public function brandCheckout(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'plan' => ['required', 'string', 'in:starter,growth,scale'],
            'interval' => ['required', 'string', 'in:monthly,annual'],
        ]);

        $priceKey = "stripe_{$validated['interval']}";
        $priceId = config("billing.brand_plans.{$validated['plan']}.{$priceKey}");

        if (! $priceId) {
            return back()->withErrors(['plan' => 'This plan is not available yet. Please contact support.']);
        }

        $user = $request->user();

        // If already subscribed, swap to the new plan.
        if ($user->subscribed('brand')) {
            $user->subscription('brand')->swap($priceId);

            return redirect()->route('billing.brand.index')
                ->with('success', 'Your plan has been updated.');
        }

        $checkout = $user->newSubscription('brand', $priceId)
            ->checkout([
                'success_url' => route('billing.brand.success').'?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => route('billing.brand.index'),
            ]);

        return redirect($checkout->url);
    }

    /**
     * Redirect to Stripe Checkout for creator pro plan.
     */
    public function creatorCheckout(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'interval' => ['required', 'string', 'in:monthly,annual'],
        ]);

        $priceKey = "stripe_{$validated['interval']}";
        $priceId = config("billing.creator_plans.pro.{$priceKey}");

        if (! $priceId) {
            return back()->withErrors(['plan' => 'Creator Pro is not available yet. Please contact support.']);
        }

        $user = $request->user();

        if ($user->subscribed('creator')) {
            $user->subscription('creator')->swap($priceId);

            return redirect()->route('billing.creator.index')
                ->with('success', 'Your plan has been updated.');
        }

        $checkout = $user->newSubscription('creator', $priceId)
            ->checkout([
                'success_url' => route('billing.creator.success').'?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => route('billing.creator.index'),
            ]);

        return redirect($checkout->url);
    }

    /**
     * Open Stripe Billing Portal for the authenticated user.
     */
    public function portal(Request $request): RedirectResponse
    {
        return $request->user()->redirectToBillingPortal(
            route($request->user()->hasRole('brand') ? 'billing.brand.index' : 'billing.creator.index')
        );
    }

    /**
     * Cancel brand subscription at period end.
     */
    public function brandCancel(Request $request): RedirectResponse
    {
        $subscription = $request->user()->subscription('brand');

        if ($subscription && $subscription->active()) {
            $subscription->cancel();
        }

        return redirect()->route('billing.brand.index')
            ->with('success', 'Your subscription will be cancelled at the end of the billing period.');
    }

    /**
     * Resume a cancelled brand subscription.
     */
    public function brandResume(Request $request): RedirectResponse
    {
        $subscription = $request->user()->subscription('brand');

        if ($subscription && $subscription->onGracePeriod()) {
            $subscription->resume();
        }

        return redirect()->route('billing.brand.index')
            ->with('success', 'Your subscription has been resumed.');
    }

    /**
     * Cancel creator subscription at period end.
     */
    public function creatorCancel(Request $request): RedirectResponse
    {
        $subscription = $request->user()->subscription('creator');

        if ($subscription && $subscription->active()) {
            $subscription->cancel();
        }

        return redirect()->route('billing.creator.index')
            ->with('success', 'Your subscription will be cancelled at the end of the billing period.');
    }

    /**
     * Resume a cancelled creator subscription.
     */
    public function creatorResume(Request $request): RedirectResponse
    {
        $subscription = $request->user()->subscription('creator');

        if ($subscription && $subscription->onGracePeriod()) {
            $subscription->resume();
        }

        return redirect()->route('billing.creator.index')
            ->with('success', 'Your subscription has been resumed.');
    }

    /**
     * Handle successful brand checkout redirect from Stripe.
     */
    public function brandSuccess(Request $request): RedirectResponse
    {
        return redirect()->route('billing.brand.index')
            ->with('success', 'Welcome! Your subscription is now active.');
    }

    /**
     * Handle successful creator checkout redirect from Stripe.
     */
    public function creatorSuccess(Request $request): RedirectResponse
    {
        return redirect()->route('billing.creator.index')
            ->with('success', 'Welcome to Creator Pro!');
    }

    /**
     * Onboarding billing step: create checkout session and redirect.
     * Called from brand onboarding flow.
     */
    public function onboardingBrandCheckout(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'plan' => ['required', 'string', 'in:starter,growth,scale'],
            'interval' => ['required', 'string', 'in:monthly,annual'],
        ]);

        $priceKey = "stripe_{$validated['interval']}";
        $priceId = config("billing.brand_plans.{$validated['plan']}.{$priceKey}");

        if (! $priceId) {
            return redirect()->route('onboarding.brand.tour');
        }

        $user = $request->user();

        $checkout = $user->newSubscription('brand', $priceId)
            ->checkout([
                'success_url' => route('onboarding.brand.tour').'?subscribed=1',
                'cancel_url' => route('onboarding.brand.billing'),
            ]);

        return redirect($checkout->url);
    }
}
