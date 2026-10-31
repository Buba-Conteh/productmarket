<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const array BASE_TYPES = [
        'contest_prize',
        'contest_runner_up',
        'ripple_initial_fee',
        'ripple_milestone',
        'pitch_payment',
    ];

    public function up(): void
    {
        $driver = DB::getDriverName();

        Schema::table('payouts', function (Blueprint $table) use ($driver) {
            $table->ulid('entry_id')->nullable()->change();
            $table->ulid('campaign_id')->nullable()->change();

            if ($driver !== 'pgsql') {
                $table->enum('payout_type', [...self::BASE_TYPES, 'referral_bonus'])->change();
            }
        });

        if ($driver === 'pgsql') {
            $this->replacePostgresPayoutTypeConstraint([...self::BASE_TYPES, 'referral_bonus']);
        }

        Schema::table('payouts', function (Blueprint $table) {
            $table->foreignUlid('referral_id')
                ->nullable()
                ->unique()
                ->constrained()
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (DB::table('payouts')->where('payout_type', 'referral_bonus')->exists()) {
            throw new RuntimeException('Cannot remove referral payout support while referral bonus payouts exist.');
        }

        Schema::table('payouts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('referral_id');
        });

        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            $this->replacePostgresPayoutTypeConstraint(self::BASE_TYPES);
        }

        Schema::table('payouts', function (Blueprint $table) use ($driver) {
            $table->ulid('entry_id')->nullable(false)->change();
            $table->ulid('campaign_id')->nullable(false)->change();

            if ($driver !== 'pgsql') {
                $table->enum('payout_type', self::BASE_TYPES)->change();
            }
        });
    }

    /**
     * PostgreSQL compiles Laravel enums as varchar columns with check constraints.
     * Replace the constraint separately; changing the column type cannot add it.
     *
     * @param  list<string>  $types
     */
    private function replacePostgresPayoutTypeConstraint(array $types): void
    {
        DB::unprepared(<<<'SQL'
            DO $$
            DECLARE constraint_name text;
            BEGIN
                FOR constraint_name IN
                    SELECT constraint_row.conname
                    FROM pg_constraint AS constraint_row
                    JOIN pg_attribute AS column_row
                      ON column_row.attrelid = constraint_row.conrelid
                     AND column_row.attnum = ANY(constraint_row.conkey)
                    WHERE constraint_row.conrelid = 'payouts'::regclass
                      AND constraint_row.contype = 'c'
                      AND column_row.attname = 'payout_type'
                LOOP
                    EXECUTE format('ALTER TABLE payouts DROP CONSTRAINT %I', constraint_name);
                END LOOP;
            END
            $$;
            SQL);

        $allowedTypes = implode("', '", $types);

        DB::statement(
            "ALTER TABLE payouts ADD CONSTRAINT payouts_payout_type_check CHECK (payout_type IN ('{$allowedTypes}'))"
        );
    }
};
