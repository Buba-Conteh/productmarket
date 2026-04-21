<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class UserNotificationPreference extends Model
{
    use HasUlids;

    protected $fillable = [
        'user_id',
        'type',
        'in_app_enabled',
        'email_enabled',
    ];

    protected function casts(): array
    {
        return [
            'in_app_enabled' => 'boolean',
            'email_enabled' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
