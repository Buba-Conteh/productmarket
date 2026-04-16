<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
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

        if (app()->environment('local')) {
            User::factory()->create([
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);
        }
    }
}
