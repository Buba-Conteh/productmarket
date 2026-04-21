<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

final class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            PlatformSeeder::class,
            NicheSeeder::class,
            IndustrySeeder::class,
            ContentTypeSeeder::class,
            PlatformSettingSeeder::class,
            RoleSeeder::class,
        ]);

        if (app()->environment('local', 'staging')) {
            $this->call(TestUserSeeder::class);
        }
    }
}
