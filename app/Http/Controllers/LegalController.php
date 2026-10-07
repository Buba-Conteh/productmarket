<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

final class LegalController extends Controller
{
    public function terms(): Response
    {
        return Inertia::render('legal/terms', [
            'metaDescription' => 'Trendko Terms of Service. Read our complete terms and conditions for using our creator marketing platform.',
            'ogTitle' => 'Terms of Service — Trendko',
            'ogDescription' => 'Read Trendko\'s Terms of Service.',
        ]);
    }

    public function privacy(): Response
    {
        return Inertia::render('legal/privacy', [
            'metaDescription' => 'Trendko Privacy Policy. Learn how we protect your data and privacy on our creator marketing platform.',
            'ogTitle' => 'Privacy Policy — Trendko',
            'ogDescription' => 'Read Trendko\'s Privacy Policy.',
        ]);
    }
}
