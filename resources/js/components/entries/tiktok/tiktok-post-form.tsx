import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { TikTokCommercialDisclosure } from '@/components/entries/tiktok/tiktok-commercial-disclosure';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTikTokCreatorInfo } from '@/hooks/use-tiktok-creator-info';
import type {
    TikTokCreatorInfo,
    TikTokPostPayload,
    TikTokPrivacyLevel,
} from '@/types';

const PRIVACY_LABELS: Record<TikTokPrivacyLevel, string> = {
    PUBLIC_TO_EVERYONE: 'Everyone',
    MUTUAL_FOLLOW_FRIENDS: 'Friends',
    FOLLOWER_OF_CREATOR: 'Followers',
    SELF_ONLY: 'Only me',
};

const MUSIC_USAGE_URL =
    'https://www.tiktok.com/legal/page/global/music-usage-confirmation/en';
const BRANDED_CONTENT_URL =
    'https://www.tiktok.com/legal/page/global/bc-policy/en';

type Props = {
    entryId: string;
    videoUrl: string | null;
    initialCaption: string;
    posting: boolean;
    error: string | null;
    onSubmit: (payload: TikTokPostPayload) => void;
};

function PolicyLink({ href, children }: { href: string; children: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary hover:underline"
        >
            {children}
        </a>
    );
}

function isTooLong(info: TikTokCreatorInfo): boolean {
    return (
        info.max_video_post_duration_sec > 0 &&
        info.video_duration_sec !== null &&
        info.video_duration_sec > info.max_video_post_duration_sec
    );
}

