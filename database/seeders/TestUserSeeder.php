<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\BrandProfile;
use App\Models\CreatorProfile;
use App\Models\Industry;
use App\Models\Niche;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

final class TestUserSeeder extends Seeder
{
    public function run(): void
    {
        $this->createAdmin();
        $this->createBrand();
        $this->createCreator();
        $this->createCreatorPro();
    }

    private function createAdmin(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'admin@productmarket.test'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'status' => 'active',
            ],
        );

        $user->syncRoles(['admin']);
    }

    private function createBrand(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'brand@productmarket.test'],
            [
                'name' => 'Acme Brand',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'status' => 'active',
            ],
        );

        $user->syncRoles(['brand']);

        $industry = Industry::where('slug', 'technology-software')->first();

        BrandProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'company_name' => 'Acme Corp',
                'website' => 'https://acmecorp.example.com',
                'industry_id' => $industry?->id,
                'description' => 'A leading tech company looking for authentic creator partnerships.',
                'is_agency' => false,
                'onboarding_completed_at' => now(),
            ],
        );
    }

    private function createCreator(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'creator@productmarket.test'],
            [
                'name' => 'Jamie Creator',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'country' => 'US',
                'status' => 'active',
            ],
        );

        $user->syncRoles(['creator']);

        $profile = CreatorProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'display_name' => 'Jamie Creator',
                'bio' => 'Lifestyle and fitness content creator based in New York. Passionate about wellness and authentic brand stories.',
                'stripe_connect_status' => 'pending',
                'total_earned' => '0.00',
                'pending_earnings' => '0.00',
                'onboarding_completed_at' => now(),
            ],
        );

        $niches = Niche::whereIn('slug', ['fitness', 'lifestyle', 'health-wellness'])->pluck('id');
        $profile->niches()->sync($niches);
    }

    private function createCreatorPro(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'creator.pro@productmarket.test'],
            [
                'name' => 'Alex Pro',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'country' => 'US',
                'status' => 'active',
            ],
        );

        $user->syncRoles(['creator']);

        $profile = CreatorProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'display_name' => 'Alex Pro',
                'bio' => 'Tech and gaming content creator with 8 years of experience. Specialise in product reviews and tutorials.',
                'stripe_connect_status' => 'active',
                'total_earned' => '2450.00',
                'pending_earnings' => '320.00',
                'onboarding_completed_at' => now(),
            ],
        );

        $niches = Niche::whereIn('slug', ['tech', 'gaming', 'education'])->pluck('id');
        $profile->niches()->sync($niches);
    }
}
