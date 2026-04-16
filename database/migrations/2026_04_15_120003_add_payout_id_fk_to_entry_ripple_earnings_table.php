<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('entry_ripple_earnings', function (Blueprint $table) {
            $table->foreign('payout_id')
                ->references('id')
                ->on('payouts')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('entry_ripple_earnings', function (Blueprint $table) {
            $table->dropForeign(['payout_id']);
        });
    }
};
