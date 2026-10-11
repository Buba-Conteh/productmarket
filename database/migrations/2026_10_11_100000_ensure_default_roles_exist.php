<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * Roles are required for signup (role-select assigns brand / creator), so
     * create them on every environment rather than relying on the seeder
     * having been run. Idempotent: existing roles are left untouched.
     */
    public function up(): void
    {
        foreach (['brand', 'creator', 'admin'] as $role) {
            Role::findOrCreate($role, 'web');
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        // Intentionally left empty: removing roles would orphan assigned users.
    }
};
