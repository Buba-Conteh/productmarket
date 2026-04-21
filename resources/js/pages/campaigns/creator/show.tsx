import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle2,
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
import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import type { Campaign } from '@/types';

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
    hasApplied: boolean;
    applicationStatus: string | null;
    hasEntry: boolean;
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

export default function CreatorCampaignShow({
    campaign,
    hasApplied,
    applicationStatus,
    hasEntry,
}: Props) {
    const { props } = usePage();
    const flash = (props as { flash?: { success?: string; error?: string } })
        .flash;
    const TypeIcon = TYPE_ICONS[campaign.type] ?? Trophy;

    const [pitchText, setPitchText] = useState('');
    const [applying, setApplying] = useState(false);
    const [showPitchForm, setShowPitchForm] = useState(false);

    function submitApplication() {
        setApplying(true);
        router.post(
            `/discover/${campaign.id}/apply`,
            { pitch: pitchText },
            {
                onFinish: () => setApplying(false),
            },
        );
    }

    const canApply = campaign.type === 'pitch' && !hasApplied && !hasEntry;
    const canEnter =
        (campaign.type !== 'pitch' && !hasEntry) ||
        (campaign.type === 'pitch' &&
            applicationStatus === 'approved' &&
            !hasEntry);

    return (
        <>
            <Head title={campaign.title} />

            <div className="mx-auto max-w-4xl px-4 py-6">
                {/* Flash */}
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

                <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="mb-4 gap-1"
                >
                    <Link href="/discover">
                        <ArrowLeft className="size-4" />
                        Browse campaigns
                    </Link>
                </Button>

                {/* Header */}
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <TypeIcon className="size-5 text-primary" />
                            <h1 className="text-2xl font-semibold tracking-tight">
                                {campaign.title}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="capitalize">
                                {campaign.type}
                            </Badge>
                            {campaign.brand && (
                                <span>by {campaign.brand.company_name}</span>
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
                                    Campaign brief
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

                        {/* Type-specific info */}
                        {campaign.type === 'contest' &&
                            campaign.contest_details && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Trophy className="size-4" />
                                            Prize details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Winner prize
                                            </span>
                                            <span className="text-lg font-semibold text-green-600">
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
                                                    Runner-up
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
                                            Earnings breakdown
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Upfront fee
                                            </span>
                                            <span className="font-semibold text-green-600">
                                                {formatCurrency(
                                                    campaign.ripple_details
                                                        .initial_fee,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Earn per 1K views
                                            </span>
                                            <span className="font-medium">
                                                {formatCurrency(
                                                    campaign.ripple_details
                                                        .rpm_rate,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Milestone every
                                            </span>
                                            <span className="font-medium">
                                                {Number(
                                                    campaign.ripple_details
                                                        .milestone_interval,
                                                ).toLocaleString()}{' '}
                                                views
                                            </span>
                                        </div>
                                        {campaign.ripple_details
                                            .max_payout_per_creator && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    Max payout
                                                </span>
                                                <span className="font-medium">
                                                    {formatCurrency(
                                                        campaign.ripple_details
                                                            .max_payout_per_creator,
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                        {campaign.type === 'pitch' &&
                            campaign.pitch_details && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Megaphone className="size-4" />
                                            Product details
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
                                                    Website
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
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">
                                                    Bid range
                                                </span>
                                                <p className="font-medium">
                                                    {campaign.pitch_details
                                                        .min_bid
                                                        ? formatCurrency(
                                                              campaign
                                                                  .pitch_details
                                                                  .min_bid,
                                                          )
                                                        : 'No min'}{' '}
                                                    -{' '}
                                                    {campaign.pitch_details
                                                        .max_bid
                                                        ? formatCurrency(
                                                              campaign
                                                                  .pitch_details
                                                                  .max_bid,
                                                          )
                                                        : 'No max'}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* CTA */}
                        <Card>
                            <CardContent className="space-y-4 pt-6">
                                {hasEntry && (
                                    <div className="rounded-lg bg-green-50 p-3 text-center text-sm text-green-700">
                                        You already submitted an entry for this
                                        campaign.
                                    </div>
                                )}

                                {canEnter && (
                                    <Button
                                        className="w-full"
                                        size="lg"
                                        asChild
                                    >
                                        <Link
                                            href={`/discover/${campaign.id}/entry`}
                                        >
                                            Submit entry
                                        </Link>
                                    </Button>
                                )}

                                {canApply && !showPitchForm && (
                                    <Button
                                        className="w-full"
                                        size="lg"
                                        onClick={() => setShowPitchForm(true)}
                                    >
                                        Apply to this campaign
                                    </Button>
                                )}

                                {canApply && showPitchForm && (
                                    <div className="space-y-3">
                                        <Textarea
                                            value={pitchText}
                                            onChange={(e) =>
                                                setPitchText(e.target.value)
                                            }
                                            placeholder="Why are you a great fit for this campaign? (optional)"
                                            rows={4}
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                className="flex-1"
                                                onClick={submitApplication}
                                                disabled={applying}
                                            >
                                                {applying
                                                    ? 'Submitting...'
                                                    : 'Submit application'}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    setShowPitchForm(false)
                                                }
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {hasApplied && (
                                    <div className="rounded-lg bg-muted p-3 text-center text-sm">
                                        Application status:{' '}
                                        <span className="font-medium capitalize">
                                            {applicationStatus}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick stats */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    Details
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
                                {campaign.max_creators && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            <Users className="size-4" />
                                            Max creators
                                        </span>
                                        <span className="font-medium">
                                            {campaign.max_creators}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

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
                                            Required hashtags
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

                        {/* Inspiration */}
                        {campaign.inspiration_links &&
                            campaign.inspiration_links.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-3">
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

                        {/* Brand resources */}
                        {campaign.resources && campaign.resources.length > 0 && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                        Brand resources
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Assets provided by the brand — use
                                        these in your content.
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

CreatorCampaignShow.layout = {
    breadcrumbs: [
        { title: 'Discover', href: '/discover' },
        { title: 'Campaign', href: '#' },
    ],
};
