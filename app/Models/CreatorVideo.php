<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A video on a creator's connected platform account, synced periodically so the
 * public profile never has to call the platform APIs itself.
 */
final class CreatorVideo extends Model
{
    use HasUlids;

    protected $fillable = [
        'social_account_id',
        'platform_id',
        'platform_video_id',
        'title',
        'thumbnail_url',
        'share_url',
        'view_count',
        'like_count',
        'comment_count',
        'duration_sec',
        'posted_at',
        'synced_at',
    ];

    protected function casts(): array
    {
        return [
            'posted_at' => 'datetime',
            'synced_at' => 'datetime',
            'view_count' => 'integer',
            'like_count' => 'integer',
            'comment_count' => 'integer',
            'duration_sec' => 'integer',
        ];
    }

    public function socialAccount(): BelongsTo
    {
        return $this->belongsTo(SocialAccount::class);
    }

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }
}
