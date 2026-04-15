<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class EntryEditRequest extends Model
{
    use HasUlids;

    protected $fillable = [
        'entry_id',
        'requested_by_user_id',
        'notes',
        'status',
        'addressed_at',
    ];

    protected function casts(): array
    {
        return [
            'addressed_at' => 'datetime',
        ];
    }

    public function entry(): BelongsTo
    {
        return $this->belongsTo(Entry::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }
}
