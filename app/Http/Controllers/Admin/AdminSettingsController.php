<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class AdminSettingsController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('admin/settings', [
            'settings' => PlatformSetting::current(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'platform_fee_pct' => ['required', 'numeric', 'min:0', 'max:100'],
            'contest_split_first' => ['required', 'numeric', 'min:0', 'max:100'],
            'contest_split_second' => ['required', 'numeric', 'min:0', 'max:100'],
            'contest_split_third' => ['required', 'numeric', 'min:0', 'max:100'],
            'contest_split_pool' => ['required', 'numeric', 'min:0', 'max:100'],
            'min_creator_payout' => ['required', 'numeric', 'min:0'],
            'referral_creator_bonus' => ['required', 'numeric', 'min:0'],
            'referral_brand_credit' => ['required', 'numeric', 'min:0'],
        ]);

        // Validate contest split sums do not exceed 100%.
        $splitSum = $validated['contest_split_first']
            + $validated['contest_split_second']
            + $validated['contest_split_third']
            + $validated['contest_split_pool'];

        if ($splitSum > 100) {
            return back()->withErrors([
                'contest_split_first' => 'Contest split percentages must not exceed 100%.',
            ]);
        }

        PlatformSetting::current()->update($validated);

        return back()->with('success', 'Platform settings saved.');
    }
}
