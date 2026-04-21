import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    DollarSign,
    ExternalLink,
    Eye,
    FileEdit,
    FileVideo,
    Globe,
    Trophy,
    User,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Campaign, Entry, EntryStatus } from '@/types';

type Props = {
    campaign: Campaign;
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

export default function BrandEntryShow({ campaign, entry }: Props) {
    const { props } = usePage();
    const flash = (props as { flash?: { success?: string; error?: string } })
        .flash;

    const [rejectionReason, setRejectionReason] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [acceptedBid, setAcceptedBid] = useState(
        entry.pitch_details?.proposed_bid ?? '',
    );
    const [processing, setProcessing] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    const basePath = `/campaigns/${campaign.id}/entries/${entry.id}`;

    function approveEntry() {
        if (
            !confirm(
                campaign.type === 'contest'
                    ? 'Select this entry as the winner? All other entries will be marked as not selected.'
                    : 'Approve this entry?',
            )
        ) {
            return;
        }

        setProcessing(true);
        const route =
            campaign.type === 'contest'
                ? `${basePath}/select-winner`
                : campaign.type === 'ripple'
                  ? `${basePath}/approve-ripple`
                  : `${basePath}/approve-pitch`;

        const data =
            campaign.type === 'pitch' ? { accepted_bid: acceptedBid } : {};

        router.post(route, data, {
            onFinish: () => setProcessing(false),
        });
    }

    function confirmLive() {
        if (!confirm('Confirm that this creator has posted their content?')) {
            return;
        }

        setProcessing(true);
        router.post(
            `${basePath}/confirm-live`,
            {},
            {
                onFinish: () => setProcessing(false),
            },
        );
    }

    function rejectEntry() {
        if (!rejectionReason.trim()) {
            return;
        }

        setProcessing(true);
        router.post(
            `${basePath}/reject`,
            { rejection_reason: rejectionReason },
            {
                onFinish: () => {
                    setProcessing(false);
                    setRejectOpen(false);
                },
            },
        );
    }

    function requestEdit() {
        if (!editNotes.trim()) {
            return;
        }

        setProcessing(true);
        router.post(
            `${basePath}/request-edit`,
            { notes: editNotes },
            {
                onFinish: () => {
                    setProcessing(false);
                    setEditOpen(false);
                },
            },
        );
    }

    const isPending = entry.status === 'pending_review';
    const isLive = entry.status === 'live';

    return (
        <>
            <Head
                title={`Entry by ${entry.creator?.user?.name ?? 'Creator'}`}
            />

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
                    <Link href={`/campaigns/${campaign.id}/entries`}>
                        <ArrowLeft className="size-4" />
                        All entries
                    </Link>
                </Button>

                {/* Header */}
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                                <User className="size-5 text-muted-foreground" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold">
                                    {entry.creator?.user?.name ??
                                        entry.creator?.display_name ??
                                        'Creator'}
                                </h1>
                                {entry.creator?.niches &&
                                    entry.creator.niches.length > 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            {entry.creator.niches
                                                .map((n) => n.name)
                                                .join(', ')}
                                        </p>
                                    )}
                            </div>
                        </div>
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
                        </div>
                    </div>

                    {/* Action buttons */}
                    {isPending && (
                        <div className="flex shrink-0 gap-2">
                            {/* Edit request dialog */}
                            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1"
                                    >
                                        <FileEdit className="size-4" />
                                        Request edit
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Request changes
                                        </DialogTitle>
                                        <DialogDescription>
                                            The creator will be asked to revise
                                            and resubmit.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-2">
                                        <Label>Notes for the creator</Label>
                                        <Textarea
                                            value={editNotes}
                                            onChange={(e) =>
                                                setEditNotes(e.target.value)
                                            }
                                            placeholder="Describe what needs to change..."
                                            rows={4}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() => setEditOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={requestEdit}
                                            disabled={
                                                processing || !editNotes.trim()
                                            }
                                        >
                                            {processing
                                                ? 'Sending...'
                                                : 'Send request'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            {/* Reject dialog */}
                            <Dialog
                                open={rejectOpen}
                                onOpenChange={setRejectOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="gap-1"
                                    >
                                        <XCircle className="size-4" />
                                        Reject
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Reject entry</DialogTitle>
                                        <DialogDescription>
                                            Please provide a reason for the
                                            rejection.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-2">
                                        <Label>Reason</Label>
                                        <Textarea
                                            value={rejectionReason}
                                            onChange={(e) =>
                                                setRejectionReason(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Why is this entry being rejected?"
                                            rows={3}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() => setRejectOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={rejectEntry}
                                            disabled={
                                                processing ||
                                                !rejectionReason.trim()
                                            }
                                        >
                                            {processing
                                                ? 'Rejecting...'
                                                : 'Reject'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            {/* Approve button */}
                            <Button
                                size="sm"
                                className="gap-1"
                                onClick={approveEntry}
                                disabled={processing}
                            >
                                {campaign.type === 'contest' ? (
                                    <>
                                        <Trophy className="size-4" />
                                        Select winner
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="size-4" />
                                        Approve
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Pitch: confirm live */}
                    {campaign.type === 'pitch' && isLive && (
                        <Button
                            size="sm"
                            className="gap-1"
                            onClick={confirmLive}
                            disabled={processing}
                        >
                            <CheckCircle2 className="size-4" />
                            {processing
                                ? 'Confirming...'
                                : 'Confirm post & pay'}
                        </Button>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        {/* Video content */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileVideo className="size-4" />
                                    Submitted content
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
                                {entry.video_duration_sec && (
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">
                                            Duration:{' '}
                                        </span>
                                        {entry.video_duration_sec}s
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

                        {/* Pitch details with bid acceptance */}
                        {entry.type === 'pitch' && entry.pitch_details && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <DollarSign className="size-4" />
                                        Bid details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Proposed bid
                                        </span>
                                        <span className="font-semibold text-green-600">
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
                                            <span className="font-semibold">
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
                                                Creator's pitch
                                            </span>
                                            <p className="mt-1 text-sm">
                                                {entry.pitch_details.pitch}
                                            </p>
                                        </div>
                                    )}

                                    {/* Bid negotiation for pending entries */}
                                    {isPending && (
                                        <>
                                            <Separator />
                                            <div className="space-y-2">
                                                <Label>
                                                    Accept at amount ($)
                                                </Label>
                                                <Input
                                                    type="number"
                                                    value={acceptedBid}
                                                    onChange={(e) =>
                                                        setAcceptedBid(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Leave blank to accept proposed bid"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Modify to counter-offer, or
                                                    leave as-is to accept the
                                                    proposed bid.
                                                </p>
                                            </div>
                                        </>
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

                        {/* Edit request history */}
                        {entry.edit_requests &&
                            entry.edit_requests.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            Edit request history
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {entry.edit_requests.map((er) => (
                                            <div
                                                key={er.id}
                                                className="rounded-lg border p-3"
                                            >
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">
                                                        {formatDate(
                                                            er.created_at,
                                                        )}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className="capitalize"
                                                    >
                                                        {er.status}
                                                    </Badge>
                                                </div>
                                                <p className="mt-1 text-sm">
                                                    {er.notes}
                                                </p>
                                                {er.requested_by && (
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        by{' '}
                                                        {er.requested_by.name}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Creator info */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    Creator
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="text-sm font-medium">
                                    {entry.creator?.user?.name ??
                                        entry.creator?.display_name}
                                </div>
                                {entry.creator?.bio && (
                                    <p className="line-clamp-3 text-xs text-muted-foreground">
                                        {entry.creator.bio}
                                    </p>
                                )}
                                {entry.creator?.niches &&
                                    entry.creator.niches.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {entry.creator.niches.map((n) => (
                                                <Badge
                                                    key={n.id}
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    {n.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                            </CardContent>
                        </Card>

                        {/* Timeline */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    Timeline
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
                                            Live
                                        </span>
                                        <span className="font-medium">
                                            {formatDate(entry.live_at)}
                                        </span>
                                    </div>
                                )}
                                {entry.status === 'rejected' && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2 text-red-600">
                                            <XCircle className="size-4" />
                                            Rejected
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
                                                        p.gross_amount,
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
                    </div>
                </div>
            </div>
        </>
    );
}

BrandEntryShow.layout = {
    breadcrumbs: [
        { title: 'Campaigns', href: '/campaigns' },
        { title: 'Entry', href: '#' },
    ],
};
