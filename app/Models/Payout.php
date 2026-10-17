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

    /**
     * Reason stored on a pending payout that is held because the creator has
     * no active Stripe Connect account yet. Held payouts are not failures.
     */
    public const string AWAITING_ACCOUNT_REASON = 'Awaiting creator payout account.';

    /**
     * Reason written by the old flow, which failed these payouts outright.
     * Payouts carrying it are recovered once the creator's account is active.
     */
    public const string LEGACY_INACTIVE_ACCOUNT_REASON = 'Creator Stripe Connect account is not active.';

    protected $fillable = [
        'entry_id',
        'creator_profile_id',
        'campaign_id',
        'referral_id',
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

    public function referral(): BelongsTo
    {
        return $this->belongsTo(Referral::class);
    }

    public function rippleEarnings(): HasMany
    {
        return $this->hasMany(EntryRippleEarning::class);
    }
}
