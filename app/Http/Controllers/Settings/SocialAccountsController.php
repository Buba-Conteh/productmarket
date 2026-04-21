<?php

declare(strict_types=1);

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\Social\PlatformProviderFactory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class SocialAccountsController extends Controller
{
    public function __construct(
        private readonly PlatformProviderFactory $factory,
    ) {}

    public function edit(Request $request): Response
    {
        $socialAccounts = $request->user()
            ->socialAccounts()
            ->with('platform')
            ->get()
            ->map(fn ($account) => [
                'id' => $account->id,
                'handle' => $account->handle,
                'follower_count' => $account->follower_count,
                'avg_views' => $account->avg_views,
                'verified' => $account->verified,
                'last_synced_at' => $account->last_synced_at?->diffForHumans(),
                'platform' => [
                    'id' => $account->platform->id,
                    'name' => $account->platform->name,
                    'slug' => $account->platform->slug,
                    'icon_url' => $account->platform->icon_url,
                ],
            ]);

        return Inertia::render('settings/social-accounts', [
            'socialAccounts' => $socialAccounts,
            'supportedPlatforms' => $this->factory->supportedPlatforms(),
        ]);
    }
}
