<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Entry;
use App\Models\Payout;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

final class ResetFalselyPostedEntries extends Command
{
    protected $signature = 'entries:reset-falsely-posted {--all : Reset all entries marked as live with stub URLs}';

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

        if (!$this->confirm("Reset all {$entries->count()} entries?")) {
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

            // 1. Reverse any payouts if they were released (Pitch entries)
            if ($entry->type === 'pitch') {
                $payoutsToReverse = Payout::where('entry_id', $entry->id)
                    ->where('payout_type', 'pitch_payment')
                    ->where('status', '!=', 'failed')
                    ->get();

                foreach ($payoutsToReverse as $payout) {
                    $payout->update([
                        'status' => 'failed',
                        'failure_reason' => 'Reversed due to falsely marked as posted (stub mode)',
                    ]);

                    $this->line("  ↳ Reversed payout {$payout->id}");
                }
            }

            // 2. Reset entry status back to approved/won
            $newStatus = $entry->status === 'live' ? 'approved' : $entry->status;
            $entry->update([
                'status' => $newStatus,
                'live_at' => null,
            ]);

            // 3. Clear fake TikTok posting data
            $entry->platforms()->update([
                'posted_url' => null,
                'publish_status' => null,
                'tiktok_publish_id' => null,
            ]);

            $this->line("✓ Entry {$entry->id}: {$originalStatus} → {$newStatus}");
        });
    }
}
