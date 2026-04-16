<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Payout extends Model
{
    use HasUlids;

    protected $fillable = [
        'entry_id',
        'creator_profile_id',
        'campaign_id',
        'gross_amount',
        'platform_fee',
        'net_amount',
        'payout_type',
        'stripe_transfer_id',
        'status',
        'failure_reason',
        'retry_count',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'gross_amount' => 'decimal:2',
            'platform_fee' => 'decimal:2',
            'net_amount' => 'decimal:2',
            'retry_count' => 'integer',
            'paid_at' => 'datetime',
        ];
    }

    public function entry(): BelongsTo
    {
        return $this->belongsTo(Entry::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(CreatorProfile::class, 'creator_profile_id');
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function rippleEarnings(): HasMany
    {
        return $this->hasMany(EntryRippleEarning::class);
    }
}
