import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
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
    Loader2,
    RefreshCw,
    Trophy,
    XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Entry, EntryStatus, TikTokPublishStatus } from '@/types';

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

// ---------------------------------------------------------------------------
// TikTok posting card component
// ---------------------------------------------------------------------------

type TikTokCardProps = {
    entry: Entry;
    hasPostingScope: boolean;
    initialStatus: TikTokPublishStatus;
    initialPostedUrl: string | null;
};

function TikTokPostingCard({
    entry,
    hasPostingScope,
    initialStatus,
    initialPostedUrl,
}: TikTokCardProps) {
    const [status, setStatus] = useState<TikTokPublishStatus>(initialStatus);
    const [postedUrl, setPostedUrl] = useState<string | null>(initialPostedUrl);
    const [caption, setCaption] = useState(entry.caption ?? '');
    const [privacyLevel, setPrivacyLevel] = useState('PUBLIC_TO_EVERYONE');
    const [disableComment, setDisableComment] = useState(false);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopPolling = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    const startPolling = useCallback(() => {
        stopPolling();
        pollRef.current = setInterval(async () => {
            try {
                const res = await axios.get(
                    `/entries/${entry.id}/publish/tiktok/status`,
                );
                const data = res.data as {
                    publish_status: TikTokPublishStatus;
                    posted_url: string | null;
                };
                setStatus(data.publish_status);

                if (data.posted_url) {
                    setPostedUrl(data.posted_url);
                }

                if (
                    data.publish_status === 'published' ||
                    data.publish_status === 'failed'
                ) {
                    stopPolling();
                }
            } catch {
                stopPolling();
            }
        }, 5000);
    }, [entry.id, stopPolling]);

    useEffect(() => {
        if (status === 'pending' || status === 'processing') {
            startPolling();
        }

        return stopPolling;
    }, [status, startPolling, stopPolling]);

    async function postToTikTok() {
        setPosting(true);
        setError(null);

        try {
            const res = await axios.post(
                `/entries/${entry.id}/publish/tiktok`,
                {
                    caption,
                    privacy_level: privacyLevel,
                    disable_comment: disableComment,
                },
            );
            const data = res.data as {
                publish_status: TikTokPublishStatus;
                posted_url: string | null;
            };
            setStatus(data.publish_status);

            if (data.posted_url) {
                setPostedUrl(data.posted_url);
            }

            if (
                data.publish_status === 'pending' ||
                data.publish_status === 'processing'
            ) {
                startPolling();
            }
        } catch (err: unknown) {
            const msg =
                axios.isAxiosError(err) && err.response?.data?.message
                    ? String(err.response.data.message)
                    : 'Something went wrong. Please try again.';
            setError(msg);
        } finally {
            setPosting(false);
        }
    }

    // No scope — prompt re-connect
    if (!hasPostingScope) {
        return (
            <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <svg viewBox="0 0 24 24" className="size-4 fill-current">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.89a8.16 8.16 0 0 0 4.77 1.52V7a4.85 4.85 0 0 1-1-.31z" />
                        </svg>
                        Post to TikTok
                    </CardTitle>
                    <CardDescription>
                        Re-connect your TikTok account to enable direct posting
                        from the platform.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button size="sm" variant="outline" asChild>
                        <a href="/creator/social/tiktok/connect">
                            Re-connect TikTok
                        </a>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Published
    if (status === 'published') {
        return (
            <Card className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base text-green-700">
                        <CheckCircle2 className="size-4" />
                        Posted to TikTok
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {postedUrl ? (
                        <a
                            href={postedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                            <ExternalLink className="size-3" />
                            View on TikTok
                        </a>
                    ) : (
                        <p className="text-sm text-green-700">
                            Your video is live on TikTok.
                        </p>
                    )}
                </CardContent>
            </Card>
        );
    }

    // Pending or processing
    if (status === 'pending' || status === 'processing') {
        return (
            <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base text-blue-700">
                        <Loader2 className="size-4 animate-spin" />
                        {status === 'pending'
                            ? 'Uploading to TikTok…'
                            : 'TikTok is processing your video…'}
                    </CardTitle>
                    <CardDescription>
                        This usually takes under a minute. The page will update
                        automatically.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    // Failed — show retry
    if (status === 'failed') {
        return (
            <Card className="border-red-200 bg-red-50/50">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base text-red-700">
                        <XCircle className="size-4" />
                        TikTok posting failed
                    </CardTitle>
                    <CardDescription className="text-red-600">
                        The upload did not complete. Check your internet
                        connection and try again.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStatus(null)}
                        className="gap-1"
                    >
                        <RefreshCw className="size-3" />
                        Try again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Default — posting form
    return (
        <Card className="border-pink-200 bg-pink-50/30">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <svg viewBox="0 0 24 24" className="size-4 fill-current">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.89a8.16 8.16 0 0 0 4.77 1.52V7a4.85 4.85 0 0 1-1-.31z" />
                    </svg>
                    Post to TikTok
                </CardTitle>
                <CardDescription>
                    Post your video directly to TikTok. Your entry will be
                    marked as live automatically.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        <AlertCircle className="mt-0.5 size-4 shrink-0" />
                        {error}
                    </div>
                )}

                <div className="space-y-1.5">
                    <Label htmlFor="tiktok-caption">Caption</Label>
                    <Textarea
                        id="tiktok-caption"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        maxLength={2200}
                        rows={3}
                        placeholder="Write your TikTok caption…"
                    />
                    <p className="text-xs text-muted-foreground">
                        {caption.length} / 2200
                    </p>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="tiktok-privacy">Privacy</Label>
                    <Select
                        value={privacyLevel}
                        onValueChange={setPrivacyLevel}
                    >
                        <SelectTrigger id="tiktok-privacy">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PUBLIC_TO_EVERYONE">
                                Public
                            </SelectItem>
                            <SelectItem value="MUTUAL_FOLLOW_FRIENDS">
                                Friends
                            </SelectItem>
                            <SelectItem value="FOLLOWER_OF_CREATOR">
                                Followers only
                            </SelectItem>
                            <SelectItem value="SELF_ONLY">
                                Only me (draft)
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox
                        id="tiktok-disable-comment"
                        checked={disableComment}
                        onCheckedChange={(v) =>
                            setDisableComment(v === true)
                        }
                    />
                    <Label htmlFor="tiktok-disable-comment">
                        Disable comments
                    </Label>
                </div>

                <Button
                    onClick={postToTikTok}
                    disabled={posting}
                    className="w-full gap-2"
                >
                    {posting ? (
                        <>
                            <Loader2 className="size-4 animate-spin" />
                            Starting upload…
                        </>
                    ) : (
                        'Post to TikTok'
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function CreatorEntryShow({ entry }: Props) {
    const { props } = usePage();
    const flash = (props as { flash?: { success?: string; error?: string } })
        .flash;

    const [platformUrls, setPlatformUrls] = useState<Record<string, string>>(
        {},
    );
    const [marking, setMarking] = useState(false);

    const canMarkLive = entry.status === 'approved' || entry.status === 'won';

    // TikTok posting helpers
    const tiktokPlatform = entry.platforms?.find((p) => p.slug === 'tiktok');
    const tiktokAccount = entry.creator?.user?.social_accounts?.find(
        (sa) => sa.platform.slug === 'tiktok',
    );
    const hasTikTokPostingScope =
        tiktokAccount?.scopes?.includes('video.publish') ?? false;
    const showTikTokCard =
        canMarkLive && tiktokPlatform !== undefined;
    const nonTiktokPlatforms = entry.platforms?.filter(
        (p) => p.slug !== 'tiktok',
    );

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
                                {entry.video_full_url && (
                                    <video
                                        src={entry.video_full_url}
                                        controls
                                        className="w-full rounded-lg aspect-video bg-black"
                                    />
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

                        {/* TikTok direct posting card */}
                        {showTikTokCard && (
                            <TikTokPostingCard
                                entry={entry}
                                hasPostingScope={hasTikTokPostingScope}
                                initialStatus={
                                    tiktokPlatform!.pivot?.publish_status ??
                                    null
                                }
                                initialPostedUrl={
                                    tiktokPlatform!.pivot?.posted_url ?? null
                                }
                            />
                        )}

                        {/* Mark as live — non-TikTok platforms */}
                        {canMarkLive &&
                            (nonTiktokPlatforms?.length ?? 0) > 0 && (
                                <Card className="border-green-200 bg-green-50/50">
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            Post your content
                                        </CardTitle>
                                        <CardDescription>
                                            Post the video on the required
                                            platform(s), then paste the video
                                            URL(s) below. Your payment will be
                                            released as soon as you submit.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {entry.type === 'pitch' &&
                                            entry.pitch_details
                                                ?.accepted_bid && (
                                                <div className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-100 px-3 py-2 text-sm text-green-800">
                                                    <DollarSign className="size-4 shrink-0" />
                                                    <span>
                                                        Your payout of{' '}
                                                        <strong>
                                                            {formatCurrency(
                                                                entry
                                                                    .pitch_details
                                                                    .accepted_bid,
                                                            )}
                                                        </strong>{' '}
                                                        will be released
                                                        automatically when you
                                                        mark as live.
                                                    </span>
                                                </div>
                                            )}
                                        {nonTiktokPlatforms?.map((p) => (
                                            <div
                                                key={p.id}
                                                className="space-y-1"
                                            >
                                                <Label>
                                                    {p.name} video URL
                                                </Label>
                                                <Input
                                                    value={
                                                        platformUrls[p.id] ?? ''
                                                    }
                                                    onChange={(e) =>
                                                        setPlatformUrls(
                                                            (prev) => ({
                                                                ...prev,
                                                                [p.id]: e.target
                                                                    .value,
                                                            }),
                                                        )
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
                                                ? 'Submitting...'
                                                : 'Mark as live & release payment'}
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
