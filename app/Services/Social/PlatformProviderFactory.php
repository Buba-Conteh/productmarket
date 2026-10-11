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

        /** @var array<string, mixed> $config */
        $config = (array) config('social_oauth.'.$this->configKey($platformSlug), []);

        return new $class($config);
    }

    /**
     * @return list<string>
     */
    public function supportedPlatforms(): array
    {
        return array_keys(self::MAP);
    }

    /**
     * Platforms creators can currently connect (SOCIAL_ENABLED_PLATFORMS).
     * Existing connections to other platforms keep working; they just can't
     * be newly connected.
     *
     * @return list<string>
     */
    public function enabledPlatforms(): array
    {
        $enabled = (array) config('social_oauth.enabled_platforms', []);

        return array_values(array_filter(
            $this->supportedPlatforms(),
            fn (string $slug): bool => in_array($this->configKey($slug), $enabled, true),
        ));
    }

    public function isEnabled(string $platformSlug): bool
    {
        return in_array($platformSlug, $this->enabledPlatforms(), true);
    }

    private function configKey(string $platformSlug): string
    {
        return $platformSlug === 'youtube-shorts' ? 'youtube' : $platformSlug;
    }
}
