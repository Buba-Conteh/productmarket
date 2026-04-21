import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    DollarSign,
    ExternalLink,
    FileText,
    ImageIcon,
    Link2,
    Megaphone,
    Paperclip,
    Settings2,
    Trophy,
    TrendingUp,
    X,
} from 'lucide-react';
import { useRef, useState } from 'react';
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
    CampaignFormData,
    CampaignType,
    ContentType,
    Platform,
} from '@/types';

type Props = {
    platforms: Platform[];
    contentTypes: ContentType[];
};

const CAMPAIGN_TYPES: {
    key: CampaignType;
    name: string;
    description: string;
    icon: React.ElementType;
}[] = [
    {
        key: 'contest',
        name: 'Contest',
        description:
            'Creators compete for views — brand picks a winner who posts publicly.',
        icon: Trophy,
    },
    {
        key: 'ripple',
        name: 'Ripple',
        description:
            'Pay creators an upfront fee + milestone payouts as views accumulate.',
        icon: TrendingUp,
    },
    {
        key: 'pitch',
        name: 'Pitch',
        description: 'List your product — creators pitch themselves with a bid.',
        icon: Megaphone,
    },
];

const STEPS = ['Type', 'Details', 'Brief', 'Settings'] as const;

const initialFormData: CampaignFormData = {
    type: 'contest',
    title: '',
    brief: '',
    requirements: [],
    required_hashtags: [],
    target_regions: [],
    inspiration_links: [],
    deadline: '',
    max_creators: '',
    platform_ids: [],
    content_type_ids: [],
    ai_brief_used: false,
    prize_amount: '',
    runner_up_prize: '',
    initial_fee: '',
    rpm_rate: '',
    milestone_interval: '100000',
    max_payout_per_creator: '',
    total_budget: '',
    product_name: '',
    product_description: '',
    product_url: '',
    budget_cap: '',
    min_bid: '',
    max_bid: '',
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

export default function CreateCampaign({ platforms, contentTypes }: Props) {
    const [step, setStep] = useState(0);
    const [form, setForm] = useState<CampaignFormData>(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [newRequirement, setNewRequirement] = useState('');
    const [newHashtag, setNewHashtag] = useState('');
    const [newLink, setNewLink] = useState('');

    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
        null,
    );
    const [resourceFiles, setResourceFiles] = useState<File[]>([]);

    const thumbnailInputRef = useRef<HTMLInputElement>(null);
    const resourceInputRef = useRef<HTMLInputElement>(null);

    function update<K extends keyof CampaignFormData>(
        key: K,
        value: CampaignFormData[K],
    ) {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => {
            const next = { ...prev };
            delete next[key];

            return next;
        });
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

        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) =>
                setThumbnailPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setThumbnailPreview(null);
        }
    }

    function removeThumbnail() {
        setThumbnailFile(null);
        setThumbnailPreview(null);

        if (thumbnailInputRef.current) {
            thumbnailInputRef.current.value = '';
        }
    }

    function handleResourceChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);
        setResourceFiles((prev) => {
            const combined = [...prev, ...files];

            return combined.slice(0, 10);
        });

        if (resourceInputRef.current) {
            resourceInputRef.current.value = '';
        }
    }

    function removeResource(index: number) {
        setResourceFiles((prev) => prev.filter((_, i) => i !== index));
    }

    function validateStep(): boolean {
        const errs: Record<string, string> = {};

        if (step === 1) {
            if (!form.title.trim()) {
errs.title = 'Title is required.';
}

            if (form.type === 'contest') {
                if (!form.prize_amount || Number(form.prize_amount) <= 0) {
errs.prize_amount = 'Prize amount is required.';
}
            }

            if (form.type === 'ripple') {
                if (!form.initial_fee && form.initial_fee !== '0') {
errs.initial_fee = 'Initial fee is required.';
}

                if (!form.rpm_rate || Number(form.rpm_rate) <= 0) {
errs.rpm_rate = 'RPM rate is required.';
}

                if (!form.total_budget || Number(form.total_budget) <= 0) {
errs.total_budget = 'Total budget is required.';
}
            }

            if (form.type === 'pitch') {
                if (!form.product_name.trim()) {
errs.product_name = 'Product name is required.';
}
            }
        }

        if (step === 2) {
            if (!form.brief.trim()) {
errs.brief = 'Brief is required.';
}
        }

        if (step === 3) {
            if (form.platform_ids.length === 0) {
errs.platform_ids = 'Select at least one platform.';
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

    function submit() {
        if (!validateStep()) {
return;
}

        setSubmitting(true);

        const data = new FormData();

        // Scalar fields
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

        // Array fields
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

        // Files
        if (thumbnailFile) {
data.append('thumbnail', thumbnailFile);
}

        resourceFiles.forEach((f) => data.append('resources[]', f));

        router.post('/campaigns', data, {
            onError: (serverErrors) => {
                setErrors(serverErrors);
                setSubmitting(false);
            },
            onFinish: () => setSubmitting(false),
        });
    }

    return (
        <>
            <Head title="Create Campaign" />

            <div className="mx-auto max-w-3xl px-4 py-6">
                <Heading
                    title="Create Campaign"
                    description="Set up your campaign in a few steps"
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

                {/* Step 0 — Campaign Type */}
                {step === 0 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                            Choose campaign type
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {CAMPAIGN_TYPES.map((ct) => (
                                <Card
                                    key={ct.key}
                                    className={cn(
                                        'cursor-pointer transition-colors hover:border-primary/50',
                                        form.type === ct.key &&
                                            'border-primary bg-primary/5',
                                    )}
                                    onClick={() => update('type', ct.key)}
                                >
                                    <CardHeader className="pb-2">
                                        <ct.icon className="mb-1 size-5 text-primary" />
                                        <CardTitle className="text-base">
                                            {ct.name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="text-xs">
                                            {ct.description}
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 1 — Campaign Details */}
                {step === 1 && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium">
                            Campaign details
                        </h3>

                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={form.title}
                                onChange={(e) =>
                                    update('title', e.target.value)
                                }
                                placeholder="Enter campaign title"
                            />
                            {errors.title && (
                                <p className="text-xs text-destructive">
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="deadline">
                                Deadline (optional)
                            </Label>
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
                                Max creators (optional)
                            </Label>
                            <Input
                                id="max_creators"
                                type="number"
                                value={form.max_creators}
                                onChange={(e) =>
                                    update('max_creators', e.target.value)
                                }
                                placeholder="Leave blank for unlimited"
                            />
                        </div>

                        {/* Contest fields */}
                        {form.type === 'contest' && (
                            <div className="space-y-4 rounded-lg border p-4">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Trophy className="size-4" />
                                    Contest details
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="prize_amount">
                                            Prize amount ($)
                                        </Label>
                                        <Input
                                            id="prize_amount"
                                            type="number"
                                            value={form.prize_amount}
                                            onChange={(e) =>
                                                update(
                                                    'prize_amount',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="1000"
                                        />
                                        {errors.prize_amount && (
                                            <p className="text-xs text-destructive">
                                                {errors.prize_amount}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="runner_up_prize">
                                            Runner-up prize ($)
                                        </Label>
                                        <Input
                                            id="runner_up_prize"
                                            type="number"
                                            value={form.runner_up_prize}
                                            onChange={(e) =>
                                                update(
                                                    'runner_up_prize',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Optional"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Ripple fields */}
                        {form.type === 'ripple' && (
                            <div className="space-y-4 rounded-lg border p-4">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <TrendingUp className="size-4" />
                                    Ripple details
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="initial_fee">
                                            Initial fee per creator ($)
                                        </Label>
                                        <Input
                                            id="initial_fee"
                                            type="number"
                                            value={form.initial_fee}
                                            onChange={(e) =>
                                                update(
                                                    'initial_fee',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="50"
                                        />
                                        {errors.initial_fee && (
                                            <p className="text-xs text-destructive">
                                                {errors.initial_fee}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="rpm_rate">
                                            RPM rate ($)
                                        </Label>
                                        <Input
                                            id="rpm_rate"
                                            type="number"
                                            step="0.01"
                                            value={form.rpm_rate}
                                            onChange={(e) =>
                                                update(
                                                    'rpm_rate',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="2.00"
                                        />
                                        {errors.rpm_rate && (
                                            <p className="text-xs text-destructive">
                                                {errors.rpm_rate}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="milestone_interval">
                                            Milestone interval (views)
                                        </Label>
                                        <Input
                                            id="milestone_interval"
                                            type="number"
                                            value={form.milestone_interval}
                                            onChange={(e) =>
                                                update(
                                                    'milestone_interval',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="100000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="total_budget">
                                            Total budget ($)
                                        </Label>
                                        <Input
                                            id="total_budget"
                                            type="number"
                                            value={form.total_budget}
                                            onChange={(e) =>
                                                update(
                                                    'total_budget',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="5000"
                                        />
                                        {errors.total_budget && (
                                            <p className="text-xs text-destructive">
                                                {errors.total_budget}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="max_payout_per_creator">
                                            Max payout per creator ($)
                                        </Label>
                                        <Input
                                            id="max_payout_per_creator"
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
                                </div>
                            </div>
                        )}

                        {/* Pitch fields */}
                        {form.type === 'pitch' && (
                            <div className="space-y-4 rounded-lg border p-4">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Megaphone className="size-4" />
                                    Pitch details
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="product_name">
                                            Product name
                                        </Label>
                                        <Input
                                            id="product_name"
                                            value={form.product_name}
                                            onChange={(e) =>
                                                update(
                                                    'product_name',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Your product name"
                                        />
                                        {errors.product_name && (
                                            <p className="text-xs text-destructive">
                                                {errors.product_name}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="product_description">
                                            Product description
                                        </Label>
                                        <Textarea
                                            id="product_description"
                                            value={form.product_description}
                                            onChange={(e) =>
                                                update(
                                                    'product_description',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Describe your product..."
                                            rows={3}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="product_url">
                                            Product URL
                                        </Label>
                                        <Input
                                            id="product_url"
                                            value={form.product_url}
                                            onChange={(e) =>
                                                update(
                                                    'product_url',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="budget_cap">
                                                Budget cap ($)
                                            </Label>
                                            <Input
                                                id="budget_cap"
                                                type="number"
                                                value={form.budget_cap}
                                                onChange={(e) =>
                                                    update(
                                                        'budget_cap',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Optional"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="min_bid">
                                                Min bid ($)
                                            </Label>
                                            <Input
                                                id="min_bid"
                                                type="number"
                                                value={form.min_bid}
                                                onChange={(e) =>
                                                    update(
                                                        'min_bid',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Optional"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="max_bid">
                                                Max bid ($)
                                            </Label>
                                            <Input
                                                id="max_bid"
                                                type="number"
                                                value={form.max_bid}
                                                onChange={(e) =>
                                                    update(
                                                        'max_bid',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Optional"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2 — Brief */}
                {step === 2 && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium">Campaign brief</h3>

                        {/* Thumbnail */}
                        <div className="space-y-2">
                            <Label>Campaign thumbnail</Label>
                            <p className="text-xs text-muted-foreground">
                                Used as the cover image on campaign cards.
                            </p>
                            {thumbnailPreview ? (
                                <div className="relative w-full max-w-sm">
                                    <img
                                        src={thumbnailPreview}
                                        alt="Thumbnail preview"
                                        className="h-40 w-full rounded-lg border object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeThumbnail}
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
                            <input
                                ref={thumbnailInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleThumbnailChange}
                            />
                        </div>

                        {/* Brief */}
                        <div className="space-y-2">
                            <Label htmlFor="brief">Brief</Label>
                            <Textarea
                                id="brief"
                                value={form.brief}
                                onChange={(e) =>
                                    update('brief', e.target.value)
                                }
                                placeholder="Describe what you want creators to produce..."
                                rows={8}
                            />
                            {errors.brief && (
                                <p className="text-xs text-destructive">
                                    {errors.brief}
                                </p>
                            )}
                        </div>

                        {/* Requirements */}
                        <div className="space-y-2">
                            <Label>Requirements</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={newRequirement}
                                    onChange={(e) =>
                                        setNewRequirement(e.target.value)
                                    }
                                    placeholder="Add a requirement..."
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
                                    type="button"
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
                        </div>

                        {/* Hashtags */}
                        <div className="space-y-2">
                            <Label>Required hashtags</Label>
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
                                    type="button"
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
                        </div>

                        {/* Inspiration links */}
                        <div className="space-y-2">
                            <Label>Inspiration links</Label>
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
                                    type="button"
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
                                                className="group relative overflow-hidden rounded-lg border bg-muted/30"
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
                        </div>

                        {/* Resources */}
                        <div className="space-y-2">
                            <Label>Brand resources</Label>
                            <p className="text-xs text-muted-foreground">
                                Upload assets creators can use — brand
                                guidelines, logos, product shots, scripts.
                                Up to 10 files, 20 MB each.
                            </p>
                            <button
                                type="button"
                                onClick={() =>
                                    resourceInputRef.current?.click()
                                }
                                className="flex h-20 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                            >
                                <Paperclip className="size-4" />
                                Click to attach files
                            </button>
                            <input
                                ref={resourceInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleResourceChange}
                            />
                            {resourceFiles.length > 0 && (
                                <div className="space-y-1">
                                    {resourceFiles.map((file, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                                        >
                                            <div className="flex min-w-0 items-center gap-2">
                                                <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
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
                                                    removeResource(i)
                                                }
                                                className="ml-2 shrink-0 text-muted-foreground hover:text-destructive"
                                            >
                                                <X className="size-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 3 — Settings */}
                {step === 3 && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium">
                            Campaign settings
                        </h3>

                        {/* Platforms */}
                        <div className="space-y-3">
                            <Label>
                                Platforms{' '}
                                <span className="text-destructive">*</span>
                            </Label>
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
                                <p className="text-xs text-destructive">
                                    {errors.platform_ids}
                                </p>
                            )}
                        </div>

                        {/* Content types */}
                        <div className="space-y-3">
                            <Label>Content types (optional)</Label>
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
                        </div>

                        {/* Summary */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileText className="size-4" />
                                    Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                {thumbnailPreview && (
                                    <img
                                        src={thumbnailPreview}
                                        alt="Thumbnail"
                                        className="mb-3 h-24 w-full rounded-md object-cover"
                                    />
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Type
                                    </span>
                                    <Badge variant="outline">{form.type}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Title
                                    </span>
                                    <span className="font-medium">
                                        {form.title || '—'}
                                    </span>
                                </div>
                                {form.type === 'contest' && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Prize
                                        </span>
                                        <span className="flex items-center gap-1 font-medium">
                                            <DollarSign className="size-3" />
                                            {form.prize_amount || '0'}
                                        </span>
                                    </div>
                                )}
                                {form.type === 'ripple' && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Budget
                                        </span>
                                        <span className="flex items-center gap-1 font-medium">
                                            <DollarSign className="size-3" />
                                            {form.total_budget || '0'}
                                        </span>
                                    </div>
                                )}
                                {form.type === 'pitch' && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Product
                                        </span>
                                        <span className="font-medium">
                                            {form.product_name || '—'}
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
                                {resourceFiles.length > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Resources
                                        </span>
                                        <span className="font-medium">
                                            {resourceFiles.length} file
                                            {resourceFiles.length !== 1
                                                ? 's'
                                                : ''}
                                        </span>
                                    </div>
                                )}
                                {form.deadline && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Deadline
                                        </span>
                                        <span className="font-medium">
                                            {form.deadline}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Navigation */}
                <div className="mt-8 flex items-center justify-between border-t pt-4">
                    <Button
                        variant="outline"
                        onClick={back}
                        disabled={step === 0}
                        className="gap-2"
                    >
                        <ArrowLeft className="size-4" />
                        Back
                    </Button>
                    {step < STEPS.length - 1 ? (
                        <Button onClick={next} className="gap-2">
                            Next
                            <ArrowRight className="size-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={submit}
                            disabled={submitting}
                            className="gap-2"
                        >
                            <Settings2 className="size-4" />
                            {submitting ? 'Saving...' : 'Save as draft'}
                        </Button>
                    )}
                </div>
            </div>
        </>
    );
}

CreateCampaign.layout = {
    breadcrumbs: [
        { title: 'Campaigns', href: '/campaigns' },
        { title: 'Create', href: '/campaigns/create' },
    ],
};
