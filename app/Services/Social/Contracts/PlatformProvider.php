<?php

declare(strict_types=1);

namespace App\Services\Social\Contracts;

use App\Models\SocialAccount;
use App\Services\Social\DataObjects\ConnectedAccount;
use App\Services\Social\DataObjects\TokenSet;

interface PlatformProvider
{
    public function platformSlug(): string;

    public function getAuthorizationUrl(string $state): string;

    public function exchangeCodeForToken(string $code): TokenSet;

    public function fetchAccountProfile(TokenSet $tokens): ConnectedAccount;

    public function refreshAccessToken(SocialAccount $account): TokenSet;

    public function fetchViewCount(SocialAccount $account, string $postedUrl): int;

    public function fetchFollowerCount(SocialAccount $account): int;
}
