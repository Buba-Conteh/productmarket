<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_accounts', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('platform_id')->constrained()->cascadeOnDelete();
            $table->string('handle');
            $table->string('platform_user_id');
            $table->text('oauth_token');
            $table->text('oauth_refresh_token')->nullable();
            $table->timestamp('token_expires_at')->nullable();
            $table->unsignedBigInteger('follower_count')->default(0);
            $table->unsignedBigInteger('avg_views')->nullable();
            $table->decimal('engagement_rate', 5, 2)->nullable();
            $table->boolean('verified')->default(false);
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'platform_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_accounts');
    }
};
