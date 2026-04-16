<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaign_analytics', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('campaign_id')->constrained('campaigns')->cascadeOnDelete();
            $table->date('date');
            $table->unsignedInteger('total_entries')->default(0);
            $table->unsignedInteger('total_live')->default(0);
            $table->unsignedBigInteger('total_views')->default(0);
            $table->decimal('total_paid_out', 10, 2)->default(0);
            $table->ulid('top_entry_id')->nullable();

            $table->unique(['campaign_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_analytics');
    }
};
