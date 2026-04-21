<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

final class AdminUserController extends Controller
{
    public function index(Request $request): Response
    {
        $query = User::with(['roles'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->role($request->string('role')->toString());
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $users = $query->paginate(20)->withQueryString();

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role', 'status']),
        ]);
    }

    public function show(User $user): Response
    {
        $user->load(['roles', 'brandProfile.industry', 'creatorProfile.niches', 'socialAccounts']);

        return Inertia::render('admin/users/show', [
            'user' => $user,
        ]);
    }

    public function updateStatus(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'suspended', 'banned'])],
        ]);

        // Prevent admin from changing their own status.
        if ($user->id === $request->user()->id) {
            return back()->withErrors(['status' => 'You cannot change your own status.']);
        }

        $user->update(['status' => $validated['status']]);

        return back()->with('success', "User status updated to {$validated['status']}.");
    }
}
