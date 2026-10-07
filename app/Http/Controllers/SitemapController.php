<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\Response;

final class SitemapController extends Controller
{
    public function xml(): Response
    {
        $urls = [
            ['loc' => url('/'), 'changefreq' => 'monthly', 'priority' => '1.0'],
            ['loc' => url('/login'), 'changefreq' => 'yearly', 'priority' => '0.8'],
            ['loc' => url('/register'), 'changefreq' => 'yearly', 'priority' => '0.8'],
            ['loc' => url('/terms'), 'changefreq' => 'yearly', 'priority' => '0.5'],
            ['loc' => url('/privacy'), 'changefreq' => 'yearly', 'priority' => '0.5'],
            ['loc' => url('/early-access'), 'changefreq' => 'weekly', 'priority' => '0.7'],
        ];

        return response(view('sitemap', ['urls' => $urls]), 200, [
            'Content-Type' => 'application/xml; charset=utf-8',
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
