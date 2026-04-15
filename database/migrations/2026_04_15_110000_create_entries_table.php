<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entries', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('campaign_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('creator_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('content_type_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['contest', 'ripple', 'pitch']);
            $table->string('video_url')->nullable();
            $table->unsignedInteger('video_duration_sec')->nullable();
            $table->text('caption')->nullable();
            $table->json('tags')->nullable();
            $table->boolean('requirements_acknowledged')->default(false);
            $table->enum('status', [
                'draft',
                'pending_review',
                'approved',
                'rejected',
                'live',
                'won',
                'not_selected',
                'disqualified',
            ])->default('draft');
            $table->string('rejection_reason')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('live_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->unique(['campaign_id', 'creator_profile_id']);
            $table->index(['status', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entries');
    }
};
