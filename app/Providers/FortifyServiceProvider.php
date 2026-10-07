<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'canRegister' => Features::enabled(Features::registration()),
            'status' => $request->session()->get('status'),
            'metaDescription' => 'Log in to Trendko — your verified creator marketing platform. Access your campaigns, submissions, and earnings dashboard.',
            'ogTitle' => 'Trendko Login',
            'ogDescription' => 'Log in to access your Trendko account and manage campaigns or submissions.',
        ]));

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
            'metaDescription' => 'Reset your Trendko password.',
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
            'metaDescription' => 'Forgot your Trendko password? Enter your email to reset it.',
        ]));

        Fortify::verifyEmailView(fn (Request $request) => Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
            'metaDescription' => 'Verify your email address to activate your Trendko account.',
        ]));

        Fortify::registerView(fn () => Inertia::render('auth/register', [
            'canRegister' => Features::enabled(Features::registration()),
            'metaDescription' => 'Sign up for Trendko as a brand or creator. Free account setup with verified creator payments and campaign management.',
            'ogTitle' => 'Join Trendko — Verified Creator Marketing',
            'ogDescription' => 'Create your account now. Join thousands of brands and creators already running verified campaigns on Trendko.',
        ]));

        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge', [
            'metaDescription' => 'Enter your two-factor authentication code.',
        ]));

        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password', [
            'metaDescription' => 'Confirm your password for security.',
        ]));
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });
    }
}
