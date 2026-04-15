<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaign_content_types', function (Blueprint $table) {
            $table->foreignUlid('campaign_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('content_type_id')->constrained()->cascadeOnDelete();
            $table->primary(['campaign_id', 'content_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_content_types');
    }
};
