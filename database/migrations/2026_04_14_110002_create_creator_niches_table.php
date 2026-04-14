<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('creator_niches', function (Blueprint $table) {
            $table->foreignUlid('creator_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('niche_id')->constrained()->cascadeOnDelete();
            $table->primary(['creator_profile_id', 'niche_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('creator_niches');
    }
};
