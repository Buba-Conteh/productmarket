<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('creator_analytics', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('creator_profile_id')->constrained('creator_profiles')->cascadeOnDelete();
            $table->date('week_start');
            $table->unsignedBigInteger('total_views')->default(0);
            $table->decimal('total_earned', 10, 2)->default(0);
            $table->unsignedInteger('entries_count')->default(0);
            $table->decimal('avg_engagement_rate', 5, 2)->default(0);

            $table->unique(['creator_profile_id', 'week_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('creator_analytics');
    }
};
