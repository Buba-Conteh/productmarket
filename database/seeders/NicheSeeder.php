<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Niche;
use Illuminate\Database\Seeder;

final class NicheSeeder extends Seeder
{
    public function run(): void
    {
        $niches = [
            ['name' => 'Fitness', 'slug' => 'fitness'],
            ['name' => 'Beauty', 'slug' => 'beauty'],
            ['name' => 'Fashion', 'slug' => 'fashion'],
            ['name' => 'Food', 'slug' => 'food'],
            ['name' => 'Travel', 'slug' => 'travel'],
            ['name' => 'Tech', 'slug' => 'tech'],
            ['name' => 'Gaming', 'slug' => 'gaming'],
            ['name' => 'Lifestyle', 'slug' => 'lifestyle'],
            ['name' => 'Parenting', 'slug' => 'parenting'],
            ['name' => 'Finance', 'slug' => 'finance'],
            ['name' => 'Education', 'slug' => 'education'],
            ['name' => 'Health & Wellness', 'slug' => 'health-wellness'],
            ['name' => 'Home & Garden', 'slug' => 'home-garden'],
            ['name' => 'Pets', 'slug' => 'pets'],
            ['name' => 'Automotive', 'slug' => 'automotive'],
            ['name' => 'Sports', 'slug' => 'sports'],
            ['name' => 'Music', 'slug' => 'music'],
            ['name' => 'Art & Design', 'slug' => 'art-design'],
            ['name' => 'Business', 'slug' => 'business'],
            ['name' => 'Comedy', 'slug' => 'comedy'],
        ];

        foreach ($niches as $index => $niche) {
            Niche::updateOrCreate(
                ['slug' => $niche['slug']],
                $niche + ['is_active' => true, 'sort_order' => $index + 1],
            );
        }
    }
}
