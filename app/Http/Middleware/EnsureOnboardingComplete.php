<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureOnboardingComplete
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasVerifiedEmail()) {
            return $next($request);
        }

        if ($user->hasRole('brand')) {
            $profile = $user->brandProfile;

            if (! $profile || ! $profile->isOnboarded()) {
                return redirect()->route('onboarding.brand.company');
            }
        }

        if ($user->hasRole('creator')) {
            $profile = $user->creatorProfile;

            if (! $profile || ! $profile->isOnboarded()) {
                return redirect()->route('onboarding.creator.profile');
            }
        }

        return $next($request);
    }
}
