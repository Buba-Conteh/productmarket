<?php

declare(strict_types=1);

namespace App\Services\Social\Exceptions;

use RuntimeException;

final class PlatformConnectionException extends RuntimeException
{
    public static function notConfigured(string $platform): self
    {
        return new self("OAuth credentials for [{$platform}] are not configured.");
    }

    public static function tokenExchangeFailed(string $platform, string $reason = ''): self
    {
        return new self(trim("Token exchange failed for [{$platform}]. {$reason}"));
    }

    public static function refreshFailed(string $platform, string $reason = ''): self
    {
        return new self(trim("Token refresh failed for [{$platform}]. {$reason}"));
    }

    public static function syncFailed(string $platform, string $reason = ''): self
    {
        return new self(trim("View sync failed for [{$platform}]. {$reason}"));
    }
}
