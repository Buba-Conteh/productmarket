<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referrals', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('referrer_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUlid('referred_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('referral_code')->unique();
            $table->enum('type', ['creator', 'brand']);
            $table->enum('status', ['pending', 'qualified', 'rewarded']);
            $table->timestamp('qualified_at')->nullable();
            $table->timestamp('rewarded_at')->nullable();
            $table->timestamps();

            $table->index(['referrer_user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referrals');
    }
};
