<?php

declare(strict_types=1);

namespace App\Http\Controllers\Onboarding;

use App\Http\Controllers\Controller;
use App\Models\Industry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

final class BrandOnboardingController extends Controller
{
    public function company(Request $request): Response|RedirectResponse
    {
        if ($this->isOnboarded($request)) {
            return redirect()->route('dashboard');
        }

        $industries = Industry::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        $profile = $request->user()->brandProfile;

        return Inertia::render('onboarding/brand/company', [
            'industries' => $industries,
            'profile' => $profile,
        ]);
    }

    public function storeCompany(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'website' => ['nullable', 'url', 'max:255'],
            'industry_id' => ['required', 'string', Rule::exists('industries', 'id')],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = $request->user();

        $user->brandProfile()->updateOrCreate(
            ['user_id' => $user->id],
            $validated,
        );

        return redirect()->route('onboarding.brand.billing');
    }

    public function billing(Request $request): Response|RedirectResponse
    {
        if ($this->isOnboarded($request)) {
            return redirect()->route('dashboard');
        }

        $profile = $request->user()->brandProfile;

        if (! $profile) {
            return redirect()->route('onboarding.brand.company');
        }

        $user = $request->user();
        $subscribed = $user->subscribed('brand');

        return Inertia::render('onboarding/brand/billing', [
            'profile' => $profile,
            'plans' => config('billing.brand_plans'),
            'subscribed' => $subscribed,
        ]);
    }

    public function storeBilling(Request $request): RedirectResponse
    {
        // Skip billing — proceed to tour without a subscription.
        return redirect()->route('onboarding.brand.tour');
    }

    public function tour(Request $request): Response|RedirectResponse
    {
        if ($this->isOnboarded($request)) {
            return redirect()->route('dashboard');
        }

        $profile = $request->user()->brandProfile;

        if (! $profile) {
            return redirect()->route('onboarding.brand.company');
        }

        return Inertia::render('onboarding/brand/tour', [
            'profile' => $profile->load('industry'),
        ]);
    }

    public function complete(Request $request): RedirectResponse
    {
        $profile = $request->user()->brandProfile;

        if (! $profile) {
            return redirect()->route('onboarding.brand.company');
        }

        $profile->update(['onboarding_completed_at' => now()]);

        return redirect()->route('dashboard');
    }

    private function isOnboarded(Request $request): bool
    {
        $profile = $request->user()->brandProfile;

        return $profile && $profile->isOnboarded();
    }
}
