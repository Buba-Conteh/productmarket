<?php

declare(strict_types=1);

namespace App\Http\Controllers\Growth;

use App\Http\Controllers\Controller;
use App\Models\AgencyMember;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class AgencyController extends Controller
{
    public function index(Request $request): Response
    {
        $brand = $request->user()->brandProfile;
        abort_unless($brand && $brand->is_agency, 403, 'Agency mode is not enabled for your account.');

        $members = AgencyMember::where('agency_brand_profile_id', $brand->id)
            ->with('user:id,name,email')
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'name' => $m->user->name,
                'email' => $m->user->email,
                'role' => $m->role,
                'invited_at' => $m->invited_at,
                'accepted_at' => $m->accepted_at,
            ]);

        return Inertia::render('growth/agency', [
            'members' => $members,
            'brand' => $brand->only('id', 'company_name', 'is_agency'),
        ]);
    }

    public function invite(Request $request): RedirectResponse
    {
        $brand = $request->user()->brandProfile;
        abort_unless($brand && $brand->is_agency, 403);

        $validated = $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
            'role' => ['required', 'in:manager,viewer'],
        ]);

        $invitedUser = User::where('email', $validated['email'])->firstOrFail();

        AgencyMember::updateOrCreate(
            ['agency_brand_profile_id' => $brand->id, 'user_id' => $invitedUser->id],
            ['role' => $validated['role'], 'invited_at' => now(), 'accepted_at' => null],
        );

        return back()->with('success', 'Team member invited.');
    }

    public function accept(Request $request): RedirectResponse
    {
        $member = AgencyMember::where('user_id', $request->user()->id)
            ->whereNull('accepted_at')
            ->firstOrFail();

        $member->update(['accepted_at' => now()]);

        return back()->with('success', 'You have joined the agency team.');
    }

    public function remove(Request $request, AgencyMember $member): RedirectResponse
    {
        $brand = $request->user()->brandProfile;
        abort_unless($brand && $member->agency_brand_profile_id === $brand->id, 403);

        $member->delete();

        return back()->with('success', 'Team member removed.');
    }

    public function enableAgency(Request $request): RedirectResponse
    {
        $brand = $request->user()->brandProfile;
        abort_unless($brand, 403);

        // Only Scale plan brands can enable agency mode
        $plan = $request->user()->subscription('brand')?->items->first()?->stripe_price ?? null;
        $isScale = str_contains((string) $plan, 'scale');
        abort_unless($isScale || app()->isLocal(), 403, 'Agency mode requires the Scale plan.');

        $brand->update(['is_agency' => true]);

        return back()->with('success', 'Agency mode enabled.');
    }
}
