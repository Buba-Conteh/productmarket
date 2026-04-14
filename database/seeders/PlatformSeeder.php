<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Platform;
use Illuminate\Database\Seeder;

final class PlatformSeeder extends Seeder
{
    public function run(): void
    {
        $platforms = [
            ['name' => 'TikTok', 'slug' => 'tiktok', 'sort_order' => 1],
            ['name' => 'Instagram', 'slug' => 'instagram', 'sort_order' => 2],
            ['name' => 'YouTube', 'slug' => 'youtube', 'sort_order' => 3],
            ['name' => 'YouTube Shorts', 'slug' => 'youtube-shorts', 'sort_order' => 4],
            ['name' => 'X', 'slug' => 'x', 'sort_order' => 5],
            ['name' => 'Facebook', 'slug' => 'facebook', 'sort_order' => 6],
        ];

        foreach ($platforms as $platform) {
            Platform::updateOrCreate(
                ['slug' => $platform['slug']],
                $platform + ['is_active' => true],
            );
        }
    }
}
