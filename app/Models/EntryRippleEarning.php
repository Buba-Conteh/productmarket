<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class EntryRippleEarning extends Model
{
    use HasUlids;

    public $timestamps = false;

    protected $fillable = [
        'entry_id',
        'campaign_ripple_details_id',
        'milestone_number',
        'views_at_milestone',
        'amount',
        'type',
        'triggered_at',
        'payout_id',
    ];

    protected function casts(): array
    {
        return [
            'milestone_number' => 'integer',
            'views_at_milestone' => 'integer',
            'amount' => 'decimal:2',
            'triggered_at' => 'datetime',
        ];
    }

    public function entry(): BelongsTo
    {
        return $this->belongsTo(Entry::class);
    }

    public function rippleDetails(): BelongsTo
    {
        return $this->belongsTo(CampaignRippleDetail::class, 'campaign_ripple_details_id');
    }
}
