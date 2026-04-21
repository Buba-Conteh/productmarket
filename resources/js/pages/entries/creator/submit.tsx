import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    ClipboardCheck,
    DollarSign,
    FileVideo,
    Globe,
    Send,
} from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type {
    Campaign,
    ContentType,
    Entry,
    EntryFormData,
    Platform,
} from '@/types';

type Props = {
    campaign: Campaign;
    entry: Entry | null;
    platforms: Platform[];
    contentTypes: ContentType[];
};

const STEPS = ['Requirements', 'Video', 'Publishing', 'Review'] as const;

function initialForm(entry: Entry | null): EntryFormData {
    return {
        save_draft: false,
        requirements_acknowledged: entry?.requirements_acknowledged ?? false,
        video_url: entry?.video_url ?? '',
        video_duration_sec: entry?.video_duration_sec?.toString() ?? '',
        caption: entry?.caption ?? '',
        tags: entry?.tags ?? [],
        content_type_id: entry?.content_type_id ?? '',
        platform_ids: entry?.platforms?.map((p) => p.id) ?? [],
        proposed_bid: entry?.pitch_details?.proposed_bid ?? '',
        pitch_text: entry?.pitch_details?.pitch ?? '',
    };
}

function formatCurrency(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
        return '$0';
    }

    return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export default function SubmitEntry({
    campaign,
    entry,
    platforms,
    contentTypes,
}: Props) {
    const { props } = usePage();
    const flash = (props as { flash?: { success?: string; error?: string } })
        .flash;

    const [step, setStep] = useState(0);
    const [form, setForm] = useState<EntryFormData>(initialForm(entry));
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [newTag, setNewTag] = useState('');

    function update<K extends keyof EntryFormData>(
        key: K,
        value: EntryFormData[K],
    ) {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[key];

            return next;
        });
    }

    function togglePlatform(id: string) {
        const current = form.platform_ids;
        update(
            'platform_ids',
            current.includes(id)
                ? current.filter((v) => v !== id)
                : [...current, id],
        );
    }

    function addTag(value: string) {
        const trimmed = value.trim();

        if (!trimmed) {
            return;
        }

        if (!form.tags.includes(trimmed)) {
            update('tags', [...form.tags, trimmed]);
        }

        setNewTag('');
    }

    function removeTag(index: number) {
        const next = [...form.tags];
        next.splice(index, 1);
        update('tags', next);
    }

    function validateStep(): boolean {
        const errs: Record<string, string> = {};

        if (step === 0) {
            if (!form.requirements_acknowledged) {
                errs.requirements_acknowledged =
                    'You must acknowledge all requirements.';
            }
        }

        if (step === 1) {
            if (!form.video_url.trim()) {
                errs.video_url = 'Video is required.';
            }
        }

        if (step === 2) {
            if (form.platform_ids.length === 0) {
                errs.platform_ids = 'Select at least one platform.';
            }

            if (
                campaign.type === 'pitch' &&
                (!form.proposed_bid || Number(form.proposed_bid) <= 0)
            ) {
                errs.proposed_bid = 'Bid amount is required.';
            }
        }

        setErrors(errs);

        return Object.keys(errs).length === 0;
    }

    function next() {
        if (validateStep()) {
            setStep((s) => Math.min(s + 1, STEPS.length - 1));
        }
    }

    function back() {
        setStep((s) => Math.max(s - 1, 0));
    }

    function saveDraft() {
        setSubmitting(true);
        router.post(
            `/discover/${campaign.id}/entry`,
            { ...form, save_draft: true },
            {
                onError: (serverErrors) => {
                    setErrors(serverErrors);
                    setSubmitting(false);
                },
                onFinish: () => setSubmitting(false),
            },
        );
    }

    function submitEntry() {
        if (!validateStep()) {
            return;
        }

        setSubmitting(true);
        router.post(
            `/discover/${campaign.id}/entry`,
            { ...form, save_draft: false },
            {
                onError: (serverErrors) => {
                    setErrors(serverErrors);
                    setSubmitting(false);
                },
                onFinish: () => setSubmitting(false),
            },
        );
    }

    // Filter platforms to those allowed by the campaign
    const allowedPlatforms = campaign.platforms
        ? platforms.filter((p) =>
              campaign.platforms!.some((cp) => cp.id === p.id),
          )
        : platforms;

    // Filter content types to those specified by campaign (or show all)
    const allowedContentTypes = campaign.content_types?.length
        ? contentTypes.filter((ct) =>
              campaign.content_types!.some((cct) => cct.id === ct.id),
          )
        : contentTypes;

    return (
        <>
            <Head title={`Submit Entry — ${campaign.title}`} />

            <div className="mx-auto max-w-3xl px-4 py-6">
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

                <Heading
                    title="Submit Entry"
                    description={`For: ${campaign.title}`}
                />

                {/* Step indicator */}
                <div className="mb-8 flex items-center gap-2">
                    {STEPS.map((label, i) => (
                        <div key={label} className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    if (i < step) {
                                        setStep(i);
                                    }
                                }}
                                className={cn(
                                    'flex size-8 items-center justify-center rounded-full text-xs font-medium transition-colors',
                                    i === step
                                        ? 'bg-primary text-primary-foreground'
                                        : i < step
                                          ? 'bg-primary/20 text-primary'
                                          : 'bg-muted text-muted-foreground',
                                )}
                            >
                                {i + 1}
                            </button>
                            <span
                                className={cn(
                                    'hidden text-sm sm:inline',
                                    i === step
                                        ? 'font-medium'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {label}
                            </span>
                            {i < STEPS.length - 1 && (
                                <div className="mx-1 h-px w-8 bg-border" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step 0 — Brief Acknowledgement */}
                {step === 0 && (
                    <div className="space-y-6">
                        <h3 className="flex items-center gap-2 text-lg font-medium">
                            <ClipboardCheck className="size-5" />
                            Review requirements
                        </h3>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Campaign brief
                                </CardTitle>
                                <CardDescription>
                                    Read the brief carefully before proceeding
                                </CardDescription>
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

                        {campaign.requirements &&
                            campaign.requirements.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            Requirements checklist
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

                        <label className="flex items-center gap-3 rounded-lg border p-4">
                            <Checkbox
                                checked={form.requirements_acknowledged}
                                onCheckedChange={(checked) =>
                                    update(
                                        'requirements_acknowledged',
                                        checked === true,
                                    )
                                }
                            />
                            <span className="text-sm font-medium">
                                I have read and acknowledge all campaign
                                requirements
                            </span>
                        </label>
                        {errors.requirements_acknowledged && (
                            <p className="text-xs text-destructive">
                                {errors.requirements_acknowledged}
                            </p>
                        )}
                    </div>
                )}

                {/* Step 1 — Video Upload */}
                {step === 1 && (
                    <div className="space-y-6">
                        <h3 className="flex items-center gap-2 text-lg font-medium">
                            <FileVideo className="size-5" />
                            Upload your content
                        </h3>

                        <div className="space-y-2">
                            <Label htmlFor="video_url">Video URL</Label>
                            <Input
                                id="video_url"
                                value={form.video_url}
                                onChange={(e) =>
                                    update('video_url', e.target.value)
                                }
                                placeholder="Paste your video URL (R2 presigned URL)"
                            />
                            <p className="text-xs text-muted-foreground">
                                Upload your video and paste the URL here. Direct
                                upload coming soon.
                            </p>
                            {errors.video_url && (
                                <p className="text-xs text-destructive">
                                    {errors.video_url}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="video_duration_sec">
                                Video duration (seconds)
                            </Label>
                            <Input
                                id="video_duration_sec"
                                type="number"
                                value={form.video_duration_sec}
                                onChange={(e) =>
                                    update('video_duration_sec', e.target.value)
                                }
                                placeholder="60"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="caption">Caption</Label>
                            <Textarea
                                id="caption"
                                value={form.caption}
                                onChange={(e) =>
                                    update('caption', e.target.value)
                                }
                                placeholder="Write the caption for your post..."
                                rows={4}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Content type</Label>
                            <div className="flex flex-wrap gap-2">
                                {allowedContentTypes.map((ct) => (
                                    <label
                                        key={ct.id}
                                        className={cn(
                                            'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                                            form.content_type_id === ct.id
                                                ? 'border-primary bg-primary/5'
                                                : 'hover:border-primary/50',
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            className="sr-only"
                                            checked={
                                                form.content_type_id === ct.id
                                            }
                                            onChange={() =>
                                                update('content_type_id', ct.id)
                                            }
                                        />
                                        {ct.name}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Tags</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    placeholder="Add a tag..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTag(newTag);
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addTag(newTag)}
                                >
                                    Add
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {form.tags.map((t, i) => (
                                    <Badge
                                        key={i}
                                        variant="secondary"
                                        className="gap-1"
                                    >
                                        {t}
                                        <button
                                            onClick={() => removeTag(i)}
                                            className="ml-1 text-muted-foreground hover:text-foreground"
                                        >
                                            x
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2 — Publishing Details */}
                {step === 2 && (
                    <div className="space-y-6">
                        <h3 className="flex items-center gap-2 text-lg font-medium">
                            <Globe className="size-5" />
                            Publishing details
                        </h3>

                        <div className="space-y-3">
                            <Label>
                                Platforms{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {allowedPlatforms.map((p) => (
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
                                                togglePlatform(p.id)
                                            }
                                        />
                                        {p.name}
                                    </label>
                                ))}
                            </div>
                            {errors.platform_ids && (
                                <p className="text-xs text-destructive">
                                    {errors.platform_ids}
                                </p>
                            )}
                        </div>

                        {/* Pitch-specific: bid amount */}
                        {campaign.type === 'pitch' && (
                            <div className="space-y-4 rounded-lg border p-4">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <DollarSign className="size-4" />
                                    Your bid
                                </div>
                                {campaign.pitch_details && (
                                    <p className="text-xs text-muted-foreground">
                                        Bid range:{' '}
                                        {campaign.pitch_details.min_bid
                                            ? formatCurrency(
                                                  campaign.pitch_details
                                                      .min_bid,
                                              )
                                            : 'No min'}{' '}
                                        -{' '}
                                        {campaign.pitch_details.max_bid
                                            ? formatCurrency(
                                                  campaign.pitch_details
                                                      .max_bid,
                                              )
                                            : 'No max'}
                                    </p>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="proposed_bid">
                                        Proposed bid ($)
                                    </Label>
                                    <Input
                                        id="proposed_bid"
                                        type="number"
                                        value={form.proposed_bid}
                                        onChange={(e) =>
                                            update(
                                                'proposed_bid',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="100"
                                    />
                                    {errors.proposed_bid && (
                                        <p className="text-xs text-destructive">
                                            {errors.proposed_bid}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pitch_text">
                                        Pitch (optional)
                                    </Label>
                                    <Textarea
                                        id="pitch_text"
                                        value={form.pitch_text}
                                        onChange={(e) =>
                                            update('pitch_text', e.target.value)
                                        }
                                        placeholder="Why are you the right creator for this?"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3 — Review & Submit */}
                {step === 3 && (
                    <div className="space-y-6">
                        <h3 className="flex items-center gap-2 text-lg font-medium">
                            <Send className="size-5" />
                            Review and submit
                        </h3>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    Entry summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Campaign
                                    </span>
                                    <span className="font-medium">
                                        {campaign.title}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Type
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className="capitalize"
                                    >
                                        {campaign.type}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Requirements acknowledged
                                    </span>
                                    <span className="font-medium">
                                        {form.requirements_acknowledged
                                            ? 'Yes'
                                            : 'No'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Video
                                    </span>
                                    <span className="max-w-[200px] truncate font-medium">
                                        {form.video_url || '—'}
                                    </span>
                                </div>
                                {form.caption && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Caption
                                        </span>
                                        <span className="max-w-[200px] truncate font-medium">
                                            {form.caption}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Platforms
                                    </span>
                                    <span className="font-medium">
                                        {form.platform_ids.length} selected
                                    </span>
                                </div>
                                {campaign.type === 'pitch' &&
                                    form.proposed_bid && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Proposed bid
                                            </span>
                                            <span className="font-semibold text-green-600">
                                                {formatCurrency(
                                                    form.proposed_bid,
                                                )}
                                            </span>
                                        </div>
                                    )}
                                {form.tags.length > 0 && (
                                    <div>
                                        <span className="text-muted-foreground">
                                            Tags
                                        </span>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {form.tags.map((t, i) => (
                                                <Badge
                                                    key={i}
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    {t}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Edit request notice */}
                        {entry?.edit_requests &&
                            entry.edit_requests.some(
                                (er) => er.status === 'pending',
                            ) && (
                                <Card className="border-orange-200 bg-orange-50">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base text-orange-700">
                                            Edit requested
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {entry.edit_requests
                                            .filter(
                                                (er) => er.status === 'pending',
                                            )
                                            .map((er) => (
                                                <p
                                                    key={er.id}
                                                    className="text-sm text-orange-700"
                                                >
                                                    {er.notes}
                                                </p>
                                            ))}
                                    </CardContent>
                                </Card>
                            )}
                    </div>
                )}

                {/* Navigation */}
                <div className="mt-8 flex items-center justify-between border-t pt-4">
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={back}
                            disabled={step === 0}
                            className="gap-2"
                        >
                            <ArrowLeft className="size-4" />
                            Back
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={saveDraft}
                            disabled={submitting}
                            size="sm"
                        >
                            Save draft
                        </Button>
                    </div>

                    {step < STEPS.length - 1 ? (
                        <Button onClick={next} className="gap-2">
                            Next
                            <ArrowRight className="size-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={submitEntry}
                            disabled={submitting}
                            className="gap-2"
                        >
                            <Send className="size-4" />
                            {submitting ? 'Submitting...' : 'Submit entry'}
                        </Button>
                    )}
                </div>
            </div>
        </>
    );
}

SubmitEntry.layout = {
    breadcrumbs: [
        { title: 'Discover', href: '/discover' },
        { title: 'Submit Entry', href: '#' },
    ],
};
