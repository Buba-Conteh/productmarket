<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

final class RoleSelectionController extends Controller
{
    /**
     * Show the role picker to a signed-in user who has no role yet.
     */
    public function show(Request $request): RedirectResponse|Response
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->hasSelectedRole()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('auth/select-role', [
            // Phone signups arrive without an email; collect one here so the
            // Brand billing (Stripe) and email notifications have an address.
            'needsEmail' => $user->email === null,
        ]);
    }

    /**
     * Assign the chosen role, then hand off to onboarding via the dashboard.
     */
    public function store(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->hasSelectedRole()) {
            return redirect()->route('dashboard');
        }

        $rules = [
            'role' => ['required', Rule::in(['brand', 'creator'])],
        ];

        // Only require an email from accounts that don't already have one
        // (i.e. phone signups). Google signups already carry a verified email.
        if ($user->email === null) {
            $rules['email'] = ['required', 'string', 'email', 'max:255', Rule::unique(User::class)->ignore($user->id)];
        }

        $validated = $request->validate($rules);

        if ($user->email === null && isset($validated['email'])) {
            $user->forceFill(['email' => $validated['email']])->save();
        }

        $user->assignRole($validated['role']);

        return redirect()->route('dashboard');
    }
}
