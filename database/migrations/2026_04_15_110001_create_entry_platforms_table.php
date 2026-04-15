<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entry_platforms', function (Blueprint $table) {
            $table->foreignUlid('entry_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('platform_id')->constrained()->cascadeOnDelete();
            $table->string('posted_url')->nullable();
            $table->unsignedBigInteger('verified_view_count')->default(0);
            $table->timestamp('last_synced_at')->nullable();
            $table->primary(['entry_id', 'platform_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entry_platforms');
    }
};
