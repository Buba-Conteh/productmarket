<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payouts', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('entry_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('creator_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('campaign_id')->constrained()->cascadeOnDelete();
            $table->decimal('gross_amount', 10, 2);
            $table->decimal('platform_fee', 10, 2);
            $table->decimal('net_amount', 10, 2);
            $table->enum('payout_type', [
                'contest_prize',
                'contest_runner_up',
                'ripple_initial_fee',
                'ripple_milestone',
                'pitch_payment',
            ]);
            $table->string('stripe_transfer_id')->nullable()->index();
            $table->enum('status', ['pending', 'processing', 'paid', 'failed'])->default('pending');
            $table->string('failure_reason')->nullable();
            $table->unsignedTinyInteger('retry_count')->default(0);
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['creator_profile_id', 'status']);
            $table->index(['campaign_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payouts');
    }
};
