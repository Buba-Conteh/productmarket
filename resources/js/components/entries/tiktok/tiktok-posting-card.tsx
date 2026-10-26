import {
    CheckCircle2,
    ExternalLink,
    Loader2,
    RefreshCw,
    XCircle,
} from 'lucide-react';
import { TikTokIcon } from '@/components/entries/tiktok/tiktok-icon';
import { TikTokPostForm } from '@/components/entries/tiktok/tiktok-post-form';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useTikTokPublish } from '@/hooks/use-tiktok-publish';
import type { Entry, TikTokPublishStatus } from '@/types';

type Props = {
    entry: Entry;
    hasPostingScope: boolean;
    initialStatus: TikTokPublishStatus;
    initialPostedUrl: string | null;
};

export function TikTokPostingCard({
    entry,
    hasPostingScope,
    initialStatus,
    initialPostedUrl,
}: Props) {
    const { status, postedUrl, posting, error, post, reset } = useTikTokPublish(
        entry.id,
        initialStatus,
        initialPostedUrl,
    );

    // No posting scope — prompt re-connect
    if (!hasPostingScope) {
        return (
            <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <TikTokIcon />
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
                        It may take a few minutes for your video to finish
                        processing and appear on your TikTok profile. This page
                        will update automatically.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

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
                        onClick={reset}
                        className="gap-1"
                    >
                        <RefreshCw className="size-3" />
                        Try again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-pink-200 bg-pink-50/30">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <TikTokIcon />
                    Post to TikTok
                </CardTitle>
                <CardDescription>
                    Review the details below, then post your video directly to
                    TikTok. Your entry will be marked as live once it is
                    published.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <TikTokPostForm
                    entryId={entry.id}
                    videoUrl={entry.video_full_url ?? null}
                    initialCaption={entry.caption ?? ''}
                    posting={posting}
                    error={error}
                    onSubmit={post}
                />
            </CardContent>
        </Card>
    );
}
