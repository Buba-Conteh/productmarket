<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\ReferralService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Remembers a `?ref=CODE` from any guest page visit so every signup path —
 * email, Google/LinkedIn and phone — can attach it once the role is chosen.
 */
final class CaptureReferralCode
{
    public function handle(Request $request, Closure $next): Response
    {
        $code = $request->query('ref');

        if (
            $request->isMethod('GET')
            && is_string($code)
            && preg_match('/^[A-Za-z0-9]{4,32}$/', $code) === 1
            && ! $request->user()
        ) {
            $request->session()->put(ReferralService::SESSION_KEY, strtoupper($code));
        }

        return $next($request);
    }
}
