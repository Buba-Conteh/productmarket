<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use App\Services\ReferralService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
            'role' => ['required', Rule::in(['brand', 'creator'])],
        ])->validate();

        $referralService = app(ReferralService::class);

        return DB::transaction(function () use ($input, $referralService): User {
            $user = User::create([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
                'referral_code' => $referralService->generateCode(new User),
            ]);

            $user->assignRole($input['role']);

            // Attach referral if an invite code was passed
            if (! empty($input['ref'])) {
                $referralService->attachReferral($user, $input['ref'], $input['role']);
            }

            return $user;
        });
    }
}
