<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CampaignRippleDetail extends Model
{
    use HasUlids;

    public $timestamps = false;

    protected $fillable = [
        'campaign_id',
        'initial_fee',
        'rpm_rate',
        'milestone_interval',
        'max_payout_per_creator',
        'total_budget',
        'budget_spent',
    ];

    protected function casts(): array
    {
        return [
            'initial_fee' => 'decimal:2',
            'rpm_rate' => 'decimal:2',
            'milestone_interval' => 'integer',
            'max_payout_per_creator' => 'decimal:2',
            'total_budget' => 'decimal:2',
            'budget_spent' => 'decimal:2',
        ];
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }
}
