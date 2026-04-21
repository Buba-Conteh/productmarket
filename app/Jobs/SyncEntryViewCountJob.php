<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Entry;
use App\Services\Social\ViewSyncService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class SyncEntryViewCountJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 60;

    public function __construct(public readonly string $entryId) {}

    public function handle(ViewSyncService $service): void
    {
        $entry = Entry::query()
            ->with(['campaign.rippleDetails', 'creator', 'platforms'])
            ->find($this->entryId);

        if (! $entry) {
            return;
        }

        $service->syncEntry($entry);
    }
}
