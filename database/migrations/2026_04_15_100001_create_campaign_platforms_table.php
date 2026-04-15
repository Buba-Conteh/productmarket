<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaign_platforms', function (Blueprint $table) {
            $table->foreignUlid('campaign_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('platform_id')->constrained()->cascadeOnDelete();
            $table->primary(['campaign_id', 'platform_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_platforms');
    }
};
