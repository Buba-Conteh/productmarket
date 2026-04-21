<?php

declare(strict_types=1);

namespace App\Services\Social\DataObjects;

final readonly class ConnectedAccount
{
    public function __construct(
        public string $platformUserId,
        public string $handle,
        public int $followerCount = 0,
        public ?int $avgViews = null,
        public ?float $engagementRate = null,
        public bool $verified = false,
    ) {}
}
