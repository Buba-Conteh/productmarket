<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PlatformSetting;
use App\Models\Referral;
use App\Models\User;
use Illuminate\Support\Str;

final readonly class ReferralService
{
    public function generateCode(User $user): string
    {
        return strtoupper(Str::random(8));
    }

    public function attachReferral(User $newUser, string $referralCode, string $type): void
    {
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

    public function qualify(User $referredUser): void
    {
        $referral = Referral::where('referred_user_id', $referredUser->id)
            ->where('status', 'pending')
            ->first();

        if (! $referral) {
            return;
        }

        $referral->update([
            'status' => 'qualified',
            'qualified_at' => now(),
        ]);

        $this->reward($referral);
    }

    private function reward(Referral $referral): void
    {
        $settings = PlatformSetting::current();
        $referrer = $referral->referrer;

        if ($referral->type === 'creator') {
            $bonus = (float) ($settings->referral_creator_bonus ?? 0);

            if ($bonus > 0 && $referrer->hasRole('creator') && $referrer->creatorProfile) {
                $referrer->creatorProfile->increment('pending_earnings', $bonus);
            }
        } elseif ($referral->type === 'brand') {
            $credit = (float) ($settings->referral_brand_credit ?? 0);

            if ($credit > 0 && $referrer->hasRole('brand')) {
                // Add Cashier balance credit
                $referrer->creditBalance($credit * 100, 'Referral bonus');
            }
        }

        $referral->update([
            'status' => 'rewarded',
            'rewarded_at' => now(),
        ]);
    }
}
