<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CampaignContestDetail extends Model
{
    use HasUlids;

    public $timestamps = false;

    protected $fillable = [
        'campaign_id',
        'prize_amount',
        'runner_up_prize',
        'winner_entry_id',
        'winner_selected_at',
        'selection_notes',
    ];

    protected function casts(): array
    {
        return [
            'prize_amount' => 'decimal:2',
            'runner_up_prize' => 'decimal:2',
            'winner_selected_at' => 'datetime',
        ];
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }
}
