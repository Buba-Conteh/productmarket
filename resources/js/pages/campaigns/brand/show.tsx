import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    DollarSign,
    Download,
    ExternalLink,
    Hash,
    Link2,
    Megaphone,
    Paperclip,
    TrendingUp,
    Trophy,
    Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { Campaign, CampaignStatus } from '@/types';

function getYoutubeThumbnail(url: string): string | null {
    try {
        const parsed = new URL(url);
        let videoId: string | null = null;

        if (
            parsed.hostname === 'www.youtube.com' ||
            parsed.hostname === 'youtube.com'
        ) {
            if (parsed.pathname === '/watch') {
videoId = parsed.searchParams.get('v');
} else if (parsed.pathname.startsWith('/embed/')) {
videoId = parsed.pathname.split('/embed/')[1].split('/')[0];
} else if (parsed.pathname.startsWith('/shorts/')) {
videoId = parsed.pathname.split('/shorts/')[1].split('/')[0];
}
        } else if (parsed.hostname === 'youtu.be') {
            videoId = parsed.pathname.slice(1).split('/')[0];
        }

        if (videoId) {
return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
    } catch {
        // invalid URL
    }

    return null;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) {
return `${bytes} B`;
}

    if (bytes < 1024 * 1024) {
return `${(bytes / 1024).toFixed(1)} KB`;
}

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Props = {
    campaign: Campaign;
};

const STATUS_STYLES: Record<CampaignStatus, string> = {
    draft: 'bg-muted text-muted-foreground',
    pending_escrow: 'bg-yellow-100 text-yellow-700',
    active: 'bg-green-100 text-green-700',
    closed: 'bg-orange-100 text-orange-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
};

const TYPE_ICONS: Record<string, React.ElementType> = {
    contest: Trophy,
    ripple: TrendingUp,
    pitch: Megaphone,
};

function formatDate(date: string | null): string {
    if (!date) {
        return '—';
    }

    return new Date(date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatCurrency(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
        return '$0';
    }

    return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export default function BrandCampaignShow({ campaign }: Props) {
    const { props } = usePage();
    const flash = (props as { flash?: { success?: string; error?: string } })
        .flash;

    const TypeIcon = TYPE_ICONS[campaign.type] ?? Trophy;

    function publish() {
        if (!confirm('Publish this campaign? It will go live immediately.')) {
            return;
        }

        router.post(`/campaigns/${campaign.id}/publish`);
    }

    function close() {
        if (!confirm('Close this campaign? No new entries will be accepted.')) {
            return;
        }

        router.post(`/campaigns/${campaign.id}/close`);
    }

    function cancel() {
        if (
            !confirm(
                'Cancel this campaign? Any unspent escrow will be returned.',
            )
        ) {
            return;
        }

        router.post(`/campaigns/${campaign.id}/cancel`);
    }

    return (
        <>
            <Head title={campaign.title} />

            <div className="mx-auto max-w-4xl px-4 py-6">
                {/* Flash messages */}
                {flash?.success && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                        <CheckCircle2 className="size-4 shrink-0" />
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        <AlertCircle className="size-4 shrink-0" />
                        {flash.error}
                    </div>
                )}

                {/* Header */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="mb-4 gap-1"
                    >
                        <Link href="/campaigns">
                            <ArrowLeft className="size-4" />
                            All campaigns
                        </Link>
                    </Button>

                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <TypeIcon className="size-5 text-primary" />
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    {campaign.title}
                                </h1>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="capitalize">
                                    {campaign.type}
                                </Badge>
                                <span
                                    className={cn(
                                        'rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                                        STATUS_STYLES[campaign.status],
                                    )}
                                >
                                    {campaign.status.replace('_', ' ')}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex shrink-0 gap-2">
                            {campaign.status === 'draft' && (
                                <>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link
                                            href={`/campaigns/${campaign.id}/edit`}
                                        >
                                            Edit draft
                                        </Link>
                                    </Button>
                                    <Button size="sm" onClick={publish}>
                                        Publish
                                    </Button>
                                </>
                            )}
                            {campaign.status === 'active' && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={close}
                                    >
                                        Close campaign
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={cancel}
                                    >
                                        Cancel
                                    </Button>
                                </>
                            )}
                            {campaign.status !== 'draft' && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link
                                        href={`/campaigns/${campaign.id}/entries`}
                                    >
                                        View entries
                                    </Link>
                                </Button>
                            )}
                            {campaign.type === 'pitch' &&
                                campaign.status === 'active' && (
                                    <Button variant="outline" size="sm" asChild>
                                        <Link
                                            href={`/campaigns/${campaign.id}/applications`}
                                        >
                                            View applications
                                        </Link>
                                    </Button>
                                )}
                        </div>
                    </div>
                </div>

                {/* Thumbnail */}
                {campaign.thumbnail_url && (
                    <div className="mb-6">
                        <img
                            src={campaign.thumbnail_url}
                            alt={campaign.title}
                            className="h-48 w-full rounded-xl object-cover shadow-sm sm:h-64"
                        />
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main content */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Brief */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Brief
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div
                                    className="prose prose-sm dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{
                                        __html: campaign.brief,
                                    }}
                                />
                            </CardContent>
                        </Card>

                        {/* Requirements */}
                        {campaign.requirements &&
                            campaign.requirements.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            Requirements
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {campaign.requirements.map(
                                                (req, i) => (
                                                    <li
                                                        key={i}
                                                        className="flex items-start gap-2 text-sm"
                                                    >
                                                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                                                        {req}
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}

                        {/* Inspiration links */}
                        {campaign.inspiration_links &&
                            campaign.inspiration_links.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            Inspiration
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {campaign.inspiration_links.map(
                                                (l, i) => {
                                                    const thumb =
                                                        getYoutubeThumbnail(l);

                                                    return (
                                                        <a
                                                            key={i}
                                                            href={l}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="group overflow-hidden rounded-lg border transition-colors hover:border-primary/50"
                                                        >
                                                            {thumb ? (
                                                                <img
                                                                    src={thumb}
                                                                    alt=""
                                                                    className="h-24 w-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="flex h-24 w-full items-center justify-center bg-muted/30">
                                                                    <Link2 className="size-8 text-muted-foreground/40" />
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground group-hover:text-foreground">
                                                                <ExternalLink className="size-3 shrink-0" />
                                                                <span className="truncate">
                                                                    {l}
                                                                </span>
                                                            </div>
                                                        </a>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                        {/* Type-specific details */}
                        {campaign.type === 'contest' &&
                            campaign.contest_details && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Trophy className="size-4" />
                                            Contest details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Prize amount
                                            </span>
                                            <span className="font-medium">
                                                {formatCurrency(
                                                    campaign.contest_details
                                                        .prize_amount,
                                                )}
                                            </span>
                                        </div>
                                        {campaign.contest_details
                                            .runner_up_prize && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    Runner-up prize
                                                </span>
                                                <span className="font-medium">
                                                    {formatCurrency(
                                                        campaign.contest_details
                                                            .runner_up_prize,
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                        {campaign.type === 'ripple' &&
                            campaign.ripple_details && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <TrendingUp className="size-4" />
                                            Ripple details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Initial fee
                                            </span>
                                            <span className="font-medium">
                                                {formatCurrency(
                                                    campaign.ripple_details
                                                        .initial_fee,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                RPM rate
                                            </span>
                                            <span className="font-medium">
                                                {formatCurrency(
                                                    campaign.ripple_details
                                                        .rpm_rate,
                                                )}{' '}
                                                / 1K views
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Milestone interval
                                            </span>
                                            <span className="font-medium">
                                                {Number(
                                                    campaign.ripple_details
                                                        .milestone_interval,
                                                ).toLocaleString()}{' '}
                                                views
                                            </span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Total budget
                                            </span>
                                            <span className="font-semibold">
                                                {formatCurrency(
                                                    campaign.ripple_details
                                                        .total_budget,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Budget spent
                                            </span>
                                            <span className="font-medium">
                                                {formatCurrency(
                                                    campaign.ripple_details
                                                        .budget_spent,
                                                )}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                        {campaign.type === 'pitch' &&
                            campaign.pitch_details && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Megaphone className="size-4" />
                                            Pitch details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Product
                                            </span>
                                            <span className="font-medium">
                                                {
                                                    campaign.pitch_details
                                                        .product_name
                                                }
                                            </span>
                                        </div>
                                        {campaign.pitch_details.product_url && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    URL
                                                </span>
                                                <a
                                                    href={
                                                        campaign.pitch_details
                                                            .product_url
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-1 text-primary hover:underline"
                                                >
                                                    Visit
                                                    <ExternalLink className="size-3" />
                                                </a>
                                            </div>
                                        )}
                                        {campaign.pitch_details
                                            .product_description && (
                                            <p className="text-sm text-muted-foreground">
                                                {
                                                    campaign.pitch_details
                                                        .product_description
                                                }
                                            </p>
                                        )}
                                        <Separator />
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">
                                                    Budget cap
                                                </span>
                                                <p className="font-medium">
                                                    {campaign.pitch_details
                                                        .budget_cap
                                                        ? formatCurrency(
                                                              campaign
                                                                  .pitch_details
                                                                  .budget_cap,
                                                          )
                                                        : 'None'}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">
                                                    Min bid
                                                </span>
                                                <p className="font-medium">
                                                    {campaign.pitch_details
                                                        .min_bid
                                                        ? formatCurrency(
                                                              campaign
                                                                  .pitch_details
                                                                  .min_bid,
                                                          )
                                                        : 'None'}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">
                                                    Max bid
                                                </span>
                                                <p className="font-medium">
                                                    {campaign.pitch_details
                                                        .max_bid
                                                        ? formatCurrency(
                                                              campaign
                                                                  .pitch_details
                                                                  .max_bid,
                                                          )
                                                        : 'None'}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Stats */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                        <Users className="size-4" />
                                        Entries
                                    </span>
                                    <span className="font-medium">
                                        {campaign.entries_count ?? 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="size-4" />
                                        Deadline
                                    </span>
                                    <span className="font-medium">
                                        {formatDate(campaign.deadline)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="size-4" />
                                        Published
                                    </span>
                                    <span className="font-medium">
                                        {formatDate(campaign.published_at)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                        <DollarSign className="size-4" />
                                        Platform fee
                                    </span>
                                    <span className="font-medium">
                                        {campaign.platform_fee_pct}%
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Escrow */}
                        {campaign.escrow_transaction && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                        Escrow
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Held
                                        </span>
                                        <span className="font-medium">
                                            {formatCurrency(
                                                campaign.escrow_transaction
                                                    .total_held,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Released
                                        </span>
                                        <span className="font-medium">
                                            {formatCurrency(
                                                campaign.escrow_transaction
                                                    .total_released,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Refunded
                                        </span>
                                        <span className="font-medium">
                                            {formatCurrency(
                                                campaign.escrow_transaction
                                                    .total_refunded,
                                            )}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Platforms */}
                        {campaign.platforms &&
                            campaign.platforms.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">
                                            Platforms
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-1.5">
                                            {campaign.platforms.map((p) => (
                                                <Badge
                                                    key={p.id}
                                                    variant="secondary"
                                                >
                                                    {p.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                        {/* Hashtags */}
                        {campaign.required_hashtags &&
                            campaign.required_hashtags.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">
                                            Hashtags
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-1.5">
                                            {campaign.required_hashtags.map(
                                                (h, i) => (
                                                    <Badge
                                                        key={i}
                                                        variant="outline"
                                                        className="gap-1"
                                                    >
                                                        <Hash className="size-3" />
                                                        {h}
                                                    </Badge>
                                                ),
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                        {/* Content types */}
                        {campaign.content_types &&
                            campaign.content_types.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">
                                            Content types
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-1.5">
                                            {campaign.content_types.map(
                                                (ct) => (
                                                    <Badge
                                                        key={ct.id}
                                                        variant="secondary"
                                                    >
                                                        {ct.name}
                                                    </Badge>
                                                ),
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                        {/* Brand resources */}
                        {campaign.resources && campaign.resources.length > 0 && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                        Brand resources
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Assets provided by the brand for your
                                        content.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-1.5">
                                    {campaign.resources.map((r) => (
                                        <a
                                            key={r.id}
                                            href={r.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download={r.original_name}
                                            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors hover:border-primary/50 hover:bg-muted/30"
                                        >
                                            <div className="flex min-w-0 items-center gap-2">
                                                <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                                                <span className="truncate font-medium">
                                                    {r.original_name}
                                                </span>
                                            </div>
                                            <div className="ml-2 flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                                                <span>
                                                    {formatFileSize(r.size)}
                                                </span>
                                                <Download className="size-3.5" />
                                            </div>
                                        </a>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

BrandCampaignShow.layout = {
    breadcrumbs: [
        { title: 'Campaigns', href: '/campaigns' },
        { title: 'Details', href: '#' },
    ],
};
