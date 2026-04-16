<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('escrow_transactions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('campaign_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('brand_profile_id')->constrained()->cascadeOnDelete();
            $table->decimal('total_held', 10, 2);
            $table->decimal('total_released', 10, 2)->default(0);
            $table->decimal('total_refunded', 10, 2)->default(0);
            $table->string('stripe_payment_intent_id')->index();
            $table->enum('status', [
                'pending',
                'held',
                'partially_released',
                'fully_released',
                'refunded',
            ])->default('pending');
            $table->timestamp('held_at')->nullable();
            $table->timestamp('fully_released_at')->nullable();
            $table->timestamps();

            $table->index(['campaign_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('escrow_transactions');
    }
};
