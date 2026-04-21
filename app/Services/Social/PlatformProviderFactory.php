<?php

declare(strict_types=1);

namespace App\Services\Social;

use App\Services\Social\Contracts\PlatformProvider;
use App\Services\Social\Providers\InstagramProvider;
use App\Services\Social\Providers\TikTokProvider;
use App\Services\Social\Providers\YouTubeProvider;
use InvalidArgumentException;

final class PlatformProviderFactory
{
    private const MAP = [
        'tiktok' => TikTokProvider::class,
        'instagram' => InstagramProvider::class,
        'youtube' => YouTubeProvider::class,
        'youtube-shorts' => YouTubeProvider::class,
    ];

    public function make(string $platformSlug): PlatformProvider
    {
        $class = self::MAP[$platformSlug] ?? null;

        if ($class === null) {
            throw new InvalidArgumentException("No OAuth provider registered for platform [{$platformSlug}].");
        }

        $configKey = $platformSlug === 'youtube-shorts' ? 'youtube' : $platformSlug;

        /** @var array<string, mixed> $config */
        $config = (array) config("social_oauth.{$configKey}", []);

        return new $class($config);
    }

    /**
     * @return list<string>
     */
    public function supportedPlatforms(): array
    {
        return array_keys(self::MAP);
    }
}
