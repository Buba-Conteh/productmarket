<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('campaign_contest_details', function (Blueprint $table) {
            $table->foreign('winner_entry_id')
                ->references('id')
                ->on('entries')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('campaign_contest_details', function (Blueprint $table) {
            $table->dropForeign(['winner_entry_id']);
        });
    }
};
