import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle2, ExternalLink, Link2Off, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { connect, disconnect } from '@/routes/creator/social';

const CREATOR_STEPS = [
    { label: 'Profile' },
    { label: 'Niches' },
    { label: 'Social' },
    { label: 'Payout' },
];

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
    verified: boolean;
    platform: Platform;
};

type Props = {
    socialAccounts: SocialAccount[];
};

const PLATFORMS: { slug: string; name: string; description: string; color: string }[] = [
    {
        slug: 'tiktok',
        name: 'TikTok',
        description: 'Connect to enable verified view tracking on TikTok entries.',
        color: 'bg-black text-white',
    },
    {
        slug: 'instagram',
        name: 'Instagram',
        description: 'Connect to verify Reels and video post view counts.',
        color: 'bg-gradient-to-br from-purple-600 to-pink-500 text-white',
    },
    {
        slug: 'youtube',
        name: 'YouTube',
        description: 'Connect to track verified views on YouTube videos and Shorts.',
        color: 'bg-red-600 text-white',
    },
];

function formatFollowers(count: number): string {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
    return String(count);
}

export default function CreatorSocial({ socialAccounts }: Props) {
    const { errors } = usePage().props as { errors: Record<string, string> };

    const connectedMap = Object.fromEntries(
        socialAccounts.map((a) => [a.platform.slug, a]),
    );

    function connectPlatform(slug: string) {
        window.location.href = connect.url({ platform: slug });
    }

    function disconnectPlatform(slug: string) {
        router.delete(disconnect.url({ platform: slug }));
    }

    function proceed() {
        router.post('/onboarding/creator/social');
    }

    const connectedCount = Object.keys(connectedMap).length;

    return (
        <>
            <Head title="Connect Social Accounts" />

            <div className="space-y-5">
                {errors.platform && (
                    <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
                        {errors.platform}
                    </p>
                )}

                <div className="space-y-3">
                    {PLATFORMS.map((platform) => {
                        const account = connectedMap[platform.slug];
                        const isConnected = Boolean(account);

                        return (
                            <div
                                key={platform.slug}
                                className="flex items-center gap-4 rounded-xl border p-4 transition-colors"
                            >
                                {/* Platform icon placeholder */}
                                <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${platform.color}`}
                                >
                                    {platform.name[0]}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium">
                                            {platform.name}
                                        </p>
                                        {isConnected && (
                                            <span className="flex items-center gap-1 text-xs text-emerald-600">
                                                <CheckCircle2 className="size-3" />
                                                Connected
                                            </span>
                                        )}
                                    </div>

                                    {isConnected && account ? (
                                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                            @{account.handle} &middot;{' '}
                                            {formatFollowers(account.follower_count)} followers
                                        </p>
                                    ) : (
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {platform.description}
                                        </p>
                                    )}
                                </div>

                                {isConnected ? (
                                    <button
                                        type="button"
                                        onClick={() => disconnectPlatform(platform.slug)}
                                        className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                                        title={`Disconnect ${platform.name}`}
                                    >
                                        <Link2Off className="size-4" />
                                    </button>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => connectPlatform(platform.slug)}
                                        className="shrink-0"
                                    >
                                        <ExternalLink className="mr-1.5 size-3" />
                                        Connect
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Trust note */}
                <div className="flex gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                    <Shield className="mt-0.5 size-3.5 shrink-0" />
                    <p>
                        We only request read-only access. Your credentials are encrypted
                        and never shared. You can disconnect at any time from settings.
                    </p>
                </div>

                <div className="space-y-2">
                    <Button
                        className="w-full"
                        onClick={proceed}
                        disabled={connectedCount === 0}
                    >
                        {connectedCount > 0
                            ? `Continue — ${connectedCount} account${connectedCount > 1 ? 's' : ''} connected`
                            : 'Connect at least one account to continue'}
                    </Button>

                    <button
                        type="button"
                        onClick={proceed}
                        className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
                    >
                        Skip — connect accounts later from settings
                    </button>
                </div>
            </div>
        </>
    );
}

CreatorSocial.layout = {
    title: 'Connect your social accounts',
    description:
        'Link your platforms for verified view tracking and creator discovery.',
    steps: CREATOR_STEPS,
    currentStep: 2,
};
