<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Referral extends Model
{
    use HasUlids;

    protected $fillable = [
        'referrer_user_id',
        'referred_user_id',
        'referral_code',
        'type',
        'status',
        'qualified_at',
        'rewarded_at',
    ];

    protected function casts(): array
    {
        return [
            'qualified_at' => 'datetime',
            'rewarded_at' => 'datetime',
        ];
    }

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referrer_user_id');
    }

    public function referred(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_user_id');
    }
}
