<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- SEO Meta Tags --}}
        <meta name="description" content="{{ $metaDescription ?? 'Connect brands with creators through verified viral campaigns. Contest, Ripple, and Pitch campaigns with real, verified view counts.' }}">
        <meta name="keywords" content="creator marketing, influencer campaigns, verified views, brand collaborations, TikTok campaigns">
        <meta name="author" content="Trendko">
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">

        {{-- Open Graph (Facebook, LinkedIn) --}}
        <meta property="og:type" content="{{ $ogType ?? 'website' }}">
        <meta property="og:title" content="{{ $ogTitle ?? config('app.name') . ' — Viral Content Marketing' }}">
        <meta property="og:description" content="{{ $ogDescription ?? 'Connect brands with creators through verified viral campaigns.' }}">
        <meta property="og:url" content="{{ url()->current() }}">
        <meta property="og:site_name" content="{{ config('app.name') }}">
        <meta property="og:image" content="{{ $ogImage ?? 'https://trendko.com/og-default.png' }}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:locale" content="en_US">

        {{-- Twitter/X Card --}}
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ $twitterTitle ?? config('app.name') . ' — Viral Content Marketing' }}">
        <meta name="twitter:description" content="{{ $twitterDescription ?? 'Connect brands with creators through verified viral campaigns.' }}">
        <meta name="twitter:image" content="{{ $twitterImage ?? 'https://trendko.com/og-default.png' }}">
        <meta name="twitter:site" content="@trendko">
        <meta name="twitter:creator" content="@trendko">

        {{-- Canonical URL --}}
        <link rel="canonical" href="{{ url()->current() }}">

        {{-- Additional SEO --}}
        <meta name="theme-color" content="#f97316">
        <link rel="sitemap" type="application/xml" href="{{ route('sitemap.xml') }}">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        {{-- Polyfill crypto.randomUUID for non-secure HTTP contexts (Vite HMR requires it) --}}
        <script>
            if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
                crypto.randomUUID = function () {
                    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, function (c) {
                        var n = parseInt(c, 10);
                        return (n ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> n / 4).toString(16);
                    });
                };
            }
        </script>

        @routes
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
