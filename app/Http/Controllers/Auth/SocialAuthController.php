<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

final class SocialAuthController extends Controller
{
    /**
     * Allowed providers per role.
     *
     * @var array<string, list<string>>
     */
    private const ROLE_PROVIDERS = [
        'brand' => ['google', 'linkedin'],
        'creator' => ['google'],
    ];

    /**
     * Map route provider names to Socialite driver names.
     *
     * @var array<string, string>
     */
    private const DRIVER_MAP = [
        'google' => 'google',
        'linkedin' => 'linkedin-openid',
    ];

    public function redirect(string $provider): RedirectResponse
    {
        $this->validateProvider($provider);

        $driver = self::DRIVER_MAP[$provider] ?? $provider;

        return Socialite::driver($driver)->redirect();
    }

    public function callback(string $provider): RedirectResponse
    {
        $this->validateProvider($provider);

        $driver = self::DRIVER_MAP[$provider] ?? $provider;
        $socialUser = Socialite::driver($driver)->user();

        $user = DB::transaction(function () use ($socialUser): User {
            $user = User::where('email', $socialUser->getEmail())->first();

            if ($user) {
                return $user;
            }

            return User::create([
                'name' => $socialUser->getName() ?? $socialUser->getNickname() ?? 'User',
                'email' => $socialUser->getEmail(),
                'password' => Str::random(32),
                'email_verified_at' => now(),
            ]);
        });

        Auth::login($user, remember: true);

        return redirect()->intended('/dashboard');
    }

    private function validateProvider(string $provider): void
    {
        $allowed = array_keys(self::DRIVER_MAP);

        abort_unless(in_array($provider, $allowed, true), 404);
    }
}
