<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Entry;
use Illuminate\Console\Command;

final class CheckEntries extends Command
{
    protected $signature = 'entries:check';

    protected $description = 'Check entry statuses and TikTok posted status';

    public function handle(): int
    {
        $this->info('Entry Status Summary:');
        $statuses = Entry::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        foreach ($statuses as $status => $count) {
            $this->line("  {$status}: {$count}");
        }

        $this->line('');
        $this->info('Entries with TikTok posted URLs:');

        $entriesWithTikTok = Entry::whereHas('platforms', function ($q) {
            $q->where('platforms.slug', 'tiktok')
                ->whereNotNull('posted_url');
        })->with('platforms', 'campaign')->get();

        if ($entriesWithTikTok->isEmpty()) {
            $this->line('  None found');
            return 0;
        }

        foreach ($entriesWithTikTok as $entry) {
            $this->line("  Entry: {$entry->id}");
            $this->line("    Campaign: {$entry->campaign->title}");
            $this->line("    Status: {$entry->status}");

            $tiktok = $entry->platforms->first(fn($p) => $p->slug === 'tiktok');
            if ($tiktok) {
                $this->line("    TikTok Status: {$tiktok->pivot->publish_status}");
                $this->line("    TikTok URL: {$tiktok->pivot->posted_url}");
            }
        }

        return 0;
    }
}
