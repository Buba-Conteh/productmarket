<?php

declare(strict_types=1);

namespace App\Models;

use App\Support\FileUploader;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Cashier\Billable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'phone', 'password', 'avatar', 'country', 'status', 'referral_code', 'phone_verified_at', 'email_verified_at'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use Billable, HasFactory, HasRoles, HasUlids, Notifiable, TwoFactorAuthenticatable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'last_active_at' => 'datetime',
        ];
    }

    /** @var list<string> */
    protected $appends = ['avatar_url'];

    /**
     * The picture to render for this user.
     *
     * An avatar uploaded here always wins; otherwise the profile picture from a
     * connected platform is used. Resolving the fallback at read time rather
     * than copying it into `users.avatar` means a platform sync can never
     * overwrite a picture the user deliberately uploaded, so no "source" flag
     * is needed to tell the two apart.
     *
     * Falls back to the stored value alone when `socialAccounts` isn't loaded,
     * so this never fires a query per row in a list.
     */
    public function getAvatarUrlAttribute(): ?string
    {
        if (is_string($this->avatar) && $this->avatar !== '') {
            return str_starts_with($this->avatar, 'http')
                ? $this->avatar
                : FileUploader::url($this->avatar);
        }

        if (! $this->relationLoaded('socialAccounts')) {
            return null;
        }

        return $this->socialAccounts
            ->pluck('avatar_url')
            ->first(fn (?string $url) => is_string($url) && $url !== '');
    }

    /**
     * Whether the user has chosen a primary role (brand or creator). Social /
     * phone signups land without one until they pick on the role-select step.
     */
    public function hasSelectedRole(): bool
    {
        return $this->hasRole('brand') || $this->hasRole('creator');
    }

    public function brandProfile(): HasOne
    {
        return $this->hasOne(BrandProfile::class);
    }

    public function creatorProfile(): HasOne
    {
        return $this->hasOne(CreatorProfile::class);
    }

    public function socialAccounts(): HasMany
    {
        return $this->hasMany(SocialAccount::class);
    }

    public function referralsMade(): HasMany
    {
        return $this->hasMany(Referral::class, 'referrer_user_id');
    }

    public function referralsReceived(): HasMany
    {
        return $this->hasMany(Referral::class, 'referred_user_id');
    }

    public function notificationPreferences(): HasMany
    {
        return $this->hasMany(UserNotificationPreference::class);
    }

    public function subscriptionStatuses(): HasMany
    {
        return $this->hasMany(SubscriptionStatus::class);
    }

    public function subscriptionStatus(string $role): ?SubscriptionStatus
    {
        return $this->subscriptionStatuses()->where('role', $role)->first();
    }
}
