<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CampaignAnalytic extends Model
{
    use HasUlids;

    public $timestamps = false;

    protected $fillable = [
        'campaign_id',
        'date',
        'total_entries',
        'total_live',
        'total_views',
        'total_paid_out',
        'top_entry_id',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'total_entries' => 'integer',
            'total_live' => 'integer',
            'total_views' => 'integer',
            'total_paid_out' => 'decimal:2',
        ];
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function topEntry(): BelongsTo
    {
        return $this->belongsTo(Entry::class, 'top_entry_id');
    }
}
