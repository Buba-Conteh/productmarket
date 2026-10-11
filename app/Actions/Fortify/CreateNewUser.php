<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use App\Services\ReferralService;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    public function __construct(private readonly ReferralService $referralService) {}

    /**
     * Validate and create a newly registered user.
     *
     * The account type (brand / creator) is no longer collected here — the
     * user picks it on the role-select step after signing up, exactly like
     * Google and phone signups.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ])->validate();

        $user = User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
            'referral_code' => $this->referralService->generateCode(new User),
        ]);

        // Backward compatibility: older clients (e.g. a signup page loaded
        // before the role dropdown was removed) still send a `role`. Honor it
        // so those users aren't asked to choose twice.
        $legacyRole = $input['role'] ?? null;

        if (in_array($legacyRole, ['brand', 'creator'], true)) {
            $user->assignRole($legacyRole);

            if (! empty($input['ref'])) {
                $this->referralService->attachReferral($user, $input['ref'], $legacyRole);
            }

            return $user;
        }

        // The role isn't known yet, so hold on to what the role-select step
        // needs: a preselected card (from the landing page CTAs) and any
        // referral code, which is attached once the role is chosen.
        if (in_array($input['preferred_role'] ?? null, ['brand', 'creator'], true)) {
            session(['preferred_role' => $input['preferred_role']]);
        }

        if (! empty($input['ref'])) {
            session(['pending_referral_code' => $input['ref']]);
        }

        return $user;
    }
}
