<?php

declare(strict_types=1);

return [
    'tiktok' => [
        'client_key' => env('TIKTOK_CLIENT_KEY'),
        'client_secret' => env('TIKTOK_CLIENT_SECRET'),
        'redirect' => env('TIKTOK_REDIRECT_URI', '/auth/tiktok/callback'),
        'scopes' => ['user.info.basic', 'user.info.stats', 'video.list'],
        'authorize_url' => 'https://www.tiktok.com/v2/auth/authorize/',
        'token_url' => 'https://open.tiktokapis.com/v2/oauth/token/',
    ],

    'instagram' => [
        'client_id' => env('INSTAGRAM_CLIENT_ID'),
        'client_secret' => env('INSTAGRAM_CLIENT_SECRET'),
        'redirect' => env('INSTAGRAM_REDIRECT_URI', '/auth/instagram/callback'),
        'scopes' => ['instagram_business_basic', 'instagram_business_content_publish'],
        'authorize_url' => 'https://www.instagram.com/oauth/authorize',
        'token_url' => 'https://api.instagram.com/oauth/access_token',
    ],

    'youtube' => [
        'client_id' => env('YOUTUBE_CLIENT_ID'),
        'client_secret' => env('YOUTUBE_CLIENT_SECRET'),
        'redirect' => env('YOUTUBE_REDIRECT_URI', '/auth/youtube/callback'),
        'scopes' => ['https://www.googleapis.com/auth/youtube.readonly'],
        'authorize_url' => 'https://accounts.google.com/o/oauth2/v2/auth',
        'token_url' => 'https://oauth2.googleapis.com/token',
    ],

    'sync' => [
        'enabled' => env('VIEW_SYNC_ENABLED', true),
        'frequency_hours' => (int) env('VIEW_SYNC_FREQUENCY_HOURS', 6),
        'token_refresh_buffer_minutes' => (int) env('OAUTH_TOKEN_REFRESH_BUFFER_MINUTES', 60),
        'stub_mode' => env('VIEW_SYNC_STUB_MODE', true),
    ],
];
