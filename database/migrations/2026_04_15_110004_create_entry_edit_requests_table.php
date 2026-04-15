<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entry_edit_requests', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('entry_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('requested_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->text('notes');
            $table->enum('status', ['pending', 'addressed', 'dismissed'])->default('pending');
            $table->timestamp('addressed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entry_edit_requests');
    }
};
