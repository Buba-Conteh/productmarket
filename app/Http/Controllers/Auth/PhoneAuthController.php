<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\PhoneOtpService;
use App\Services\ReferralService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

final class PhoneAuthController extends Controller
{
    private const SESSION_PHONE = 'phone_auth.phone';

    public function __construct(
        private readonly PhoneOtpService $otp,
        private readonly ReferralService $referralService,
    ) {}

    /**
     * Show the phone-number entry screen (shared by signup and login).
     */
    public function show(): Response
    {
        return Inertia::render('auth/phone');
    }

    /**
     * Validate the phone, issue an OTP, and move to the verification screen.
     */
    public function sendCode(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'regex:/^\+?[1-9]\d{6,14}$/'],
        ], [
            'phone.regex' => 'Enter a valid phone number in international format, e.g. +14155552671.',
        ]);

        $phone = $this->normalize($validated['phone']);

        if (! $this->otp->send($phone)) {
            return back()->withErrors([
                'phone' => 'Please wait a moment before requesting another code.',
            ]);
        }

        $request->session()->put(self::SESSION_PHONE, $phone);

        return redirect()->route('phone.verify');
    }

    /**
     * Show the OTP entry screen for the phone stored in the session.
     */
    public function showVerify(Request $request): RedirectResponse|Response
    {
        $phone = $request->session()->get(self::SESSION_PHONE);

        if (! $phone) {
            return redirect()->route('phone.login');
        }

        return Inertia::render('auth/phone-verify', [
            'phone' => $phone,
        ]);
    }

    /**
     * Verify the OTP, then log the creator in (creating the account if new).
     */
    public function verify(Request $request): RedirectResponse
    {
        $phone = $request->session()->get(self::SESSION_PHONE);

        if (! $phone) {
            return redirect()->route('phone.login');
        }

        $validated = $request->validate([
            'code' => ['required', 'string'],
        ]);

        if (! $this->otp->verify($phone, $validated['code'])) {
            return back()->withErrors([
                'code' => 'That code is invalid or has expired. Please try again.',
            ]);
        }

        $user = $this->resolveUser($phone);

        $request->session()->forget(self::SESSION_PHONE);

        Auth::login($user, remember: true);

        return redirect()->intended('/dashboard');
    }

    /**
     * Re-issue an OTP for the phone stored in the session.
     */
    public function resend(Request $request): RedirectResponse
    {
        $phone = $request->session()->get(self::SESSION_PHONE);

        if (! $phone) {
            return redirect()->route('phone.login');
        }

        if (! $this->otp->send($phone)) {
            return back()->withErrors([
                'code' => 'Please wait a moment before requesting another code.',
            ]);
        }

        return back()->with('status', 'A new code has been sent.');
    }

    /**
     * Find the account for this phone or create a role-less one to onboard.
     */
    private function resolveUser(string $phone): User
    {
        return DB::transaction(function () use ($phone): User {
            $user = User::where('phone', $phone)->first();

            if ($user) {
                if (! $user->phone_verified_at) {
                    $user->forceFill(['phone_verified_at' => now()])->save();
                }

                return $user;
            }

            return User::create([
                'name' => 'User',
                'phone' => $phone,
                'password' => Str::random(32),
                // No email to verify — treat the account as verified so the
                // `verified` middleware and onboarding gate let them through.
                'email_verified_at' => now(),
                'phone_verified_at' => now(),
                'referral_code' => $this->referralService->generateCode(new User),
            ]);
        });
    }

    private function normalize(string $phone): string
    {
        $digits = preg_replace('/[^\d+]/', '', $phone) ?? '';

        return str_starts_with($digits, '+') ? $digits : '+'.$digits;
    }
}
