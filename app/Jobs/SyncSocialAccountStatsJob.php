<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\SocialAccount;
use App\Services\Social\SocialAccountService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Keeps the account-level metrics (followers, likes, posts) shown on creator
 * profiles in step with the platforms. Entry-level view counts are handled
 * separately by SyncAllLiveEntriesJob.
 */
final class SyncSocialAccountStatsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @param  string|null  $socialAccountId  Sync a single account, or every account when null.
     */
    public function __construct(
        public readonly ?string $socialAccountId = null,
    ) {}

    public function handle(SocialAccountService $service): void
    {
        if ($this->socialAccountId !== null) {
            $account = SocialAccount::find($this->socialAccountId);

            if ($account !== null) {
                $service->syncStats($account);
            }

            return;
        }

        SocialAccount::query()
            ->with('platform')
            ->chunkById(100, function ($accounts) use ($service): void {
                foreach ($accounts as $account) {
                    $service->syncStats($account);
                }
            });
    }
}
