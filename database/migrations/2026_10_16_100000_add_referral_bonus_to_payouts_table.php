<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Referral bonuses are paid through the normal payout flow but are not tied to
 * an entry or campaign, so those columns become nullable and the payout links
 * back to its referral instead. Purely additive — existing rows are untouched.
 */
return new class extends Migration
{
    private const array BASE_TYPES = [
        'contest_prize',
        'contest_runner_up',
        'ripple_initial_fee',
        'ripple_milestone',
        'pitch_payment',
    ];

    /** Name PostgreSQL gives the CHECK created by Blueprint::enum(). */
    private const string TYPE_CHECK = 'payouts_payout_type_check';

    public function up(): void
    {
        Schema::table('payouts', function (Blueprint $table) {
            $table->ulid('entry_id')->nullable()->change();
            $table->ulid('campaign_id')->nullable()->change();
        });

        $this->setPayoutTypes([...self::BASE_TYPES, 'referral_bonus']);

        Schema::table('payouts', function (Blueprint $table) {
            $table->foreignUlid('referral_id')
                ->nullable()
                ->unique()
                ->after('campaign_id')
                ->constrained()
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payouts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('referral_id');
        });

        // Fails loudly if referral_bonus rows exist rather than deleting them.
        $this->setPayoutTypes(self::BASE_TYPES);
    }

    /**
     * Replace the allowed payout_type values.
     *
     * PostgreSQL cannot take a CHECK inline in ALTER COLUMN (which is what
     * `enum()->change()` generates) and keeps the old constraint, so swap the
     * constraint explicitly. Other drivers rebuild the column via Blueprint.
     *
     * @param  list<string>  $types
     */
    private function setPayoutTypes(array $types): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            Schema::table('payouts', function (Blueprint $table) use ($types) {
                $table->enum('payout_type', $types)->change();
            });

            return;
        }

        $list = implode(', ', array_map(
            fn (string $type): string => DB::getPdo()->quote($type),
            $types,
        ));

        DB::statement('ALTER TABLE payouts DROP CONSTRAINT IF EXISTS '.self::TYPE_CHECK);
        DB::statement(
            'ALTER TABLE payouts ADD CONSTRAINT '.self::TYPE_CHECK
            .' CHECK (payout_type IN ('.$list.'))'
        );
    }
};
