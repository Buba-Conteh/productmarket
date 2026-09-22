import { Head, router, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    ExternalLink,
    Link2Off,
    RefreshCw,
    Shield,
} from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { SocialStatChips } from '@/components/social/social-stat-chips';
import { Button } from '@/components/ui/button';
import { connect, disconnect, refresh } from '@/routes/creator/social';

type Platform = {
    id: string;
    name: string;
    slug: string;
    icon_url: string | null;
};

type SocialAccount = {
    id: string;
    handle: string;
    follower_count: number;
    avg_views: number | null;
    total_likes: number | null;
    post_count: number | null;
    verified: boolean;
    last_synced_at: string | null;
    platform: Platform;
};

type Props = {
    socialAccounts: SocialAccount[];
    supportedPlatforms: string[];
};

const PLATFORM_META: Record<
    string,
    { name: string; description: string; iconClass: string }
> = {
    tiktok: {
        name: 'TikTok',
        description: 'Verified views on TikTok videos',
        iconClass: 'bg-black text-white',
    },
    instagram: {
        name: 'Instagram',
        description: 'Verified views on Reels and posts',
        iconClass: 'bg-gradient-to-br from-purple-600 to-pink-500 text-white',
    },
    youtube: {
        name: 'YouTube',
        description: 'Verified views on videos and Shorts',
        iconClass: 'bg-red-600 text-white',
    },
};

export default function SocialAccounts({
    socialAccounts,
    supportedPlatforms,
}: Props) {
    const { errors } = usePage().props as { errors: Record<string, string> };
    const [refreshing, setRefreshing] = useState<string | null>(null);

    const connectedMap = Object.fromEntries(
        socialAccounts.map((a) => [a.platform.slug, a]),
    );

    function connectPlatform(slug: string) {
        window.location.assign(connect.url({ platform: slug }));
    }

    function disconnectPlatform(slug: string) {
        router.delete(disconnect.url({ platform: slug }), {
            preserveScroll: true,
        });
    }

    function refreshPlatform(slug: string) {
        setRefreshing(slug);

        router.post(
            refresh.url({ platform: slug }),
            {},
            {
                preserveScroll: true,
                onFinish: () => setRefreshing(null),
            },
        );
    }

    const displayedSlugs = supportedPlatforms.filter(
        (s) => PLATFORM_META[s] !== undefined,
    );

    return (
        <>
            <Head title="Social Accounts" />

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Connected social accounts"
                    description="Connect your platforms to enable verified view tracking. We only request read-only access."
                />

                {errors.platform && (
                    <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
                        {errors.platform}
                    </p>
                )}

                <div className="space-y-3">
                    {displayedSlugs.map((slug) => {
                        const meta = PLATFORM_META[slug]!;
                        const account = connectedMap[slug];
                        const isConnected = Boolean(account);

                        return (
                            <div
                                key={slug}
                                className="flex items-center gap-4 rounded-xl border p-4"
                            >
                                {/* Platform icon */}
                                <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${meta.iconClass}`}
                                >
                                    {meta.name[0]}
                                </div>

                                {/* Info */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium">
                                            {meta.name}
                                        </p>
                                        {isConnected && (
                                            <span className="flex items-center gap-1 text-xs text-emerald-600">
                                                <CheckCircle2 className="size-3" />
                                                Connected
                                            </span>
                                        )}
                                    </div>

                                    {isConnected && account ? (
                                        <div className="mt-0.5 space-y-0.5">
                                            <p className="text-xs font-medium text-foreground">
                                                @{account.handle}
                                            </p>
                                            <SocialStatChips
                                                account={{
                                                    ...account,
                                                    engagement_rate: null,
                                                }}
                                                showSyncedAt
                                            />
                                        </div>
                                    ) : (
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {meta.description}
                                        </p>
                                    )}
                                </div>

                                {/* Action */}
                                {isConnected ? (
                                    <div className="flex shrink-0 items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={refreshing === slug}
                                            onClick={() =>
                                                refreshPlatform(slug)
                                            }
                                            className="text-muted-foreground"
                                        >
                                            <RefreshCw
                                                className={`mr-1.5 size-3.5 ${refreshing === slug ? 'animate-spin' : ''}`}
                                            />
                                            {refreshing === slug
                                                ? 'Refreshing'
                                                : 'Refresh'}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                disconnectPlatform(slug)
                                            }
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <Link2Off className="mr-1.5 size-3.5" />
                                            Disconnect
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => connectPlatform(slug)}
                                        className="shrink-0"
                                    >
                                        <ExternalLink className="mr-1.5 size-3.5" />
                                        Connect
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Privacy note */}
                <div className="flex gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                    <Shield className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <p>
                        OAuth tokens are encrypted at rest and never shared with
                        brands or third parties. View counts are synced every 6
                        hours automatically once an account is connected.
                    </p>
                </div>
            </div>
        </>
    );
}

SocialAccounts.layout = {
    breadcrumbs: [
        {
            title: 'Social accounts',
            href: '/settings/social-accounts',
        },
    ],
};
