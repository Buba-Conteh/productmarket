<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\SocialAccount;
use App\Services\Social\SocialAccountService;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class RefreshSocialTokensJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(SocialAccountService $service): void
    {
        $bufferMinutes = (int) config('social_oauth.sync.token_refresh_buffer_minutes', 60);
        $threshold = CarbonImmutable::now()->addMinutes($bufferMinutes);

        SocialAccount::query()
            ->whereNotNull('token_expires_at')
            ->where('token_expires_at', '<=', $threshold)
            ->whereNotNull('oauth_refresh_token')
            ->chunkById(100, function ($accounts) use ($service): void {
                foreach ($accounts as $account) {
                    $service->refreshIfNeeded($account);
                }
            });
    }
}
