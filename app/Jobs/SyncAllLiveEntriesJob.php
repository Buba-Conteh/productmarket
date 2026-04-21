<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Entry;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class SyncAllLiveEntriesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        Entry::query()
            ->whereIn('status', ['live', 'approved'])
            ->whereHas('platforms', fn ($q) => $q->whereNotNull('entry_platforms.posted_url'))
            ->select('id')
            ->chunkById(100, function ($entries): void {
                foreach ($entries as $entry) {
                    SyncEntryViewCountJob::dispatch($entry->id);
                }
            });
    }
}
