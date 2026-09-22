<?php

declare(strict_types=1);

use App\Services\Social\Exceptions\PlatformConnectionException;
use App\Services\Social\PlatformProviderFactory;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    // Exercise the real HTTP path, not the stubs.
    config([
        'social_oauth.sync.stub_mode' => false,
        'social_oauth.tiktok.client_key' => 'test-client-key',
        'social_oauth.tiktok.client_secret' => 'test-client-secret',
        'social_oauth.youtube.client_id' => 'test-google-id',
        'social_oauth.youtube.client_secret' => 'test-google-secret',
    ]);
});

test('tiktok exchanges the code using client_key, not client_id', function () {
    Http::fake([
        'open.tiktokapis.com/v2/oauth/token/' => Http::response([
            'access_token' => 'tt-access',
            'refresh_token' => 'tt-refresh',
            'expires_in' => 86400,
        ]),
    ]);

    app(PlatformProviderFactory::class)->make('tiktok')->exchangeCodeForToken('auth-code');

    Http::assertSent(function (Request $request) {
        $body = $request->data();

        // TikTok rejects the exchange when sent `client_id`.
        return $body['client_key'] === 'test-client-key'
            && ! array_key_exists('client_id', $body)
            && $body['client_secret'] === 'test-client-secret'
            && $body['code'] === 'auth-code'
            && $body['grant_type'] === 'authorization_code';
    });
});

test('providers that use the standard name still send client_id', function () {
    Http::fake([
        'oauth2.googleapis.com/token' => Http::response(['access_token' => 'yt-access']),
    ]);

    app(PlatformProviderFactory::class)->make('youtube')->exchangeCodeForToken('auth-code');

    Http::assertSent(fn (Request $request) => $request->data()['client_id'] === 'test-google-id'
        && ! array_key_exists('client_key', $request->data()));
});

test('a 200 response carrying an error is treated as a failure, with the reason kept', function () {
    // TikTok answers some failures with HTTP 200 and an error body.
    Http::fake([
        'open.tiktokapis.com/v2/oauth/token/' => Http::response([
            'error' => 'invalid_grant',
            'error_description' => 'Authorization code is expired.',
        ], 200),
    ]);

    expect(fn () => app(PlatformProviderFactory::class)->make('tiktok')->exchangeCodeForToken('stale'))
        ->toThrow(
            PlatformConnectionException::class,
            'invalid_grant: Authorization code is expired.',
        );
});

test('a success response whose error field is ok is not treated as a failure', function () {
    Http::fake([
        'open.tiktokapis.com/v2/oauth/token/' => Http::response([
            'access_token' => 'tt-access',
            'expires_in' => 86400,
            'error' => 'ok',
        ]),
    ]);

    $tokens = app(PlatformProviderFactory::class)->make('tiktok')->exchangeCodeForToken('auth-code');

    expect($tokens->accessToken)->toBe('tt-access');
});
