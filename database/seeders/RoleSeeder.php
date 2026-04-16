<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

final class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = ['brand', 'creator', 'admin'];

        foreach ($roles as $role) {
            Role::findOrCreate($role, 'web');
        }
    }
}
