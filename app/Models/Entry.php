<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

final class Entry extends Model
{
    use HasUlids;

    protected $fillable = [
        'campaign_id',
        'creator_profile_id',
        'content_type_id',
        'type',
        'video_url',
        'video_duration_sec',
        'caption',
        'tags',
        'requirements_acknowledged',
        'status',
        'rejection_reason',
        'approved_at',
        'live_at',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'requirements_acknowledged' => 'boolean',
            'approved_at' => 'datetime',
            'live_at' => 'datetime',
            'submitted_at' => 'datetime',
        ];
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(CreatorProfile::class, 'creator_profile_id');
    }

    public function contentType(): BelongsTo
    {
        return $this->belongsTo(ContentType::class);
    }

    public function platforms(): BelongsToMany
    {
        return $this->belongsToMany(Platform::class, 'entry_platforms')
            ->withPivot(['posted_url', 'verified_view_count', 'last_synced_at']);
    }

    public function pitchDetails(): HasOne
    {
        return $this->hasOne(EntryPitchDetail::class);
    }

    public function rippleEarnings(): HasMany
    {
        return $this->hasMany(EntryRippleEarning::class);
    }

    public function editRequests(): HasMany
    {
        return $this->hasMany(EntryEditRequest::class);
    }

    public function viewSyncLogs(): HasMany
    {
        return $this->hasMany(ViewSyncLog::class);
    }
}
