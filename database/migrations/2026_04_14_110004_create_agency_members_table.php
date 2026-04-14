<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agency_members', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('agency_brand_profile_id')->constrained('brand_profiles')->cascadeOnDelete();
            $table->foreignUlid('user_id')->constrained()->cascadeOnDelete();
            $table->enum('role', ['owner', 'manager', 'viewer'])->default('viewer');
            $table->timestamp('invited_at');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();

            $table->unique(['agency_brand_profile_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agency_members');
    }
};
