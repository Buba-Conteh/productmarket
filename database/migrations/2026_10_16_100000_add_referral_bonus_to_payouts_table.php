<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TYPE payout_type ADD VALUE IF NOT EXISTS 'referral_bonus'");

            return;
        }

        if ($driver === 'mysql') {
            DB::statement(
                "ALTER TABLE payouts MODIFY payout_type ENUM('contest_prize', 'contest_runner_up', 'ripple_initial_fee', 'ripple_milestone', 'pitch_payment', 'referral_bonus') NOT NULL"
            );

            return;
        }

        // SQLite does not support enum alterations; the schema is effectively text-like here.
    }

    public function down(): void
    {
        // PostgreSQL does not support removing enum values in-place.
        // The migration is intentionally non-destructive to avoid a broken rollback.
    }
};
