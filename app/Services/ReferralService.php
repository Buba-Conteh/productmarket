<?php

declare(strict_types=1);

namespace App\Services;

use App\Jobs\ProcessPayoutJob;
use App\Models\PlatformSetting;
use App\Models\Referral;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

final readonly class ReferralService
{
    /** Session key holding a referral code until the new user picks a role. */
    public const string SESSION_KEY = 'pending_referral_code';

    /**
     * Generate a referral code no other user has.
     */
    public function generateCode(User $user): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (User::where('referral_code', $code)->exists());

        return $code;
    }

    /**
     * Give the user a referral code if they don't have one yet
     * (accounts created before every signup path set one).
     */
    public function ensureCode(User $user): string
    {
        if (! $user->referral_code) {
            $user->forceFill(['referral_code' => $this->generateCode($user)])->save();
        }

        return $user->referral_code;
    }

    public function attachReferral(User $newUser, string $referralCode, string $type): void
    {
        $referralCode = strtoupper(trim($referralCode));
        $referrer = User::where('referral_code', $referralCode)->first();

        if (! $referrer || $referrer->id === $newUser->id) {
            return;
        }

        Referral::firstOrCreate(
            ['referred_user_id' => $newUser->id],
            [
                'referrer_user_id' => $referrer->id,
                'referral_code' => $referralCode,
                'type' => $type,
                'status' => 'pending',
            ],
        );
    }

    /**
     * Mark the user's pending referral as qualified and reward the referrer.
     *
     * Call this after the triggering action has committed: the brand reward is
     * a Stripe API call and must never roll back (or be rolled back by) it.
     */
    public function qualify(User $referredUser): void
    {
        $referral = Referral::where('referred_user_id', $referredUser->id)
            ->where('status', 'pending')
            ->first();

        if (! $referral) {
            return;
        }

        // Claim atomically so a referral can only ever be qualified once.
        $claimed = Referral::whereKey($referral->id)
            ->where('status', 'pending')
            ->update(['status' => 'qualified', 'qualified_at' => now()]);

        if ($claimed === 0) {
            return;
        }

        $this->reward($referral->fresh());
    }

    /**
     * Reward the referrer according to their own role: creators get a cash
     * bonus paid out via Stripe Connect, brands get a subscription credit.
     * A referral stays "qualified" if no reward could be given.
     */
    private function reward(Referral $referral): void
    {
        $settings = PlatformSetting::current();
        $referrer = $referral->referrer;

        $rewarded = match (true) {
            $referrer->hasRole('creator') => $this->rewardCreator($referrer, $referral, (string) ($settings->referral_creator_bonus ?? 0)),
            $referrer->hasRole('brand') => $this->rewardBrand($referrer, $referral, (float) ($settings->referral_brand_credit ?? 0)),
            default => false,
        };

        if ($rewarded) {
            $referral->update(['status' => 'rewarded', 'rewarded_at' => now()]);
        }
    }

    private function rewardCreator(User $referrer, Referral $referral, string $bonus): bool
    {
        $creator = $referrer->creatorProfile;

        if ((float) $bonus <= 0 || ! $creator) {
            return false;
        }

        // Resolved lazily: PayoutService requires Stripe config, which signup
        // paths using this service (code generation) must not depend on.
        $payout = app(PayoutService::class)->createReferralPayout($creator, $referral, $bonus);

        // Held (still pending) until the creator has an active payout account.
        ProcessPayoutJob::dispatch($payout->id)->afterCommit();

        return true;
    }

    private function rewardBrand(User $referrer, Referral $referral, float $credit): bool
    {
        if ($credit <= 0 || ! $referrer->hasStripeId()) {
            return false;
        }

        try {
            $referrer->creditBalance((int) round($credit * 100), 'Referral bonus');
        } catch (Throwable $e) {
            Log::error('Referral brand credit failed', [
                'referral_id' => $referral->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }

        return true;
    }
}
