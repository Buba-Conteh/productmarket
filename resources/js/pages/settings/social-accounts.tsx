import { Head, router, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    ExternalLink,
    Link2Off,
    RefreshCw,
    Shield,
    Users,
} from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { connect, disconnect } from '@/routes/creator/social';

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

function formatNumber(n: number): string {
    if (n >= 1_000_000) {
return `${(n / 1_000_000).toFixed(1)}M`;
}

    if (n >= 1_000) {
return `${(n / 1_000).toFixed(1)}K`;
}

    return String(n);
}

export default function SocialAccounts({
    socialAccounts,
    supportedPlatforms,
}: Props) {
    const { errors } = usePage().props as { errors: Record<string, string> };

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
                                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                            <span className="font-medium text-foreground">
                                                @{account.handle}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="size-3" />
                                                {formatNumber(
                                                    account.follower_count,
                                                )}{' '}
                                                followers
                                            </span>
                                            {account.avg_views ? (
                                                <span className="flex items-center gap-1">
                                                    <RefreshCw className="size-3" />
                                                    ~{formatNumber(
                                                        account.avg_views,
                                                    )}{' '}
                                                    avg views
                                                </span>
                                            ) : null}
                                            {account.last_synced_at && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="size-3" />
                                                    Synced{' '}
                                                    {account.last_synced_at}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {meta.description}
                                        </p>
                                    )}
                                </div>

                                {/* Action */}
                                {isConnected ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            disconnectPlatform(slug)
                                        }
                                        className="shrink-0 text-muted-foreground hover:text-destructive"
                                    >
                                        <Link2Off className="mr-1.5 size-3.5" />
                                        Disconnect
                                    </Button>
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
