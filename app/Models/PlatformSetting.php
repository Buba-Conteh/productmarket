<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

final class PlatformSetting extends Model
{
    public $incrementing = false;

    public const UPDATED_AT = 'updated_at';

    public const CREATED_AT = null;

    protected $fillable = [
        'id',
        'platform_fee_pct',
        'contest_split_first',
        'contest_split_second',
        'contest_split_third',
        'contest_split_pool',
        'min_creator_payout',
        'referral_creator_bonus',
        'referral_brand_credit',
    ];

    protected function casts(): array
    {
        return [
            'platform_fee_pct' => 'decimal:2',
            'contest_split_first' => 'decimal:2',
            'contest_split_second' => 'decimal:2',
            'contest_split_third' => 'decimal:2',
            'contest_split_pool' => 'decimal:2',
            'min_creator_payout' => 'decimal:2',
            'referral_creator_bonus' => 'decimal:2',
            'referral_brand_credit' => 'decimal:2',
        ];
    }

    public static function current(): self
    {
        return self::firstOrCreate(['id' => 1]);
    }
}
