<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('entry_platforms', function (Blueprint $table): void {
            $table->unsignedBigInteger('comment_count')->default(0)->after('verified_view_count');
        });
    }

    public function down(): void
    {
        Schema::table('entry_platforms', function (Blueprint $table): void {
            $table->dropColumn('comment_count');
        });
    }
};
