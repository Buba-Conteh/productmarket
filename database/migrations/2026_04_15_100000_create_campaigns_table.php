<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaigns', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('brand_profile_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['contest', 'ripple', 'pitch']);
            $table->string('title');
            $table->longText('brief');
            $table->json('requirements')->nullable();
            $table->json('required_hashtags')->nullable();
            $table->json('target_regions')->nullable();
            $table->json('inspiration_links')->nullable();
            $table->decimal('platform_fee_pct', 5, 2);
            $table->enum('status', [
                'draft',
                'pending_escrow',
                'active',
                'closed',
                'completed',
                'cancelled',
            ])->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->timestamp('deadline')->nullable();
            $table->unsignedInteger('max_creators')->nullable();
            $table->boolean('ai_brief_used')->default(false);
            $table->timestamps();

            $table->index(['status', 'type']);
            $table->index('deadline');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};
