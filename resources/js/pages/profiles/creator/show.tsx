import { Head, Link } from '@inertiajs/react';
import { Award, Eye, MapPin, Share2, TrendingUp, User } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { ConnectedAccountRow } from '@/components/social/connected-account-row';
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
import { formatCompactNumber as formatCount } from '@/lib/format';
import type { CreatorPublicProfile, EntryPortfolioItem } from '@/types';

type Props = {
    creator: CreatorPublicProfile;
    entries: EntryPortfolioItem[];
};

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
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
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
                    <StatCard
                        label="Total Verified Views"
                        value={formatCount(creator.total_views)}
                        icon={Eye}
                    />
                    <StatCard
                        label="Live Campaigns"
                        value={String(creator.entries_count)}
                        icon={Award}
                    />
                    <StatCard
                        label="Total Earned"
                        value={`$${Number(creator.total_earned).toLocaleString()}`}
                        icon={TrendingUp}
                        accent="primary"
                    />
                </div>

                {/* Social Accounts */}
                {creator.social_accounts.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Connected Social Accounts
                            </CardTitle>
                            <CardDescription>
                                Metrics pulled directly from each platform —
                                never self-reported.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="divide-y">
                                {creator.social_accounts.map((account) => (
                                    <ConnectedAccountRow
                                        key={account.platform.slug}
                                        account={account}
                                    />
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
