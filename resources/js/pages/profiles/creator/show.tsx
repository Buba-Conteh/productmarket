import { Head, Link } from '@inertiajs/react';
import {
    Award,
    Eye,
    Globe,
    MapPin,
    Share2,
    TrendingUp,
    User,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { CreatorPublicProfile, EntryPortfolioItem } from '@/types';

type Props = {
    creator: CreatorPublicProfile;
    entries: EntryPortfolioItem[];
};

function formatCount(n: number): string {
    if (n >= 1_000_000) {
return `${(n / 1_000_000).toFixed(1)}M`;
}

    if (n >= 1_000) {
return `${(n / 1_000).toFixed(1)}K`;
}

    return String(n);
}

const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
    contest: 'Contest',
    ripple: 'Ripple',
    pitch: 'Pitch',
};

export default function CreatorProfileShow({ creator, entries }: Props) {
    const initials = creator.display_name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <>
            <Head title={`${creator.display_name} — Creator Profile`} />

            <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
                {/* Header */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                            <Avatar className="size-24 shrink-0">
                                <AvatarImage
                                    src={creator.user.avatar ?? undefined}
                                    alt={creator.display_name}
                                />
                                <AvatarFallback className="text-2xl">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 space-y-3">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h1 className="text-2xl font-bold">
                                            {creator.display_name}
                                        </h1>
                                        {creator.user.country && (
                                            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                                <MapPin className="size-3.5" />
                                                {creator.user.country}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link
                                                href={`/creators/${creator.id}/media-kit`}
                                            >
                                                <Share2 className="mr-1.5 size-4" />
                                                Media Kit
                                            </Link>
                                        </Button>
                                    </div>
                                </div>

                                {creator.bio && (
                                    <p className="text-sm text-muted-foreground">
                                        {creator.bio}
                                    </p>
                                )}

                                {creator.niches.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {creator.niches.map((niche) => (
                                            <Badge
                                                key={niche.id}
                                                variant="secondary"
                                            >
                                                {niche.name}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                        <CardContent className="flex items-center gap-3 pt-6">
                            <Eye className="size-8 text-muted-foreground" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {formatCount(creator.total_views)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Total Verified Views
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 pt-6">
                            <Award className="size-8 text-muted-foreground" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {creator.entries_count}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Live Campaigns
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 pt-6">
                            <TrendingUp className="size-8 text-muted-foreground" />
                            <div>
                                <p className="text-2xl font-bold">
                                    $
                                    {Number(
                                        creator.total_earned,
                                    ).toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Total Earned
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Social Accounts */}
                {creator.social_accounts.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Verified Social Accounts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="divide-y">
                                {creator.social_accounts.map((account, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Globe className="size-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {account.platform.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    @{account.handle}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-6 text-right text-sm">
                                            <div>
                                                <p className="font-semibold">
                                                    {formatCount(
                                                        account.follower_count,
                                                    )}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Followers
                                                </p>
                                            </div>
                                            {account.avg_views !== null && (
                                                <div>
                                                    <p className="font-semibold">
                                                        {formatCount(
                                                            account.avg_views,
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Avg Views
                                                    </p>
                                                </div>
                                            )}
                                            {account.engagement_rate !==
                                                null && (
                                                <div>
                                                    <p className="font-semibold">
                                                        {account.engagement_rate}
                                                        %
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Engagement
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Entry Portfolio */}
                <div>
                    <h2 className="mb-4 text-lg font-semibold">Portfolio</h2>
                    {entries.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                                <User className="size-8 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    No live campaigns yet.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {entries.map((entry) => (
                                <Card key={entry.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <CardTitle className="line-clamp-1 text-sm">
                                                {entry.campaign_title ?? '—'}
                                            </CardTitle>
                                            {entry.campaign_type && (
                                                <Badge
                                                    variant="outline"
                                                    className="shrink-0 text-xs capitalize"
                                                >
                                                    {CAMPAIGN_TYPE_LABELS[
                                                        entry.campaign_type
                                                    ] ?? entry.campaign_type}
                                                </Badge>
                                            )}
                                        </div>
                                        {entry.caption && (
                                            <CardDescription className="line-clamp-2 text-xs">
                                                {entry.caption}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-1.5">
                                            {entry.platforms.map((p, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center justify-between text-sm"
                                                >
                                                    <span className="text-muted-foreground">
                                                        {p.name}
                                                    </span>
                                                    <span className="flex items-center gap-1 font-medium">
                                                        <Eye className="size-3.5 text-muted-foreground" />
                                                        {formatCount(
                                                            p.verified_view_count,
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        {entry.live_at && (
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                Posted{' '}
                                                {new Date(
                                                    entry.live_at,
                                                ).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

CreatorProfileShow.layout = {
    breadcrumbs: [{ title: 'Creator Profile', href: '#' }],
};
