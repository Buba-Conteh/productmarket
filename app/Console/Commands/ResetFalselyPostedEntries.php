<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Entry;
use App\Models\Payout;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

final class ResetFalselyPostedEntries extends Command
{
    protected $signature = 'entries:reset-falsely-posted {--all : Reset all entries marked as live with stub URLs} {--force : Skip confirmation prompt}';

    protected $description = 'Reset entries that were falsely marked as posted due to stub mode';

    public function handle(): int
    {
        if ($this->option('all')) {
            return $this->resetAll();
        }

        $this->error('Use --all flag to reset all falsely posted entries.');
        $this->line('Example: php artisan entries:reset-falsely-posted --all');

        return 1;
    }

    private function resetAll(): int
    {
        $entries = Entry::where('status', 'live')->with('platforms', 'campaign')->get();

        if ($entries->isEmpty()) {
            $this->info('No live entries found.');
            return 0;
        }

        $this->warn("Found {$entries->count()} live entries:");
        $this->line('');

        foreach ($entries as $entry) {
            $campaign = $entry->campaign->title ?? 'Unknown';
            $this->line("ID: {$entry->id}");
            $this->line("  Campaign: {$campaign}");
            $this->line("  Type: {$entry->type}");

            foreach ($entry->platforms as $platform) {
                $url = $platform->pivot->posted_url;
                $status = $platform->pivot->publish_status ?? 'null';
                $this->line("  - {$platform->name}: status={$status}, url={$url}");
            }
            $this->line('');
        }

        if (!$this->option('force') && !$this->confirm("Reset all {$entries->count()} entries?")) {
            $this->info('Cancelled.');
            return 0;
        }

        foreach ($entries as $entry) {
            $this->resetEntry($entry);
        }

        $this->info('✓ All entries have been reset successfully.');
        return 0;
    }

    private function resetEntry(Entry $entry): void
    {
        DB::transaction(function () use ($entry) {
            $originalStatus = $entry->status;

            // Reset entry status back to approved/won so creator can actually post
            $newStatus = $entry->status === 'live' ? 'approved' : $entry->status;
            $entry->update([
                'status' => $newStatus,
                'live_at' => null,
            ]);

            // Clear fake TikTok posting data from pivot table
            DB::table('entry_platforms')
                ->where('entry_id', $entry->id)
                ->update([
                    'posted_url' => null,
                    'publish_status' => null,
                    'tiktok_publish_id' => null,
                ]);

            // Payment is kept — creator is paid but now must actually post the content
            $payoutCount = Payout::where('entry_id', $entry->id)->count();
            if ($payoutCount > 0) {
                $this->line("  ↳ Payment kept ({$payoutCount} payout)");
            }

            $this->line("✓ Entry {$entry->id}: {$originalStatus} → {$newStatus}");
        });
    }
}
