<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\EarlyAccessSignup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Temporary public lead-capture route: collects an email list of
 * interested creators and brands ahead of/alongside the main
 * registration flow. Not part of the core roadmap — see
 * context/features/early-access-signup.md.
 */
final class EarlyAccessController extends Controller
{
    public function show(Request $request): Response
    {
        return Inertia::render('early-access', [
            'status' => $request->session()->get('status'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:early_access_signups,email'],
            'role' => ['required', 'in:creator,brand'],
        ], [
            'email.unique' => "You're already on the list — we'll be in touch.",
        ]);

        EarlyAccessSignup::create($validated);

        return redirect()
            ->route('early-access.show')
            ->with('status', "You're on the list! We'll reach out as soon as early access opens.");
    }
}
