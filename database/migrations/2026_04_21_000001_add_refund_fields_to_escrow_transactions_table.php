<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('escrow_transactions', function (Blueprint $table): void {
            $table->string('stripe_refund_id')->nullable()->after('stripe_payment_intent_id');
            $table->timestamp('refunded_at')->nullable()->after('fully_released_at');
        });
    }

    public function down(): void
    {
        Schema::table('escrow_transactions', function (Blueprint $table): void {
            $table->dropColumn(['stripe_refund_id', 'refunded_at']);
        });
    }
};
