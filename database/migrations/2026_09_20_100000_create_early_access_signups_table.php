<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('early_access_signups', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name')->nullable();
            $table->string('email')->unique();
            $table->enum('role', ['creator', 'brand']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('early_access_signups');
    }
};
