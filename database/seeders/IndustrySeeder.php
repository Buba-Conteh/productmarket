<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Industry;
use Illuminate\Database\Seeder;

final class IndustrySeeder extends Seeder
{
    public function run(): void
    {
        $industries = [
            ['name' => 'Health & Wellness', 'slug' => 'health-wellness'],
            ['name' => 'Beauty & Personal Care', 'slug' => 'beauty-personal-care'],
            ['name' => 'Fashion & Apparel', 'slug' => 'fashion-apparel'],
            ['name' => 'Food & Beverage', 'slug' => 'food-beverage'],
            ['name' => 'Technology & Software', 'slug' => 'technology-software'],
            ['name' => 'Consumer Electronics', 'slug' => 'consumer-electronics'],
            ['name' => 'Financial Services', 'slug' => 'financial-services'],
            ['name' => 'Travel & Hospitality', 'slug' => 'travel-hospitality'],
            ['name' => 'Home & Furniture', 'slug' => 'home-furniture'],
            ['name' => 'Automotive', 'slug' => 'automotive'],
            ['name' => 'Education & E-Learning', 'slug' => 'education-elearning'],
            ['name' => 'Entertainment & Media', 'slug' => 'entertainment-media'],
            ['name' => 'Gaming', 'slug' => 'gaming'],
            ['name' => 'Pet Care', 'slug' => 'pet-care'],
            ['name' => 'Sports & Fitness', 'slug' => 'sports-fitness'],
            ['name' => 'Other', 'slug' => 'other'],
        ];

        foreach ($industries as $index => $industry) {
            Industry::updateOrCreate(
                ['slug' => $industry['slug']],
                $industry + ['is_active' => true, 'sort_order' => $index + 1],
            );
        }
    }
}
