<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\BrandProfile;
use App\Models\CreatorProfile;
use App\Models\Industry;
use App\Models\Niche;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

final class TestUserSeeder extends Seeder
{
    public function run(): void
    {
        $this->createAdmin();
        $this->createBrand();
        $this->createBrandGrowth();
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

    private function createBrandGrowth(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'brand.pro@productmarket.test'],
            [
                'name' => 'Pro Brand',
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
                'company_name' => 'Pro Brand Co',
                'website' => 'https://probrand.example.com',
                'industry_id' => $industry?->id,
                'description' => 'A growth-stage brand running multiple creator campaigns.',
                'is_agency' => false,
                'stripe_customer_id' => 'cus_test_brand_growth',
                'onboarding_completed_at' => now(),
            ],
        );

        // Fake active Growth subscription so middleware passes without real Stripe
        $exists = DB::table('subscriptions')
            ->where('user_id', $user->id)
            ->where('type', 'brand')
            ->exists();

        if (! $exists) {
            DB::table('subscriptions')->insert([
                'user_id' => $user->id,
                'type' => 'brand',
                'stripe_id' => 'sub_test_brand_growth_' . Str::random(8),
                'stripe_status' => 'active',
                'stripe_price' => config('billing.brand_plans.growth.stripe_monthly'),
                'quantity' => 1,
                'trial_ends_at' => null,
                'ends_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
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