export function TikTokPostForm({
    entryId,
    videoUrl,
    initialCaption,
    posting,
    error,
    onSubmit,
}: Props) {
    const {
        info,
        loading,
        error: infoError,
        reload,
    } = useTikTokCreatorInfo(entryId);

    const [caption, setCaption] = useState(initialCaption);
    // No default: TikTok requires the creator to choose visibility themselves.
    const [privacy, setPrivacy] = useState<TikTokPrivacyLevel | ''>('');
    // Interactions are opt-in.
    const [allowComment, setAllowComment] = useState(false);
    const [allowDuet, setAllowDuet] = useState(false);
    const [allowStitch, setAllowStitch] = useState(false);
    const [disclose, setDisclose] = useState(false);
    const [yourBrand, setYourBrand] = useState(false);
    const [brandedContent, setBrandedContent] = useState(false);

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading your TikTok settings…
            </div>
        );
    }

    if (infoError || !info) {
        return (
            <div className="space-y-3">
                <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription>
                        {infoError ??
                            'Could not load your TikTok posting settings.'}
                    </AlertDescription>
                </Alert>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={reload}
                    className="gap-1"
                >
                    <RefreshCw className="size-3" />
                    Try again
                </Button>
            </div>
        );
    }

    const tooLong = isTooLong(info);
    const disclosureIncomplete = disclose && !yourBrand && !brandedContent;
    const brandedBlocksPrivate = disclose && brandedContent;
    const canPost =
        !posting && !tooLong && privacy !== '' && !disclosureIncomplete;

    function handleDisclose(enabled: boolean) {
        setDisclose(enabled);

        if (!enabled) {
            setYourBrand(false);
            setBrandedContent(false);
        }
    }

    function handleBrandedContent(checked: boolean) {
        setBrandedContent(checked);

        // Branded content cannot be private, so drop an incompatible choice.
        if (checked && privacy === 'SELF_ONLY') {
            setPrivacy('');
        }
    }

    function submit() {
        if (privacy === '' || !canPost) {
            return;
        }

        onSubmit({
            caption,
            privacy_level: privacy,
            disable_comment: !allowComment,
            disable_duet: !allowDuet,
            disable_stitch: !allowStitch,
            brand_content_toggle: disclose && brandedContent,
            brand_organic_toggle: disclose && yourBrand,
            music_consent: true,
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Avatar className="size-9">
                    {info.avatar_url && <AvatarImage src={info.avatar_url} />}
                    <AvatarFallback>
                        {(info.nickname || info.username)
                            .slice(0, 1)
                            .toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                    <p className="text-xs text-muted-foreground">Posting to</p>
                    <p className="font-medium">
                        {info.nickname || info.username}
                        {info.username && (
                            <span className="ml-1 font-normal text-muted-foreground">
                                @{info.username}
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {videoUrl && (
                <video
                    src={videoUrl}
                    controls
                    className="max-h-72 w-full rounded-lg bg-black"
                />
            )}

            {tooLong && (
                <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription>
                        This video is longer than the{' '}
                        {info.max_video_post_duration_sec} seconds your TikTok
                        account can post. Upload a shorter video to continue.
                    </AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-1.5">
                <Label htmlFor="tiktok-caption">Title</Label>
                <Textarea
                    id="tiktok-caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    maxLength={2200}
                    rows={3}
                    placeholder="Add a title, hashtags or mentions…"
                />
                <p className="text-xs text-muted-foreground">
                    {caption.length} / 2200
                </p>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="tiktok-privacy">Who can view this video</Label>
                <Select
                    value={privacy}
                    onValueChange={(v) => setPrivacy(v as TikTokPrivacyLevel)}
                >
                    <SelectTrigger id="tiktok-privacy">
                        <SelectValue placeholder="Select who can view this video" />
                    </SelectTrigger>
                    <SelectContent>
                        {info.privacy_level_options.map((level) => (
                            <SelectItem
                                key={level}
                                value={level}
                                disabled={
                                    level === 'SELF_ONLY' &&
                                    brandedBlocksPrivate
                                }
                            >
                                {PRIVACY_LABELS[level] ?? level}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {brandedBlocksPrivate && (
                    <p className="text-xs text-muted-foreground">
                        Branded content visibility cannot be set to private.
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label>Allow users to</Label>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {[
                        {
                            id: 'comment',
                            label: 'Comment',
                            checked: allowComment,
                            set: setAllowComment,
                            disabled: info.comment_disabled,
                        },
                        {
                            id: 'duet',
                            label: 'Duet',
                            checked: allowDuet,
                            set: setAllowDuet,
                            disabled: info.duet_disabled,
                        },
                        {
                            id: 'stitch',
                            label: 'Stitch',
                            checked: allowStitch,
                            set: setAllowStitch,
                            disabled: info.stitch_disabled,
                        },
                    ].map((option) => (
                        <div
                            key={option.id}
                            className="flex items-center gap-2"
                        >
                            <Checkbox
                                id={`tiktok-allow-${option.id}`}
                                checked={option.checked && !option.disabled}
                                disabled={option.disabled}
                                onCheckedChange={(v) => option.set(v === true)}
                            />
                            <Label
                                htmlFor={`tiktok-allow-${option.id}`}
                                className={
                                    option.disabled
                                        ? 'text-muted-foreground'
                                        : undefined
                                }
                            >
                                {option.label}
                            </Label>
                        </div>
                    ))}
                </div>
                {(info.comment_disabled ||
                    info.duet_disabled ||
                    info.stitch_disabled) && (
                    <p className="text-xs text-muted-foreground">
                        Greyed-out options are turned off in your TikTok
                        settings.
                    </p>
                )}
            </div>

            <TikTokCommercialDisclosure
                enabled={disclose}
                yourBrand={yourBrand}
                brandedContent={brandedContent}
                onEnabledChange={handleDisclose}
                onYourBrandChange={setYourBrand}
                onBrandedContentChange={handleBrandedContent}
            />

            <p className="text-xs text-muted-foreground">
                By posting, you agree to TikTok's{' '}
                {brandedContent && disclose && (
                    <>
                        <PolicyLink href={BRANDED_CONTENT_URL}>
                            Branded Content Policy
                        </PolicyLink>{' '}
                        and{' '}
                    </>
                )}
                <PolicyLink href={MUSIC_USAGE_URL}>
                    Music Usage Confirmation
                </PolicyLink>
                .
            </p>

            <Button
                onClick={submit}
                disabled={!canPost}
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
        </div>
    );
}
