<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaign_contest_details', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('campaign_id')->unique()->constrained()->cascadeOnDelete();
            $table->decimal('prize_amount', 10, 2);
            $table->decimal('runner_up_prize', 10, 2)->nullable();
            // FK to entries added in feature 1.6 once that table exists
            $table->ulid('winner_entry_id')->nullable();
            $table->timestamp('winner_selected_at')->nullable();
            $table->text('selection_notes')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_contest_details');
    }
};
