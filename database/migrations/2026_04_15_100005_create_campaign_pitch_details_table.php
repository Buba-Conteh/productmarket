<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaign_pitch_details', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('campaign_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('product_name');
            $table->text('product_description')->nullable();
            $table->string('product_url')->nullable();
            $table->json('product_images')->nullable();
            $table->decimal('budget_cap', 10, 2)->nullable();
            $table->decimal('min_bid', 10, 2)->nullable();
            $table->decimal('max_bid', 10, 2)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_pitch_details');
    }
};
