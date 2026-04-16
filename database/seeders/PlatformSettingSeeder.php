<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\PlatformSetting;
use Illuminate\Database\Seeder;

final class PlatformSettingSeeder extends Seeder
{
    public function run(): void
    {
        PlatformSetting::updateOrCreate(['id' => 1], [
            'platform_fee_pct' => 15.00,
            'contest_split_first' => 50.00,
            'contest_split_second' => 25.00,
            'contest_split_third' => 15.00,
            'contest_split_pool' => 10.00,
            'min_creator_payout' => 25.00,
            'referral_creator_bonus' => 25.00,
            'referral_brand_credit' => 100.00,
        ]);
    }
}
