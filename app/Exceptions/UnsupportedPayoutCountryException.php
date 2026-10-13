<?php

declare(strict_types=1);

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown when a creator cannot get a Stripe payout account: either they have
 * not set a country yet, or Stripe does not support payouts to their country.
 */
final class UnsupportedPayoutCountryException extends RuntimeException
{
    public static function missing(): self
    {
        return new self('Select your country before setting up payouts.');
    }

    public static function forCountry(string $country): self
    {
        return new self("Stripe can't send payouts to your country ({$country}) yet. Contact support and we'll arrange another payout method.");
    }
}
