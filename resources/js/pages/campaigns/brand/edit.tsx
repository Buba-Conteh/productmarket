import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Download,
    ExternalLink,
    ImageIcon,
    Link2,
    Megaphone,
    Paperclip,
    Save,
    Send,
    TrendingUp,
    Trophy,
    X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type {
    Campaign,
    CampaignFormData,
    CampaignResource,
    ContentType,
    Platform,
} from '@/types';

type Props = {
    campaign: Campaign;
    platforms: Platform[];
    contentTypes: ContentType[];
};

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

export default function EditCampaign({
    campaign,
    platforms,
    contentTypes,
}: Props) {
    const { props } = usePage();
    const flash = (props as { flash?: { success?: string; error?: string } })
        .flash;

    const [form, setForm] = useState<CampaignFormData>({
        type: campaign.type,
        title: campaign.title,
        brief: campaign.brief,
        requirements: campaign.requirements ?? [],
        required_hashtags: campaign.required_hashtags ?? [],
        target_regions: campaign.target_regions ?? [],
        inspiration_links: campaign.inspiration_links ?? [],
        deadline: campaign.deadline ? campaign.deadline.substring(0, 10) : '',
        max_creators: campaign.max_creators?.toString() ?? '',
        platform_ids: campaign.platforms?.map((p) => p.id) ?? [],
        content_type_ids: campaign.content_types?.map((ct) => ct.id) ?? [],
        ai_brief_used: campaign.ai_brief_used,
        prize_amount: campaign.contest_details?.prize_amount?.toString() ?? '',
        runner_up_prize:
            campaign.contest_details?.runner_up_prize?.toString() ?? '',
        initial_fee: campaign.ripple_details?.initial_fee?.toString() ?? '',
        rpm_rate: campaign.ripple_details?.rpm_rate?.toString() ?? '',
        milestone_interval:
            campaign.ripple_details?.milestone_interval?.toString() ?? '100000',
        max_payout_per_creator:
            campaign.ripple_details?.max_payout_per_creator?.toString() ?? '',
        total_budget: campaign.ripple_details?.total_budget?.toString() ?? '',
        product_name: campaign.pitch_details?.product_name ?? '',
        product_description: campaign.pitch_details?.product_description ?? '',
        product_url: campaign.pitch_details?.product_url ?? '',
        budget_cap: campaign.pitch_details?.budget_cap?.toString() ?? '',
        min_bid: campaign.pitch_details?.min_bid?.toString() ?? '',
        max_bid: campaign.pitch_details?.max_bid?.toString() ?? '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [newRequirement, setNewRequirement] = useState('');
    const [newHashtag, setNewHashtag] = useState('');
    const [newLink, setNewLink] = useState('');

    // Thumbnail state
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
        campaign.thumbnail_url ?? null,
    );
    const [removeThumbnail, setRemoveThumbnail] = useState(false);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    // Resources state
    const [existingResources, setExistingResources] = useState<
        CampaignResource[]
    >(campaign.resources ?? []);
    const [removedResourceIds, setRemovedResourceIds] = useState<string[]>([]);
    const [newResourceFiles, setNewResourceFiles] = useState<File[]>([]);
    const resourceInputRef = useRef<HTMLInputElement>(null);

    function update<K extends keyof CampaignFormData>(
        key: K,
        value: CampaignFormData[K],
    ) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function toggleArrayItem(
        key: 'platform_ids' | 'content_type_ids',
        id: string,
    ) {
        const current = form[key] as string[];
        update(
            key,
            current.includes(id)
                ? current.filter((v) => v !== id)
                : [...current, id],
        );
    }

    function addToList(
        key: 'requirements' | 'required_hashtags' | 'inspiration_links',
        value: string,
        setter: (v: string) => void,
    ) {
        const trimmed = value.trim();

        if (!trimmed) {
return;
}

        const current = form[key] as string[];

        if (!current.includes(trimmed)) {
update(key, [...current, trimmed]);
}

        setter('');
    }

    function removeFromList(
        key: 'requirements' | 'required_hashtags' | 'inspiration_links',
        index: number,
    ) {
        const current = [...(form[key] as string[])];
        current.splice(index, 1);
        update(key, current);
    }

    function handleThumbnailChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setThumbnailFile(file);
        setRemoveThumbnail(false);

        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) =>
                setThumbnailPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setThumbnailPreview(campaign.thumbnail_url ?? null);
        }
    }

    function handleRemoveThumbnail() {
        setThumbnailFile(null);
        setThumbnailPreview(null);
        setRemoveThumbnail(true);

        if (thumbnailInputRef.current) {
thumbnailInputRef.current.value = '';
}
    }

    function handleResourceChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);
        setNewResourceFiles((prev) => {
            const combined = [...prev, ...files];

            return combined.slice(0, 10 - existingResources.length);
        });

        if (resourceInputRef.current) {
resourceInputRef.current.value = '';
}
    }

    function removeExistingResource(id: string) {
        setExistingResources((prev) => prev.filter((r) => r.id !== id));
        setRemovedResourceIds((prev) => [...prev, id]);
    }

    function removeNewResource(index: number) {
        setNewResourceFiles((prev) => prev.filter((_, i) => i !== index));
    }

    function save() {
        setSaving(true);

        const data = new FormData();
        data.append('_method', 'PUT');

        const scalarFields: (keyof CampaignFormData)[] = [
            'type',
            'title',
            'brief',
            'deadline',
            'max_creators',
            'ai_brief_used',
            'prize_amount',
            'runner_up_prize',
            'initial_fee',
            'rpm_rate',
            'milestone_interval',
            'max_payout_per_creator',
            'total_budget',
            'product_name',
            'product_description',
            'product_url',
            'budget_cap',
            'min_bid',
            'max_bid',
        ];

        for (const field of scalarFields) {
            const val = form[field];

            if (val !== '' && val !== null && val !== undefined) {
                data.append(field, String(val));
            }
        }

        form.requirements.forEach((v) => data.append('requirements[]', v));
        form.required_hashtags.forEach((v) =>
            data.append('required_hashtags[]', v),
        );
        form.target_regions.forEach((v) => data.append('target_regions[]', v));
        form.inspiration_links.forEach((v) =>
            data.append('inspiration_links[]', v),
        );
        form.platform_ids.forEach((v) => data.append('platform_ids[]', v));
        form.content_type_ids.forEach((v) =>
            data.append('content_type_ids[]', v),
        );

        if (removeThumbnail) {
data.append('remove_thumbnail', '1');
}

        if (thumbnailFile) {
data.append('thumbnail', thumbnailFile);
}

        removedResourceIds.forEach((id) =>
            data.append('remove_resource_ids[]', id),
        );
        newResourceFiles.forEach((f) => data.append('resources[]', f));

        router.post(`/campaigns/${campaign.id}`, data, {
            onError: (serverErrors) => {
                setErrors(serverErrors);
                setSaving(false);
            },
            onFinish: () => setSaving(false),
        });
    }

    function publish() {
        if (!confirm('Publish this campaign? It will go live immediately.')) {
return;
}

        router.post(`/campaigns/${campaign.id}/publish`);
    }

    return (
        <>
            <Head title={`Edit: ${campaign.title}`} />

            <div className="mx-auto max-w-3xl px-4 py-6">
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

                <div className="mb-6 flex items-center justify-between">
                    <Heading
                        title="Edit Campaign"
                        description={`Editing draft: ${campaign.title}`}
                    />
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={save}
                            disabled={saving}
                            className="gap-2"
                        >
                            <Save className="size-4" />
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button size="sm" onClick={publish} className="gap-2">
                            <Send className="size-4" />
                            Publish
                        </Button>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Basic details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Campaign details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={form.title}
                                    onChange={(e) =>
                                        update('title', e.target.value)
                                    }
                                />
                                {errors.title && (
                                    <p className="text-xs text-destructive">
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="deadline">Deadline</Label>
                                    <Input
                                        id="deadline"
                                        type="date"
                                        value={form.deadline}
                                        onChange={(e) =>
                                            update('deadline', e.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="max_creators">
                                        Max creators
                                    </Label>
                                    <Input
                                        id="max_creators"
                                        type="number"
                                        value={form.max_creators}
                                        onChange={(e) =>
                                            update(
                                                'max_creators',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Unlimited"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Thumbnail */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Campaign thumbnail
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-xs text-muted-foreground">
                                Cover image displayed on campaign cards.
                            </p>
                            {thumbnailPreview ? (
                                <div className="relative w-full max-w-sm">
                                    <img
                                        src={thumbnailPreview}
                                        alt="Thumbnail"
                                        className="h-40 w-full rounded-lg border object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveThumbnail}
                                        className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow hover:text-destructive"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() =>
                                        thumbnailInputRef.current?.click()
                                    }
                                    className="flex h-32 w-full max-w-sm flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                                >
                                    <ImageIcon className="size-6" />
                                    Click to upload image
                                    <span className="text-xs">
                                        PNG, JPG, WEBP up to 5 MB
                                    </span>
                                </button>
                            )}
                            {thumbnailPreview === null &&
                                !removeThumbnail &&
                                campaign.thumbnail_url && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            thumbnailInputRef.current?.click()
                                        }
                                        className="text-xs text-primary underline"
                                    >
                                        Replace thumbnail
                                    </button>
                                )}
                            <input
                                ref={thumbnailInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleThumbnailChange}
                            />
                        </CardContent>
                    </Card>

                    {/* Type details */}
                    {form.type === 'contest' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Trophy className="size-4" />
                                    Contest details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Prize amount ($)</Label>
                                    <Input
                                        type="number"
                                        value={form.prize_amount}
                                        onChange={(e) =>
                                            update(
                                                'prize_amount',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Runner-up prize ($)</Label>
                                    <Input
                                        type="number"
                                        value={form.runner_up_prize}
                                        onChange={(e) =>
                                            update(
                                                'runner_up_prize',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {form.type === 'ripple' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <TrendingUp className="size-4" />
                                    Ripple details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Initial fee ($)</Label>
                                    <Input
                                        type="number"
                                        value={form.initial_fee}
                                        onChange={(e) =>
                                            update(
                                                'initial_fee',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>RPM rate ($)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={form.rpm_rate}
                                        onChange={(e) =>
                                            update('rpm_rate', e.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Milestone interval (views)</Label>
                                    <Input
                                        type="number"
                                        value={form.milestone_interval}
                                        onChange={(e) =>
                                            update(
                                                'milestone_interval',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Total budget ($)</Label>
                                    <Input
                                        type="number"
                                        value={form.total_budget}
                                        onChange={(e) =>
                                            update(
                                                'total_budget',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max payout per creator ($)</Label>
                                    <Input
                                        type="number"
                                        value={form.max_payout_per_creator}
                                        onChange={(e) =>
                                            update(
                                                'max_payout_per_creator',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Optional"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {form.type === 'pitch' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Megaphone className="size-4" />
                                    Pitch details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Product name</Label>
                                    <Input
                                        value={form.product_name}
                                        onChange={(e) =>
                                            update(
                                                'product_name',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Product description</Label>
                                    <Textarea
                                        value={form.product_description}
                                        onChange={(e) =>
                                            update(
                                                'product_description',
                                                e.target.value,
                                            )
                                        }
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Product URL</Label>
                                    <Input
                                        value={form.product_url}
                                        onChange={(e) =>
                                            update(
                                                'product_url',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label>Budget cap ($)</Label>
                                        <Input
                                            type="number"
                                            value={form.budget_cap}
                                            onChange={(e) =>
                                                update(
                                                    'budget_cap',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Min bid ($)</Label>
                                        <Input
                                            type="number"
                                            value={form.min_bid}
                                            onChange={(e) =>
                                                update(
                                                    'min_bid',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Max bid ($)</Label>
                                        <Input
                                            type="number"
                                            value={form.max_bid}
                                            onChange={(e) =>
                                                update(
                                                    'max_bid',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Brief */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Brief</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                value={form.brief}
                                onChange={(e) =>
                                    update('brief', e.target.value)
                                }
                                rows={8}
                            />
                            {errors.brief && (
                                <p className="text-xs text-destructive">
                                    {errors.brief}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Requirements */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Requirements
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex gap-2">
                                <Input
                                    value={newRequirement}
                                    onChange={(e) =>
                                        setNewRequirement(e.target.value)
                                    }
                                    placeholder="Add requirement..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addToList(
                                                'requirements',
                                                newRequirement,
                                                setNewRequirement,
                                            );
                                        }
                                    }}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        addToList(
                                            'requirements',
                                            newRequirement,
                                            setNewRequirement,
                                        )
                                    }
                                >
                                    Add
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {form.requirements.map((r, i) => (
                                    <Badge
                                        key={i}
                                        variant="secondary"
                                        className="gap-1"
                                    >
                                        {r}
                                        <button
                                            onClick={() =>
                                                removeFromList(
                                                    'requirements',
                                                    i,
                                                )
                                            }
                                            className="ml-1 text-muted-foreground hover:text-foreground"
                                        >
                                            x
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Hashtags */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Hashtags
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex gap-2">
                                <Input
                                    value={newHashtag}
                                    onChange={(e) =>
                                        setNewHashtag(e.target.value)
                                    }
                                    placeholder="#hashtag"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addToList(
                                                'required_hashtags',
                                                newHashtag,
                                                setNewHashtag,
                                            );
                                        }
                                    }}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        addToList(
                                            'required_hashtags',
                                            newHashtag,
                                            setNewHashtag,
                                        )
                                    }
                                >
                                    Add
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {form.required_hashtags.map((h, i) => (
                                    <Badge
                                        key={i}
                                        variant="secondary"
                                        className="gap-1"
                                    >
                                        {h}
                                        <button
                                            onClick={() =>
                                                removeFromList(
                                                    'required_hashtags',
                                                    i,
                                                )
                                            }
                                            className="ml-1 text-muted-foreground hover:text-foreground"
                                        >
                                            x
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Inspiration links */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Inspiration links
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex gap-2">
                                <Input
                                    value={newLink}
                                    onChange={(e) =>
                                        setNewLink(e.target.value)
                                    }
                                    placeholder="https://..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addToList(
                                                'inspiration_links',
                                                newLink,
                                                setNewLink,
                                            );
                                        }
                                    }}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        addToList(
                                            'inspiration_links',
                                            newLink,
                                            setNewLink,
                                        )
                                    }
                                >
                                    Add
                                </Button>
                            </div>
                            {form.inspiration_links.length > 0 && (
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {form.inspiration_links.map((l, i) => {
                                        const thumb = getYoutubeThumbnail(l);

                                        return (
                                            <div
                                                key={i}
                                                className="overflow-hidden rounded-lg border bg-muted/30"
                                            >
                                                {thumb ? (
                                                    <img
                                                        src={thumb}
                                                        alt=""
                                                        className="h-24 w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-24 w-full items-center justify-center">
                                                        <Link2 className="size-8 text-muted-foreground/40" />
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                                                    <a
                                                        href={l}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                                    >
                                                        <ExternalLink className="size-3 shrink-0" />
                                                        <span className="truncate">
                                                            {l}
                                                        </span>
                                                    </a>
                                                    <button
                                                        onClick={() =>
                                                            removeFromList(
                                                                'inspiration_links',
                                                                i,
                                                            )
                                                        }
                                                        className="shrink-0 text-muted-foreground hover:text-destructive"
                                                    >
                                                        <X className="size-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Brand resources */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Brand resources
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-xs text-muted-foreground">
                                Files creators can download when making their
                                content.
                            </p>

                            {/* Existing resources */}
                            {existingResources.length > 0 && (
                                <div className="space-y-1">
                                    {existingResources.map((r) => (
                                        <div
                                            key={r.id}
                                            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                                        >
                                            <div className="flex min-w-0 items-center gap-2">
                                                <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                                                <span className="truncate font-medium">
                                                    {r.original_name}
                                                </span>
                                                <span className="shrink-0 text-xs text-muted-foreground">
                                                    {formatFileSize(r.size)}
                                                </span>
                                            </div>
                                            <div className="ml-2 flex shrink-0 items-center gap-1">
                                                <a
                                                    href={r.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-muted-foreground hover:text-primary"
                                                >
                                                    <Download className="size-3.5" />
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeExistingResource(
                                                            r.id,
                                                        )
                                                    }
                                                    className="text-muted-foreground hover:text-destructive"
                                                >
                                                    <X className="size-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* New files */}
                            {newResourceFiles.length > 0 && (
                                <div className="space-y-1">
                                    {newResourceFiles.map((file, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between rounded-md border border-dashed px-3 py-2 text-sm"
                                        >
                                            <div className="flex min-w-0 items-center gap-2">
                                                <Paperclip className="size-3.5 shrink-0 text-primary" />
                                                <span className="truncate font-medium">
                                                    {file.name}
                                                </span>
                                                <span className="shrink-0 text-xs text-muted-foreground">
                                                    {formatFileSize(file.size)}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeNewResource(i)
                                                }
                                                className="ml-2 shrink-0 text-muted-foreground hover:text-destructive"
                                            >
                                                <X className="size-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() =>
                                    resourceInputRef.current?.click()
                                }
                                className="flex h-20 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                            >
                                <Paperclip className="size-4" />
                                Attach more files
                            </button>
                            <input
                                ref={resourceInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleResourceChange}
                            />
                        </CardContent>
                    </Card>

                    {/* Platforms */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Platforms
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {platforms.map((p) => (
                                    <label
                                        key={p.id}
                                        className={cn(
                                            'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                                            form.platform_ids.includes(p.id)
                                                ? 'border-primary bg-primary/5'
                                                : 'hover:border-primary/50',
                                        )}
                                    >
                                        <Checkbox
                                            checked={form.platform_ids.includes(
                                                p.id,
                                            )}
                                            onCheckedChange={() =>
                                                toggleArrayItem(
                                                    'platform_ids',
                                                    p.id,
                                                )
                                            }
                                        />
                                        {p.name}
                                    </label>
                                ))}
                            </div>
                            {errors.platform_ids && (
                                <p className="mt-2 text-xs text-destructive">
                                    {errors.platform_ids}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Content types */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Content types
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {contentTypes.map((ct) => (
                                    <label
                                        key={ct.id}
                                        className={cn(
                                            'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                                            form.content_type_ids.includes(
                                                ct.id,
                                            )
                                                ? 'border-primary bg-primary/5'
                                                : 'hover:border-primary/50',
                                        )}
                                    >
                                        <Checkbox
                                            checked={form.content_type_ids.includes(
                                                ct.id,
                                            )}
                                            onCheckedChange={() =>
                                                toggleArrayItem(
                                                    'content_type_ids',
                                                    ct.id,
                                                )
                                            }
                                        />
                                        {ct.name}
                                    </label>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom actions */}
                <div className="mt-8 flex items-center justify-between border-t pt-4">
                    <Button variant="ghost" size="sm" asChild className="gap-2">
                        <a href="/campaigns">
                            <ArrowLeft className="size-4" />
                            Back to campaigns
                        </a>
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={save}
                            disabled={saving}
                            className="gap-2"
                        >
                            <Save className="size-4" />
                            {saving ? 'Saving...' : 'Save draft'}
                        </Button>
                        <Button onClick={publish} className="gap-2">
                            <Send className="size-4" />
                            Publish
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}

EditCampaign.layout = {
    breadcrumbs: [
        { title: 'Campaigns', href: '/campaigns' },
        { title: 'Edit', href: '#' },
    ],
};
