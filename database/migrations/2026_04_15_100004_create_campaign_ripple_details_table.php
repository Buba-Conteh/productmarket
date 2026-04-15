<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaign_ripple_details', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('campaign_id')->unique()->constrained()->cascadeOnDelete();
            $table->decimal('initial_fee', 10, 2);
            $table->decimal('rpm_rate', 8, 2);
            $table->unsignedInteger('milestone_interval');
            $table->decimal('max_payout_per_creator', 10, 2)->nullable();
            $table->decimal('total_budget', 10, 2);
            $table->decimal('budget_spent', 10, 2)->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_ripple_details');
    }
};
