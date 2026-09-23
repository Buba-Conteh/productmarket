<?php

declare(strict_types=1);

namespace App\Services\Social\DataObjects;

use Carbon\CarbonImmutable;

/**
 * One video as a platform reports it. Metrics a platform doesn't expose stay
 * zero and are hidden in the UI rather than rendered as a real count.
 */
final readonly class PlatformVideo
{
    public function __construct(
        public string $platformVideoId,
        public ?string $title = null,
        public ?string $thumbnailUrl = null,
        public ?string $shareUrl = null,
        public int $viewCount = 0,
        public int $likeCount = 0,
        public int $commentCount = 0,
        public ?int $durationSec = null,
        public ?CarbonImmutable $postedAt = null,
    ) {}
}
