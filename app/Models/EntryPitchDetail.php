<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class EntryPitchDetail extends Model
{
    use HasUlids;

    public $timestamps = false;

    protected $fillable = [
        'entry_id',
        'proposed_bid',
        'accepted_bid',
        'pitch',
        'bid_accepted_at',
    ];

    protected function casts(): array
    {
        return [
            'proposed_bid' => 'decimal:2',
            'accepted_bid' => 'decimal:2',
            'bid_accepted_at' => 'datetime',
        ];
    }

    public function entry(): BelongsTo
    {
        return $this->belongsTo(Entry::class);
    }
}
