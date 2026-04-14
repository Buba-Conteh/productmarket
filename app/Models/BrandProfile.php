<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class BrandProfile extends Model
{
    use HasUlids;

    protected $fillable = [
        'user_id',
        'company_name',
        'website',
        'industry_id',
        'description',
        'logo',
        'stripe_customer_id',
        'is_agency',
    ];

    protected function casts(): array
    {
        return [
            'is_agency' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function industry(): BelongsTo
    {
        return $this->belongsTo(Industry::class);
    }
}
