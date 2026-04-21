import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Megaphone,
    Save,
    Send,
    TrendingUp,
    Trophy,
} from 'lucide-react';
import { useState } from 'react';
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
    ContentType,
    Platform,
} from '@/types';

type Props = {
    campaign: Campaign;
    platforms: Platform[];
    contentTypes: ContentType[];
};

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

    function save() {
        setSaving(true);
        router.put(`/campaigns/${campaign.id}`, form, {
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
                                    onChange={(e) => setNewLink(e.target.value)}
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
                            <div className="space-y-1">
                                {form.inspiration_links.map((l, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <span className="truncate text-muted-foreground">
                                            {l}
                                        </span>
                                        <button
                                            onClick={() =>
                                                removeFromList(
                                                    'inspiration_links',
                                                    i,
                                                )
                                            }
                                            className="shrink-0 text-xs text-muted-foreground hover:text-destructive"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
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
