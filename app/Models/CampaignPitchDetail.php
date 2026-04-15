<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CampaignPitchDetail extends Model
{
    use HasUlids;

    public $timestamps = false;

    protected $fillable = [
        'campaign_id',
        'product_name',
        'product_description',
        'product_url',
        'product_images',
        'budget_cap',
        'min_bid',
        'max_bid',
    ];

    protected function casts(): array
    {
        return [
            'product_images' => 'array',
            'budget_cap' => 'decimal:2',
            'min_bid' => 'decimal:2',
            'max_bid' => 'decimal:2',
        ];
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }
}
