<?php

declare(strict_types=1);

namespace App\Services\Social\DataObjects;

use Carbon\CarbonImmutable;

final readonly class TokenSet
{
    public function __construct(
        public string $accessToken,
        public ?string $refreshToken = null,
        public ?CarbonImmutable $expiresAt = null,
    ) {}
}
