<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaign_invitations', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignUlid('campaign_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('creator_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('invited_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->text('message')->nullable();
            $table->string('status')->default('pending');
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            // One standing invitation per creator per campaign — re-inviting
            // updates the existing row rather than stacking duplicates.
            $table->unique(['campaign_id', 'creator_profile_id']);
            $table->index(['creator_profile_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_invitations');
    }
};
