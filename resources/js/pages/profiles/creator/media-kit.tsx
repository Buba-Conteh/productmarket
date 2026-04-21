import { Head } from '@inertiajs/react';
import { Globe, MapPin, Printer } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { EntryPortfolioItem } from '@/types';

type MediaKitCreator = {
    id: string;
    display_name: string;
    bio: string | null;
    total_earned: string;
    entries_count: number;
    total_views: number;
    user: { name: string; avatar: string | null; country: string | null };
    niches: { name: string }[];
    social_accounts: {
        platform: { name: string; slug: string };
        handle: string;
        follower_count: number;
        avg_views: number | null;
        engagement_rate: string | null;
    }[];
};

type Props = {
    creator: MediaKitCreator;
    entries: EntryPortfolioItem[];
};

function formatCount(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

export default function CreatorMediaKit({ creator, entries }: Props) {
    const initials = creator.display_name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <>
            <Head title={`${creator.display_name} — Media Kit`} />

            <div className="mx-auto max-w-3xl px-4 py-8">
                {/* Print button — hidden on print */}
                <div className="mb-6 flex justify-end print:hidden">
                    <Button
                        variant="outline"
                        onClick={() => window.print()}
                        className="gap-2"
                    >
                        <Printer className="size-4" />
                        Print / Save PDF
                    </Button>
                </div>

                {/* Media kit body */}
                <div className="space-y-6 rounded-xl border bg-card p-8 shadow-sm print:border-0 print:shadow-none">
                    {/* Header */}
                    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
                        <Avatar className="size-20 shrink-0">
                            <AvatarImage
                                src={creator.user.avatar ?? undefined}
                                alt={creator.display_name}
                            />
                            <AvatarFallback className="text-xl">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold">
                                {creator.display_name}
                            </h1>
                            {creator.user.country && (
                                <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground sm:justify-start">
                                    <MapPin className="size-3.5" />
                                    {creator.user.country}
                                </p>
                            )}
                            {creator.niches.length > 0 && (
                                <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                                    {creator.niches.map((niche, i) => (
                                        <Badge key={i} variant="secondary">
                                            {niche.name}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {creator.bio && (
                        <>
                            <Separator />
                            <p className="text-sm text-muted-foreground">
                                {creator.bio}
                            </p>
                        </>
                    )}

                    <Separator />

                    {/* Key stats */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold">
                                {formatCount(creator.total_views)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Verified Views
                            </p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {creator.entries_count}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Campaigns
                            </p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                ${Number(creator.total_earned).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Total Earned
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Social accounts */}
                    {creator.social_accounts.length > 0 && (
                        <div>
                            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                Social Platforms
                            </h2>
                            <div className="space-y-3">
                                {creator.social_accounts.map((account, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between rounded-lg border p-3"
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
                        </div>
                    )}

                    {/* Recent work */}
                    {entries.length > 0 && (
                        <>
                            <Separator />
                            <div>
                                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                    Recent Work
                                </h2>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {entries.map((entry) => (
                                        <Card key={entry.id}>
                                            <CardHeader className="pb-1">
                                                <CardTitle className="line-clamp-1 text-sm">
                                                    {entry.campaign_title ??
                                                        '—'}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {entry.platforms.map((p, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center justify-between text-xs"
                                                    >
                                                        <span className="text-muted-foreground">
                                                            {p.name}
                                                        </span>
                                                        <span className="font-medium">
                                                            {formatCount(
                                                                p.verified_view_count,
                                                            )}{' '}
                                                            views
                                                        </span>
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <Separator />

                    <p className="text-center text-xs text-muted-foreground">
                        Generated by ProductMarket · All view counts are
                        platform-verified
                    </p>
                </div>
            </div>
        </>
    );
}

CreatorMediaKit.layout = {
    breadcrumbs: [{ title: 'Media Kit', href: '#' }],
};
