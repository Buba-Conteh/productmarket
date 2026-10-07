<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class SetSeoMetaTags
{
    private const ROUTE_META = [
        'login' => [
            'description' => 'Log in to Trendko — your verified creator marketing platform. Access your campaigns, submissions, and earnings dashboard.',
            'ogTitle' => 'Trendko Login',
            'ogDescription' => 'Log in to access your Trendko account and manage campaigns or submissions.',
        ],
        'register' => [
            'description' => 'Sign up for Trendko as a brand or creator. Free account setup with verified creator payments and campaign management.',
            'ogTitle' => 'Join Trendko — Verified Creator Marketing',
            'ogDescription' => 'Create your account now. Join thousands of brands and creators already running verified campaigns on Trendko.',
        ],
        'terms' => [
            'description' => 'Trendko Terms of Service. Read our complete terms and conditions for using our creator marketing platform.',
            'ogTitle' => 'Terms of Service — Trendko',
            'ogDescription' => 'Read Trendko\'s Terms of Service.',
        ],
        'privacy' => [
            'description' => 'Trendko Privacy Policy. Learn how we protect your data and privacy on our creator marketing platform.',
            'ogTitle' => 'Privacy Policy — Trendko',
            'ogDescription' => 'Read Trendko\'s Privacy Policy.',
        ],
        'home' => [
            'description' => 'Connect brands with creators through verified viral campaigns. Contest, Ripple, and Pitch campaigns with real, verified view counts — not self-reporting.',
            'ogTitle' => 'Trendko — Viral Content Marketing You Can Trust',
            'ogDescription' => 'Connect brands with creators through verified campaigns. Pay for real, verified views from TikTok, Instagram, and YouTube.',
        ],
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $route = $request->route()?->getName();
        $meta = self::ROUTE_META[$route] ?? [];

        view()->share([
            'metaDescription' => $meta['description'] ?? null,
            'ogTitle' => $meta['ogTitle'] ?? null,
            'ogDescription' => $meta['ogDescription'] ?? null,
        ]);

        return $next($request);
    }
}
