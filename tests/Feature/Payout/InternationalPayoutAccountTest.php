<?php

declare(strict_types=1);

use App\Exceptions\UnsupportedPayoutCountryException;
use App\Models\CreatorProfile;
use App\Models\User;
use App\Services\StripeConnectService;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    config(['cashier.secret' => 'sk_test_fake', 'payouts.platform_country' => 'US']);
});

function intlCreator(?string $country): CreatorProfile
{
    $user = User::factory()->create(['email_verified_at' => now(), 'country' => $country]);
    $user->assignRole('creator');

    return CreatorProfile::create([
        'user_id' => $user->id,
        'display_name' => 'Intl Creator',
        'stripe_connect_status' => 'pending',
        'total_earned' => 0,
        'pending_earnings' => 0,
        'onboarding_completed_at' => now(),
    ]);
}

it('creates a standard transfers-only account for creators in the platform country', function () {
    $params = app(StripeConnectService::class)->accountParams(intlCreator('US'), 'US');

    expect($params['country'])->toBe('US')
        ->and($params['capabilities'])->toBe(['transfers' => ['requested' => true]])
        ->and($params)->not->toHaveKey('tos_acceptance');
});

it('uses the recipient service agreement for creators outside the platform country', function (string $country) {
    $params = app(StripeConnectService::class)->accountParams(intlCreator($country), $country);

    expect($params['country'])->toBe($country)
        ->and($params['capabilities'])->toBe(['transfers' => ['requested' => true]])
        ->and($params['tos_acceptance'])->toBe(['service_agreement' => 'recipient']);
})->with(['GB', 'DE', 'GM', 'NG']);

it('refuses to create an account when the creator has no country', function () {
    app(StripeConnectService::class)->createExpressAccount(intlCreator(null));
})->throws(UnsupportedPayoutCountryException::class);

it('asks for a country on the payout page when the creator has none', function () {
    $creator = intlCreator(null);

    $this->actingAs($creator->user)
        ->get('/settings/payout-account')
        ->assertInertia(fn ($page) => $page->where('account.country', null));

    $this->actingAs($creator->user)
        ->post('/settings/payout-account/connect')
        ->assertSessionHasErrors('country');
});
