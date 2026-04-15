<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class CreatorProfile extends Model
{
    use HasUlids;

    protected $fillable = [
        'user_id',
        'display_name',
        'bio',
        'stripe_connect_id',
        'stripe_connect_status',
        'total_earned',
        'pending_earnings',
    ];

    protected function casts(): array
    {
        return [
            'total_earned' => 'decimal:2',
            'pending_earnings' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function niches(): BelongsToMany
    {
        return $this->belongsToMany(Niche::class, 'creator_niches');
    }

    public function campaignApplications(): HasMany
    {
        return $this->hasMany(CampaignApplication::class);
    }
}
