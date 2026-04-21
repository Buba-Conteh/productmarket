<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('brand_profiles', function (Blueprint $table): void {
            $table->timestamp('onboarding_completed_at')->nullable()->after('is_agency');
        });

        Schema::table('creator_profiles', function (Blueprint $table): void {
            $table->timestamp('onboarding_completed_at')->nullable()->after('pending_earnings');
        });
    }

    public function down(): void
    {
        Schema::table('brand_profiles', function (Blueprint $table): void {
            $table->dropColumn('onboarding_completed_at');
        });

        Schema::table('creator_profiles', function (Blueprint $table): void {
            $table->dropColumn('onboarding_completed_at');
        });
    }
};
