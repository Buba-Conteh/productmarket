<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CreatorAnalytic extends Model
{
    use HasUlids;

    public $timestamps = false;

    protected $fillable = [
        'creator_profile_id',
        'week_start',
        'total_views',
        'total_earned',
        'entries_count',
        'avg_engagement_rate',
    ];

    protected function casts(): array
    {
        return [
            'week_start' => 'date',
            'total_views' => 'integer',
            'total_earned' => 'decimal:2',
            'entries_count' => 'integer',
            'avg_engagement_rate' => 'decimal:2',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(CreatorProfile::class, 'creator_profile_id');
    }
}
