<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
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

    public function up(): void
    {
        Schema::table('payouts', function (Blueprint $table) {
            $table->ulid('entry_id')->nullable()->change();
            $table->ulid('campaign_id')->nullable()->change();
            $table->enum('payout_type', [...self::BASE_TYPES, 'referral_bonus'])->change();
        });

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

        Schema::table('payouts', function (Blueprint $table) {
            $table->enum('payout_type', self::BASE_TYPES)->change();
        });
    }
};
