<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entry_ripple_earnings', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('entry_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('campaign_ripple_details_id')->constrained('campaign_ripple_details')->cascadeOnDelete();
            $table->unsignedInteger('milestone_number');
            $table->unsignedBigInteger('views_at_milestone');
            $table->decimal('amount', 10, 2);
            $table->enum('type', ['initial_fee', 'milestone']);
            $table->timestamp('triggered_at');
            // payout_id FK added in feature 1.7 once the payouts table exists
            $table->ulid('payout_id')->nullable();

            $table->index(['entry_id', 'milestone_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entry_ripple_earnings');
    }
};
