<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entry_pitch_details', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('entry_id')->unique()->constrained()->cascadeOnDelete();
            $table->decimal('proposed_bid', 10, 2);
            $table->decimal('accepted_bid', 10, 2)->nullable();
            $table->text('pitch')->nullable();
            $table->timestamp('bid_accepted_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entry_pitch_details');
    }
};
