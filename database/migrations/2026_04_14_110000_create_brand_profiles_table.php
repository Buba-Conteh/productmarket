<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('brand_profiles', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('company_name');
            $table->string('website')->nullable();
            $table->foreignUlid('industry_id')->nullable()->constrained('industries')->nullOnDelete();
            $table->text('description')->nullable();
            $table->string('logo')->nullable();
            $table->string('stripe_customer_id')->nullable()->index();
            $table->boolean('is_agency')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('brand_profiles');
    }
};
