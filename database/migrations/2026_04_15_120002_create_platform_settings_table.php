<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_settings', function (Blueprint $table) {
            $table->unsignedTinyInteger('id')->primary();
            $table->decimal('platform_fee_pct', 5, 2)->default(15.00);
            $table->decimal('contest_split_first', 5, 2)->default(50.00);
            $table->decimal('contest_split_second', 5, 2)->default(25.00);
            $table->decimal('contest_split_third', 5, 2)->default(15.00);
            $table->decimal('contest_split_pool', 5, 2)->default(10.00);
            $table->decimal('min_creator_payout', 10, 2)->default(25.00);
            $table->decimal('referral_creator_bonus', 10, 2)->default(25.00);
            $table->decimal('referral_brand_credit', 10, 2)->default(100.00);
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_settings');
    }
};
