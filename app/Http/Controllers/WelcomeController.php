<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

final class WelcomeController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('welcome', [
            'canRegister' => Features::enabled(Features::registration()),
            'metaDescription' => 'Connect brands with creators through verified viral campaigns. Contest, Ripple, and Pitch campaigns with real, verified view counts — not self-reporting.',
            'ogTitle' => 'Trendko — Viral Content Marketing You Can Trust',
            'ogDescription' => 'Connect brands with creators through verified campaigns. Pay for real, verified views from TikTok, Instagram, and YouTube.',
            'ogImage' => 'https://trendko.com/og-welcome.png',
            'twitterTitle' => 'Trendko — Verified Creator Campaigns',
            'twitterDescription' => 'Stop taking creators at their word. Get real, verified view counts from platform APIs.',
            'twitterImage' => 'https://trendko.com/og-welcome.png',
        ]);
    }
}
