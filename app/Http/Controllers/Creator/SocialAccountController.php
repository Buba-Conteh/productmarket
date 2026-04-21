<?php

declare(strict_types=1);

namespace App\Http\Controllers\Creator;

use App\Http\Controllers\Controller;
use App\Services\Social\PlatformProviderFactory;
use App\Services\Social\SocialAccountService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

final class SocialAccountController extends Controller
{
    public function __construct(
        private readonly SocialAccountService $accounts,
        private readonly PlatformProviderFactory $factory,
    ) {}

    public function redirect(Request $request, string $platform): RedirectResponse
    {
        $this->validatePlatform($platform);

        $state = Str::random(40);
        $request->session()->put($this->stateKey($platform), $state);

        $url = $this->accounts->buildAuthorizationUrl($platform, $state);

        return redirect()->away($url);
    }

    public function callback(Request $request, string $platform): RedirectResponse
    {
        $this->validatePlatform($platform);

        $expectedState = $request->session()->pull($this->stateKey($platform));

        abort_unless(
            $expectedState !== null && hash_equals($expectedState, (string) $request->query('state', '')),
            419,
            'Invalid OAuth state.',
        );

        $code = (string) $request->query('code', '');
        abort_if($code === '', 422, 'Missing authorization code.');

        try {
            $this->accounts->connect($request->user(), $platform, $code);
        } catch (Throwable $e) {
            Log::warning('social_account_connect_failed', [
                'platform' => $platform,
                'user_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->route('onboarding.creator.social')
                ->withErrors(['platform' => "We couldn't connect your {$platform} account. Try again shortly."]);
        }

        return redirect()
            ->intended(route('onboarding.creator.social'))
            ->with('status', ucfirst($platform).' account connected.');
    }

    public function destroy(Request $request, string $platform): RedirectResponse
    {
        $this->validatePlatform($platform);

        $this->accounts->disconnect($request->user(), $platform);

        return back()->with('status', ucfirst($platform).' account disconnected.');
    }

    private function validatePlatform(string $platform): void
    {
        abort_unless(
            in_array($platform, $this->factory->supportedPlatforms(), true),
            404,
        );
    }

    private function stateKey(string $platform): string
    {
        return "social_oauth_state_{$platform}";
    }
}
