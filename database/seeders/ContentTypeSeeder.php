<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\ContentType;
use Illuminate\Database\Seeder;

final class ContentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $contentTypes = [
            [
                'name' => 'Get Ready With Me',
                'slug' => 'grwm',
                'description' => 'Creator gets ready while showcasing the product.',
            ],
            [
                'name' => 'Product Demo',
                'slug' => 'demo',
                'description' => 'Direct demonstration of the product in use.',
            ],
            [
                'name' => 'Unboxing',
                'slug' => 'unboxing',
                'description' => 'First impressions while unpacking the product.',
            ],
            [
                'name' => 'Lifestyle',
                'slug' => 'lifestyle',
                'description' => 'Product integrated naturally into daily life.',
            ],
            [
                'name' => 'Review',
                'slug' => 'review',
                'description' => 'Honest review covering pros and cons.',
            ],
            [
                'name' => 'Tutorial',
                'slug' => 'tutorial',
                'description' => 'Step-by-step how-to using the product.',
            ],
            [
                'name' => 'Day in the Life',
                'slug' => 'day-in-the-life',
                'description' => 'A day featuring the product in real scenarios.',
            ],
            [
                'name' => 'Before and After',
                'slug' => 'before-after',
                'description' => 'Transformation content showing results.',
            ],
            [
                'name' => 'Skit',
                'slug' => 'skit',
                'description' => 'Scripted short-form comedy or story.',
            ],
            [
                'name' => 'Testimonial',
                'slug' => 'testimonial',
                'description' => 'Personal endorsement or success story.',
            ],
        ];

        foreach ($contentTypes as $index => $contentType) {
            ContentType::updateOrCreate(
                ['slug' => $contentType['slug']],
                $contentType + ['is_active' => true, 'sort_order' => $index + 1],
            );
        }
    }
}
