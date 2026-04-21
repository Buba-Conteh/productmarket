<?php

declare(strict_types=1);

use App\Jobs\RefreshSocialTokensJob;
use App\Jobs\ResolveContestDeadlineJob;
use App\Jobs\SyncAllLiveEntriesJob;
use App\Models\Campaign;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

if ((bool) config('social_oauth.sync.enabled', true)) {
    $frequencyHours = max(1, (int) config('social_oauth.sync.frequency_hours', 6));

    Schedule::job(new SyncAllLiveEntriesJob)
        ->cron("0 */{$frequencyHours} * * *")
        ->name('sync-live-entry-view-counts')
        ->withoutOverlapping();

    Schedule::job(new RefreshSocialTokensJob)
        ->hourly()
        ->name('refresh-expiring-social-tokens')
        ->withoutOverlapping();

    Schedule::call(function (): void {
        Campaign::query()
            ->where('type', 'contest')
            ->where('status', 'active')
            ->whereNotNull('deadline')
            ->where('deadline', '<=', now())
            ->select('id')
            ->chunkById(50, function ($campaigns): void {
                foreach ($campaigns as $campaign) {
                    ResolveContestDeadlineJob::dispatch($campaign->id);
                }
            });
    })
        ->hourly()
        ->name('dispatch-contest-deadline-resolutions')
        ->withoutOverlapping();
}
