<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class EscrowTransaction extends Model
{
    use HasUlids;

    protected $fillable = [
        'campaign_id',
        'brand_profile_id',
        'total_held',
        'total_released',
        'total_refunded',
        'stripe_payment_intent_id',
        'stripe_refund_id',
        'status',
        'held_at',
        'fully_released_at',
        'refunded_at',
    ];

    protected function casts(): array
    {
        return [
            'total_held' => 'decimal:2',
            'total_released' => 'decimal:2',
            'total_refunded' => 'decimal:2',
            'held_at' => 'datetime',
            'fully_released_at' => 'datetime',
            'refunded_at' => 'datetime',
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
