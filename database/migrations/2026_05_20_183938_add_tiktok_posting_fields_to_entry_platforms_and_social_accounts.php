<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('entry_platforms', function (Blueprint $table): void {
            $table->string('tiktok_publish_id')->nullable()->after('last_synced_at');
            $table->string('publish_status')->nullable()->after('tiktok_publish_id');
        });

        Schema::table('social_accounts', function (Blueprint $table): void {
            $table->json('scopes')->nullable()->after('verified');
        });
    }

    public function down(): void
    {
        Schema::table('entry_platforms', function (Blueprint $table): void {
            $table->dropColumn(['tiktok_publish_id', 'publish_status']);
        });

        Schema::table('social_accounts', function (Blueprint $table): void {
            $table->dropColumn('scopes');
        });
    }
};
