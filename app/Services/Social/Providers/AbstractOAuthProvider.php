<?php

declare(strict_types=1);

namespace App\Services\Social\Providers;

use App\Models\SocialAccount;
use App\Services\Social\Contracts\PlatformProvider;
use App\Services\Social\DataObjects\TokenSet;
use App\Services\Social\Exceptions\PlatformConnectionException;
use Carbon\CarbonImmutable;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

abstract class AbstractOAuthProvider implements PlatformProvider
{
    /**
     * @param  array<string, mixed>  $config
     */
    public function __construct(protected readonly array $config) {}

    abstract public function platformSlug(): string;

    abstract protected function clientIdKey(): string;

    abstract protected function clientSecretKey(): string;

    /**
     * The query-string parameter name for the client ID in the authorization URL.
     * TikTok uses "client_key" instead of the standard "client_id".
     */
    protected function clientIdParamName(): string
    {
        return 'client_id';
    }

    /**
     * Separator between scopes in the authorization URL.
     * TikTok requires comma-separated scopes; most providers use a space.
     */
    protected function scopeSeparator(): string
    {
        return ' ';
    }

    public function getAuthorizationUrl(string $state): string
    {
        $this->assertConfigured();

        $params = array_merge([
            $this->clientIdParamName() => $this->config[$this->clientIdKey()],
            'redirect_uri' => $this->redirectUri(),
            'response_type' => 'code',
            'scope' => implode($this->scopeSeparator(), $this->config['scopes'] ?? []),
            'state' => $state,
        ], $this->extraAuthParams());

        return $this->config['authorize_url'].'?'.http_build_query($params);
    }

    /**
     * Extra query parameters to append to the OAuth authorization URL.
     * Override in subclasses (e.g. YouTube needs access_type=offline).
     *
     * @return array<string, string>
     */
    protected function extraAuthParams(): array
    {
        return [];
    }

    public function exchangeCodeForToken(string $code): TokenSet
    {
        $this->assertConfigured();

        if ($this->stubMode()) {
            return $this->stubTokenSet();
        }

        $response = Http::asForm()->post($this->config['token_url'], $this->tokenRequestPayload([
            'code' => $code,
            'grant_type' => 'authorization_code',
            'redirect_uri' => $this->redirectUri(),
        ]));

        if ($error = $this->tokenResponseError($response)) {
            throw PlatformConnectionException::tokenExchangeFailed(
                $this->platformSlug(),
                $error,
            );
        }

        return $this->parseTokenResponse($response->json());
    }

    public function refreshAccessToken(SocialAccount $account): TokenSet
    {
        $this->assertConfigured();

        if ($this->stubMode()) {
            return $this->stubTokenSet();
        }

        if (! $account->oauth_refresh_token) {
            throw PlatformConnectionException::refreshFailed(
                $this->platformSlug(),
                'No refresh token on account.',
            );
        }

        $response = Http::asForm()->post($this->config['token_url'], $this->tokenRequestPayload([
            'refresh_token' => $account->oauth_refresh_token,
            'grant_type' => 'refresh_token',
        ]));

        if ($error = $this->tokenResponseError($response)) {
            throw PlatformConnectionException::refreshFailed(
                $this->platformSlug(),
                $error,
            );
        }

        return $this->parseTokenResponse($response->json());
    }

    /**
     * Credentials for a token request, keyed by the name the platform expects.
     *
     * TikTok's /v2/oauth/token/ requires `client_key`, not the standard
     * `client_id` — the same distinction `clientIdParamName()` already makes for
     * the authorization URL. Sending `client_id` makes TikTok reject the
     * exchange, which surfaces to the creator as a failed connection.
     *
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    protected function tokenRequestPayload(array $extra): array
    {
        return array_merge([
            $this->clientIdParamName() => $this->config[$this->clientIdKey()],
            'client_secret' => $this->config[$this->clientSecretKey()],
        ], $extra);
    }

    /**
     * The platform's own error message, or null when the response is good.
     *
     * TikTok answers some failures with HTTP 200 and an `error` body, so status
     * alone is not enough. Returning the platform's `error_description` keeps the
     * real reason in the logs instead of a bare "access token missing".
     */
    protected function tokenResponseError(Response $response): ?string
    {
        if ($response->failed()) {
            return (string) $response->body();
        }

        $error = $response->json('error');

        // Some platforms report success as error: "ok" or an {code: "ok"} object.
        if (is_array($error)) {
            $error = $error['code'] ?? null;
        }

        if (! is_string($error) || $error === '' || $error === 'ok') {
            return null;
        }

        $description = $response->json('error_description');

        return $description ? "{$error}: {$description}" : $error;
    }

    /**
     * Where the platform returns the creator after they grant permission.
     *
     * This is always the account-connect callback, derived from the route so it
     * cannot drift onto the social *login* callback (`auth/{provider}/callback`).
     * That route is wrapped in `guest` middleware, so an authenticated creator
     * sent there is bounced to the dashboard and the connection is silently lost.
     *
     * This exact URL must be registered as an allowed redirect URI in each
     * platform's developer portal.
     */
    protected function redirectUri(): string
    {
        return route('creator.social.callback', ['platform' => $this->platformSlug()]);
    }

    protected function stubMode(): bool
    {
        return (bool) config('social_oauth.sync.stub_mode', true);
    }

    protected function assertConfigured(): void
    {
        if ($this->stubMode()) {
            return;
        }

        $id = $this->config[$this->clientIdKey()] ?? null;
        $secret = $this->config[$this->clientSecretKey()] ?? null;

        if (empty($id) || empty($secret)) {
            throw PlatformConnectionException::notConfigured($this->platformSlug());
        }
    }

    protected function stubTokenSet(): TokenSet
    {
        return new TokenSet(
            accessToken: 'stub_access_token_'.$this->platformSlug(),
            refreshToken: 'stub_refresh_token_'.$this->platformSlug(),
            expiresAt: CarbonImmutable::now()->addHours(2),
        );
    }

    /**
     * @param  array<string, mixed>|null  $payload
     */
    protected function parseTokenResponse(?array $payload): TokenSet
    {
        $payload ??= [];

        $accessToken = (string) ($payload['access_token'] ?? '');

        if ($accessToken === '') {
            throw PlatformConnectionException::tokenExchangeFailed(
                $this->platformSlug(),
                'Access token missing from response.',
            );
        }

        $expiresIn = isset($payload['expires_in']) ? (int) $payload['expires_in'] : null;

        return new TokenSet(
            accessToken: $accessToken,
            refreshToken: isset($payload['refresh_token']) ? (string) $payload['refresh_token'] : null,
            expiresAt: $expiresIn ? CarbonImmutable::now()->addSeconds($expiresIn) : null,
        );
    }
}
