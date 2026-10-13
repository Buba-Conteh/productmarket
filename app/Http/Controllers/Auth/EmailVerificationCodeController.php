<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\EmailVerificationCodeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class EmailVerificationCodeController extends Controller
{
    /**
     * Verify the emailed code and send the user on to their dashboard.
     */
    public function store(Request $request, EmailVerificationCodeService $codes): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return redirect()->intended(config('fortify.home'));
        }

        $validated = $request->validate([
            'code' => ['required', 'string', 'digits:'.config('auth.email_verification_code.length', 6)],
        ]);

        if (! $codes->verify($user, $validated['code'])) {
            return back()->withErrors([
                'code' => 'That code is invalid or has expired. Request a new one below.',
            ]);
        }

        return redirect()->intended(config('fortify.home').'?verified=1');
    }
}
