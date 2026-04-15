<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CampaignCoBrand extends Model
{
    use HasUlids;

    protected $fillable = [
        'campaign_id',
        'brand_profile_id',
        'contribution_amount',
        'contribution_pct',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'contribution_amount' => 'decimal:2',
            'contribution_pct' => 'decimal:2',
        ];
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(BrandProfile::class, 'brand_profile_id');
    }
}
