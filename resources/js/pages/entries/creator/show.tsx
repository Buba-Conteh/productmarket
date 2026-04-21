import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    DollarSign,
    ExternalLink,
    Eye,
    FileVideo,
    Globe,
    Trophy,
    XCircle,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Entry, EntryStatus } from '@/types';

type Props = {
    entry: Entry;
};

const STATUS_STYLES: Record<EntryStatus, string> = {
    draft: 'bg-muted text-muted-foreground',
    pending_review: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
    live: 'bg-green-100 text-green-700',
    won: 'bg-purple-100 text-purple-700',
    not_selected: 'bg-gray-100 text-gray-600',
    disqualified: 'bg-red-100 text-red-700',
};

function formatDate(date: string | null): string {
    if (!date) {
        return '-';
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

export default function CreatorEntryShow({ entry }: Props) {
    const { props } = usePage();
    const flash = (props as { flash?: { success?: string; error?: string } })
        .flash;

    const [platformUrls, setPlatformUrls] = useState<Record<string, string>>(
        {},
    );
    const [marking, setMarking] = useState(false);

    const canMarkLive = entry.status === 'approved' || entry.status === 'won';

    function markLive() {
        setMarking(true);
        router.post(
            `/entries/${entry.id}/live`,
            { platform_urls: platformUrls },
            { onFinish: () => setMarking(false) },
        );
    }

    const pendingEdits = entry.edit_requests?.filter(
        (er) => er.status === 'pending',
    );

    return (
        <>
            <Head title={`Entry — ${entry.campaign?.title ?? 'Entry'}`} />

            <div className="mx-auto max-w-4xl px-4 py-6">
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
                    <Link href="/entries">
                        <ArrowLeft className="size-4" />
                        My Entries
                    </Link>
                </Button>

                {/* Header */}
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="space-y-2">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {entry.campaign?.title ?? 'Entry'}
                        </h1>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                                {entry.type}
                            </Badge>
                            <span
                                className={cn(
                                    'rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                                    STATUS_STYLES[entry.status],
                                )}
                            >
                                {entry.status.replace('_', ' ')}
                            </span>
                            {entry.campaign?.brand && (
                                <span className="text-sm text-muted-foreground">
                                    by {entry.campaign.brand.company_name}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 gap-2">
                        {entry.status === 'draft' && (
                            <Button size="sm" asChild>
                                <Link
                                    href={`/discover/${entry.campaign_id}/entry`}
                                >
                                    Continue editing
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Edit request notice */}
                {pendingEdits && pendingEdits.length > 0 && (
                    <Card className="mb-6 border-orange-200 bg-orange-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base text-orange-700">
                                Edit requested by brand
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {pendingEdits.map((er) => (
                                <p
                                    key={er.id}
                                    className="text-sm text-orange-700"
                                >
                                    {er.notes}
                                </p>
                            ))}
                            <Button size="sm" asChild className="mt-2">
                                <Link
                                    href={`/discover/${entry.campaign_id}/entry`}
                                >
                                    Edit and resubmit
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Rejection notice */}
                {entry.status === 'rejected' && entry.rejection_reason && (
                    <Card className="mb-6 border-red-200 bg-red-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base text-red-700">
                                <XCircle className="size-4" />
                                Rejected
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-red-700">
                                {entry.rejection_reason}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Won notice */}
                {entry.status === 'won' && (
                    <Card className="mb-6 border-purple-200 bg-purple-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base text-purple-700">
                                <Trophy className="size-4" />
                                You won!
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-purple-700">
                                Congratulations! Post your content and mark it
                                as live to receive your payout.
                            </p>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        {/* Video/Content */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileVideo className="size-4" />
                                    Content
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {entry.video_url && (
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">
                                            Video:{' '}
                                        </span>
                                        <span className="break-all">
                                            {entry.video_url}
                                        </span>
                                    </div>
                                )}
                                {entry.caption && (
                                    <div>
                                        <span className="text-sm text-muted-foreground">
                                            Caption
                                        </span>
                                        <p className="mt-1 text-sm">
                                            {entry.caption}
                                        </p>
                                    </div>
                                )}
                                {entry.tags && entry.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {entry.tags.map((t, i) => (
                                            <Badge
                                                key={i}
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                {t}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                {entry.content_type && (
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">
                                            Content type:{' '}
                                        </span>
                                        {entry.content_type.name}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Pitch details */}
                        {entry.pitch_details && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <DollarSign className="size-4" />
                                        Pitch details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Proposed bid
                                        </span>
                                        <span className="font-medium">
                                            {formatCurrency(
                                                entry.pitch_details
                                                    .proposed_bid,
                                            )}
                                        </span>
                                    </div>
                                    {entry.pitch_details.accepted_bid && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Accepted bid
                                            </span>
                                            <span className="font-semibold text-green-600">
                                                {formatCurrency(
                                                    entry.pitch_details
                                                        .accepted_bid,
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    {entry.pitch_details.pitch && (
                                        <div>
                                            <span className="text-sm text-muted-foreground">
                                                Your pitch
                                            </span>
                                            <p className="mt-1 text-sm">
                                                {entry.pitch_details.pitch}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Ripple earnings */}
                        {entry.ripple_earnings &&
                            entry.ripple_earnings.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            Ripple earnings
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {entry.ripple_earnings.map(
                                                (earning) => (
                                                    <div
                                                        key={earning.id}
                                                        className="flex items-center justify-between text-sm"
                                                    >
                                                        <span className="text-muted-foreground">
                                                            {earning.type ===
                                                            'initial_fee'
                                                                ? 'Initial fee'
                                                                : `Milestone #${earning.milestone_number}`}
                                                        </span>
                                                        <span className="font-medium">
                                                            {formatCurrency(
                                                                earning.amount,
                                                            )}
                                                        </span>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                        {/* Mark as live form */}
                        {canMarkLive && (
                            <Card className="border-green-200 bg-green-50/50">
                                <CardHeader>
                                    <CardTitle className="text-base">
                                        Post your content
                                    </CardTitle>
                                    <CardDescription>
                                        Once you've posted on the platform(s),
                                        paste the URL(s) below and mark as live
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {entry.platforms?.map((p) => (
                                        <div key={p.id} className="space-y-1">
                                            <Label>{p.name} post URL</Label>
                                            <Input
                                                value={platformUrls[p.id] ?? ''}
                                                onChange={(e) =>
                                                    setPlatformUrls((prev) => ({
                                                        ...prev,
                                                        [p.id]: e.target.value,
                                                    }))
                                                }
                                                placeholder={`https://${p.slug}.com/...`}
                                            />
                                        </div>
                                    ))}
                                    <Button
                                        onClick={markLive}
                                        disabled={marking}
                                        className="gap-2"
                                    >
                                        <Globe className="size-4" />
                                        {marking
                                            ? 'Marking...'
                                            : 'Mark as live'}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="size-4" />
                                        Submitted
                                    </span>
                                    <span className="font-medium">
                                        {formatDate(entry.submitted_at)}
                                    </span>
                                </div>
                                {entry.approved_at && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            <CheckCircle2 className="size-4" />
                                            Approved
                                        </span>
                                        <span className="font-medium">
                                            {formatDate(entry.approved_at)}
                                        </span>
                                    </div>
                                )}
                                {entry.live_at && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            <Globe className="size-4" />
                                            Live since
                                        </span>
                                        <span className="font-medium">
                                            {formatDate(entry.live_at)}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Platforms & views */}
                        {entry.platforms && entry.platforms.length > 0 && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                        Platforms
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {entry.platforms.map((p) => (
                                        <div
                                            key={p.id}
                                            className="flex items-center justify-between text-sm"
                                        >
                                            <span>{p.name}</span>
                                            <div className="flex items-center gap-2">
                                                {p.pivot
                                                    ?.verified_view_count ? (
                                                    <span className="flex items-center gap-1 font-medium">
                                                        <Eye className="size-3" />
                                                        {Number(
                                                            p.pivot
                                                                .verified_view_count,
                                                        ).toLocaleString()}
                                                    </span>
                                                ) : null}
                                                {p.pivot?.posted_url && (
                                                    <a
                                                        href={
                                                            p.pivot.posted_url
                                                        }
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        <ExternalLink className="size-3 text-primary" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Payouts */}
                        {entry.payouts && entry.payouts.length > 0 && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                        Payouts
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {entry.payouts.map((p) => (
                                        <div
                                            key={p.id}
                                            className="flex items-center justify-between text-sm"
                                        >
                                            <span className="text-muted-foreground capitalize">
                                                {p.payout_type.replace(
                                                    /_/g,
                                                    ' ',
                                                )}
                                            </span>
                                            <div className="text-right">
                                                <span className="font-medium">
                                                    {formatCurrency(
                                                        p.net_amount,
                                                    )}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="ml-2 text-xs capitalize"
                                                >
                                                    {p.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Edit request history */}
                        {entry.edit_requests &&
                            entry.edit_requests.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">
                                            Edit requests
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {entry.edit_requests.map((er) => (
                                            <div
                                                key={er.id}
                                                className="text-sm"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDate(
                                                            er.created_at,
                                                        )}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs capitalize"
                                                    >
                                                        {er.status}
                                                    </Badge>
                                                </div>
                                                <p className="mt-1">
                                                    {er.notes}
                                                </p>
                                            </div>
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

CreatorEntryShow.layout = {
    breadcrumbs: [
        { title: 'My Entries', href: '/entries' },
        { title: 'Entry Details', href: '#' },
    ],
};
