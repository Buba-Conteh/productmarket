<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('view_sync_logs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('entry_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('platform_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('view_count');
            $table->timestamp('synced_at');
            $table->boolean('success');
            $table->string('error_message')->nullable();

            $table->index(['entry_id', 'synced_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('view_sync_logs');
    }
};
