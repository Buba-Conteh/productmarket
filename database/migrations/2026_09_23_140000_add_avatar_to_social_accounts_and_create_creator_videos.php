<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('social_accounts', function (Blueprint $table): void {
            $table->string('avatar_url', 1024)->nullable()->after('handle');
        });

        // Recent videos pulled from each connected platform. Synced rather than
        // fetched on demand: a public profile view must not depend on three
        // third-party APIs being up, and the providers rate-limit per token.
        Schema::create('creator_videos', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignUlid('social_account_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('platform_id')->constrained()->cascadeOnDelete();
            $table->string('platform_video_id');
            $table->string('title', 500)->nullable();
            $table->string('thumbnail_url', 1024)->nullable();
            $table->string('share_url', 1024)->nullable();
            $table->unsignedBigInteger('view_count')->default(0);
            $table->unsignedBigInteger('like_count')->default(0);
            $table->unsignedBigInteger('comment_count')->default(0);
            $table->unsignedInteger('duration_sec')->nullable();
            $table->timestamp('posted_at')->nullable();
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();

            $table->unique(['social_account_id', 'platform_video_id']);
            $table->index(['social_account_id', 'posted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('creator_videos');

        Schema::table('social_accounts', function (Blueprint $table): void {
            $table->dropColumn('avatar_url');
        });
    }
};
