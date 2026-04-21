import { Head, Link } from '@inertiajs/react';
import { BarChart2, Briefcase, ExternalLink, Globe } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { BrandPublicProfile } from '@/types';

type CampaignSummary = {
    id: string;
    title: string;
    type: string;
    status: string;
    deadline?: string | null;
    platforms?: { name: string; slug: string }[];
};

type Props = {
    brand: BrandPublicProfile;
    active_campaigns: CampaignSummary[];
    past_campaigns: CampaignSummary[];
    stats: {
        total_campaigns: number;
        active_campaigns: number;
        completed_campaigns: number;
        total_entries: number;
    };
};

const TYPE_LABELS: Record<string, string> = {
    contest: 'Contest',
    ripple: 'Ripple',
    pitch: 'Pitch',
};

export default function BrandProfileShow({
    brand,
    active_campaigns,
    past_campaigns,
    stats,
}: Props) {
    const initials = brand.company_name
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <>
            <Head title={`${brand.company_name} — Brand Profile`} />

            <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
                {/* Header */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                            <Avatar className="size-20 shrink-0 rounded-xl">
                                <AvatarImage
                                    src={brand.logo ?? undefined}
                                    alt={brand.company_name}
                                />
                                <AvatarFallback className="rounded-xl text-xl">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 space-y-2">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h1 className="text-2xl font-bold">
                                            {brand.company_name}
                                        </h1>
                                        {brand.industry && (
                                            <p className="mt-0.5 text-sm text-muted-foreground">
                                                {brand.industry}
                                            </p>
                                        )}
                                    </div>
                                    {brand.website && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <a
                                                href={brand.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Globe className="mr-1.5 size-4" />
                                                Website
                                                <ExternalLink className="ml-1.5 size-3.5" />
                                            </a>
                                        </Button>
                                    )}
                                </div>
                                {brand.description && (
                                    <p className="text-sm text-muted-foreground">
                                        {brand.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-4">
                    {[
                        {
                            icon: BarChart2,
                            value: stats.total_campaigns,
                            label: 'Total Campaigns',
                        },
                        {
                            icon: Briefcase,
                            value: stats.active_campaigns,
                            label: 'Active Now',
                        },
                        {
                            icon: Briefcase,
                            value: stats.completed_campaigns,
                            label: 'Completed',
                        },
                        {
                            icon: BarChart2,
                            value: stats.total_entries,
                            label: 'Total Entries',
                        },
                    ].map(({ icon: Icon, value, label }) => (
                        <Card key={label}>
                            <CardContent className="flex items-center gap-3 pt-6">
                                <Icon className="size-7 shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="text-xl font-bold">{value}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {label}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Active campaigns */}
                {active_campaigns.length > 0 && (
                    <div>
                        <h2 className="mb-3 text-lg font-semibold">
                            Active Campaigns
                        </h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {active_campaigns.map((campaign) => (
                                <Link
                                    key={campaign.id}
                                    href={`/discover/${campaign.id}`}
                                    className="block"
                                >
                                    <Card className="h-full transition-shadow hover:shadow-md">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <CardTitle className="line-clamp-1 text-sm">
                                                    {campaign.title}
                                                </CardTitle>
                                                <Badge
                                                    variant="outline"
                                                    className="shrink-0 text-xs capitalize"
                                                >
                                                    {TYPE_LABELS[
                                                        campaign.type
                                                    ] ?? campaign.type}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {campaign.platforms &&
                                                campaign.platforms.length >
                                                    0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {campaign.platforms.map(
                                                            (p, i) => (
                                                                <Badge
                                                                    key={i}
                                                                    variant="secondary"
                                                                    className="text-xs"
                                                                >
                                                                    {p.name}
                                                                </Badge>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            {campaign.deadline && (
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                    Deadline{' '}
                                                    {new Date(
                                                        campaign.deadline,
                                                    ).toLocaleDateString(
                                                        'en-US',
                                                        {
                                                            month: 'short',
                                                            day: 'numeric',
                                                        },
                                                    )}
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Past campaigns */}
                {past_campaigns.length > 0 && (
                    <div>
                        <h2 className="mb-3 text-lg font-semibold">
                            Past Campaigns
                        </h2>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {past_campaigns.map((campaign) => (
                                <Card key={campaign.id}>
                                    <CardContent className="pt-4">
                                        <p className="line-clamp-1 text-sm font-medium">
                                            {campaign.title}
                                        </p>
                                        <Badge
                                            variant="secondary"
                                            className="mt-1.5 text-xs capitalize"
                                        >
                                            {TYPE_LABELS[campaign.type] ??
                                                campaign.type}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

BrandProfileShow.layout = {
    breadcrumbs: [{ title: 'Brand Profile', href: '#' }],
};
