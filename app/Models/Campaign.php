<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Storage;

final class Campaign extends Model
{
    use HasUlids;

    protected $fillable = [
        'brand_profile_id',
        'type',
        'title',
        'brief',
        'requirements',
        'required_hashtags',
        'target_regions',
        'inspiration_links',
        'platform_fee_pct',
        'status',
        'published_at',
        'deadline',
        'max_creators',
        'ai_brief_used',
        'thumbnail',
    ];

    protected $appends = ['thumbnail_url'];

    protected function casts(): array
    {
        return [
            'requirements' => 'array',
            'required_hashtags' => 'array',
            'target_regions' => 'array',
            'inspiration_links' => 'array',
            'platform_fee_pct' => 'decimal:2',
            'published_at' => 'datetime',
            'deadline' => 'datetime',
            'ai_brief_used' => 'boolean',
        ];
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        if ($this->thumbnail === null) {
            return null;
        }

        return Storage::disk('public')->url($this->thumbnail);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(BrandProfile::class, 'brand_profile_id');
    }

    public function platforms(): BelongsToMany
    {
        return $this->belongsToMany(Platform::class, 'campaign_platforms');
    }

    public function contentTypes(): BelongsToMany
    {
        return $this->belongsToMany(ContentType::class, 'campaign_content_types');
    }

    public function contestDetails(): HasOne
    {
        return $this->hasOne(CampaignContestDetail::class);
    }

    public function rippleDetails(): HasOne
    {
        return $this->hasOne(CampaignRippleDetail::class);
    }

    public function pitchDetails(): HasOne
    {
        return $this->hasOne(CampaignPitchDetail::class);
    }

    public function coBrands(): HasMany
    {
        return $this->hasMany(CampaignCoBrand::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(CampaignApplication::class);
    }

    public function entries(): HasMany
    {
        return $this->hasMany(Entry::class);
    }

    public function escrowTransaction(): HasOne
    {
        return $this->hasOne(EscrowTransaction::class);
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class);
    }

    public function analytics(): HasMany
    {
        return $this->hasMany(CampaignAnalytic::class);
    }

    public function resources(): HasMany
    {
        return $this->hasMany(CampaignResource::class);
    }
}
