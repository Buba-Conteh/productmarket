<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaign_co_brands', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('campaign_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('brand_profile_id')->constrained()->cascadeOnDelete();
            $table->decimal('contribution_amount', 10, 2);
            $table->decimal('contribution_pct', 5, 2);
            $table->enum('status', ['invited', 'accepted', 'declined'])->default('invited');
            $table->timestamps();

            $table->unique(['campaign_id', 'brand_profile_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_co_brands');
    }
};
