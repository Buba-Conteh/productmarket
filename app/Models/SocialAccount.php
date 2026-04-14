<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class SocialAccount extends Model
{
    use HasUlids;

    protected $fillable = [
        'user_id',
        'platform_id',
        'handle',
        'platform_user_id',
        'oauth_token',
        'oauth_refresh_token',
        'token_expires_at',
        'follower_count',
        'avg_views',
        'engagement_rate',
        'verified',
        'last_synced_at',
    ];

    protected $hidden = [
        'oauth_token',
        'oauth_refresh_token',
    ];

    protected function casts(): array
    {
        return [
            'oauth_token' => 'encrypted',
            'oauth_refresh_token' => 'encrypted',
            'token_expires_at' => 'datetime',
            'last_synced_at' => 'datetime',
            'verified' => 'boolean',
            'engagement_rate' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }
}
