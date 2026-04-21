<?php

declare(strict_types=1);

namespace App\Services\Social\Providers;

use App\Models\SocialAccount;
use App\Services\Social\Contracts\PlatformProvider;
use App\Services\Social\DataObjects\TokenSet;
use App\Services\Social\Exceptions\PlatformConnectionException;
use Carbon\CarbonImmutable;
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

    public function getAuthorizationUrl(string $state): string
    {
        $this->assertConfigured();

        $params = array_merge([
            'client_id' => $this->config[$this->clientIdKey()],
            'redirect_uri' => $this->redirectUri(),
            'response_type' => 'code',
            'scope' => implode(' ', $this->config['scopes'] ?? []),
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

        $response = Http::asForm()->post($this->config['token_url'], [
            'client_id' => $this->config[$this->clientIdKey()],
            'client_secret' => $this->config[$this->clientSecretKey()],
            'code' => $code,
            'grant_type' => 'authorization_code',
            'redirect_uri' => $this->redirectUri(),
        ]);

        if ($response->failed()) {
            throw PlatformConnectionException::tokenExchangeFailed(
                $this->platformSlug(),
                (string) $response->body(),
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

        $response = Http::asForm()->post($this->config['token_url'], [
            'client_id' => $this->config[$this->clientIdKey()],
            'client_secret' => $this->config[$this->clientSecretKey()],
            'refresh_token' => $account->oauth_refresh_token,
            'grant_type' => 'refresh_token',
        ]);

        if ($response->failed()) {
            throw PlatformConnectionException::refreshFailed(
                $this->platformSlug(),
                (string) $response->body(),
            );
        }

        return $this->parseTokenResponse($response->json());
    }

    protected function redirectUri(): string
    {
        $path = (string) ($this->config['redirect'] ?? '');

        return str_starts_with($path, 'http') ? $path : url($path);
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
