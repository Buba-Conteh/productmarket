import { Head, useForm } from '@inertiajs/react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
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
import { Separator } from '@/components/ui/separator';
import AdminLayout from '@/layouts/admin-layout';

interface PlatformSettings {
    id: number;
    platform_fee_pct: string;
    contest_split_first: string;
    contest_split_second: string;
    contest_split_third: string;
    contest_split_pool: string;
    min_creator_payout: string;
    referral_creator_bonus: string;
    referral_brand_credit: string;
    updated_at: string;
}

export default function AdminSettings({
    settings,
}: {
    settings: PlatformSettings;
}) {
    const { data, setData, put, processing, errors } = useForm({
        platform_fee_pct: settings.platform_fee_pct,
        contest_split_first: settings.contest_split_first,
        contest_split_second: settings.contest_split_second,
        contest_split_third: settings.contest_split_third,
        contest_split_pool: settings.contest_split_pool,
        min_creator_payout: settings.min_creator_payout,
        referral_creator_bonus: settings.referral_creator_bonus,
        referral_brand_credit: settings.referral_brand_credit,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(route('admin.settings.update'), { preserveScroll: true });
    }

    const splitTotal =
        parseFloat(data.contest_split_first || '0') +
        parseFloat(data.contest_split_second || '0') +
        parseFloat(data.contest_split_third || '0') +
        parseFloat(data.contest_split_pool || '0');

    return (
        <>
            <Head title="Platform Settings — Admin" />

            <div className="space-y-6 p-6">
                <Heading
                    title="Platform Settings"
                    description="Configure fees, payout splits, and reward amounts"
                />

                <form onSubmit={submit} className="space-y-6">
                    {/* Platform Fee */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Platform Fee</CardTitle>
                            <CardDescription>
                                Percentage deducted from every creator payout.
                                Snapshotted at campaign creation — changes only
                                affect future campaigns.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="max-w-xs">
                                <Label htmlFor="platform_fee_pct">
                                    Fee percentage (%)
                                </Label>
                                <div className="relative mt-2">
                                    <Input
                                        id="platform_fee_pct"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={data.platform_fee_pct}
                                        onChange={(e) =>
                                            setData(
                                                'platform_fee_pct',
                                                e.target.value,
                                            )
                                        }
                                        className="pr-8"
                                    />
                                    <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                                        %
                                    </span>
                                </div>
                                <InputError
                                    message={errors.platform_fee_pct}
                                    className="mt-1"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contest Split */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Contest Payout Split</CardTitle>
                            <CardDescription>
                                How prize pools are distributed across top
                                performers. Must not exceed 100% combined.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <PercentField
                                    id="contest_split_first"
                                    label="1st place (%)"
                                    value={data.contest_split_first}
                                    onChange={(v) =>
                                        setData('contest_split_first', v)
                                    }
                                    error={errors.contest_split_first}
                                />
                                <PercentField
                                    id="contest_split_second"
                                    label="2nd place (%)"
                                    value={data.contest_split_second}
                                    onChange={(v) =>
                                        setData('contest_split_second', v)
                                    }
                                    error={errors.contest_split_second}
                                />
                                <PercentField
                                    id="contest_split_third"
                                    label="3rd place (%)"
                                    value={data.contest_split_third}
                                    onChange={(v) =>
                                        setData('contest_split_third', v)
                                    }
                                    error={errors.contest_split_third}
                                />
                                <PercentField
                                    id="contest_split_pool"
                                    label="Shared pool (%)"
                                    value={data.contest_split_pool}
                                    onChange={(v) =>
                                        setData('contest_split_pool', v)
                                    }
                                    error={errors.contest_split_pool}
                                />
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">
                                    Total:
                                </span>
                                <span
                                    className={
                                        splitTotal > 100
                                            ? 'font-semibold text-destructive'
                                            : splitTotal === 100
                                              ? 'font-semibold text-green-600 dark:text-green-400'
                                              : 'font-semibold text-muted-foreground'
                                    }
                                >
                                    {splitTotal.toFixed(2)}%
                                </span>
                                {splitTotal > 100 && (
                                    <span className="text-destructive">
                                        — exceeds 100%
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payouts */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Creator Payouts</CardTitle>
                            <CardDescription>
                                Minimum balance a creator must accumulate before
                                a transfer is triggered.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="max-w-xs">
                                <Label htmlFor="min_creator_payout">
                                    Minimum payout threshold ($)
                                </Label>
                                <div className="relative mt-2">
                                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                                        $
                                    </span>
                                    <Input
                                        id="min_creator_payout"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.min_creator_payout}
                                        onChange={(e) =>
                                            setData(
                                                'min_creator_payout',
                                                e.target.value,
                                            )
                                        }
                                        className="pl-7"
                                    />
                                </div>
                                <InputError
                                    message={errors.min_creator_payout}
                                    className="mt-1"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Referrals */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Referral Rewards</CardTitle>
                            <CardDescription>
                                Bonuses paid out when a referred user completes
                                their first qualifying action.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="referral_creator_bonus">
                                    Creator referral bonus ($)
                                </Label>
                                <div className="relative mt-2">
                                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                                        $
                                    </span>
                                    <Input
                                        id="referral_creator_bonus"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.referral_creator_bonus}
                                        onChange={(e) =>
                                            setData(
                                                'referral_creator_bonus',
                                                e.target.value,
                                            )
                                        }
                                        className="pl-7"
                                    />
                                </div>
                                <InputError
                                    message={errors.referral_creator_bonus}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="referral_brand_credit">
                                    Brand referral credit ($)
                                </Label>
                                <div className="relative mt-2">
                                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                                        $
                                    </span>
                                    <Input
                                        id="referral_brand_credit"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.referral_brand_credit}
                                        onChange={(e) =>
                                            setData(
                                                'referral_brand_credit',
                                                e.target.value,
                                            )
                                        }
                                        className="pl-7"
                                    />
                                </div>
                                <InputError
                                    message={errors.referral_brand_credit}
                                    className="mt-1"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Last updated:{' '}
                            {new Date(settings.updated_at).toLocaleString()}
                        </p>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-orange-500 hover:bg-orange-600"
                        >
                            Save Settings
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

function PercentField({
    id,
    label,
    value,
    onChange,
    error,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
}) {
    return (
        <div>
            <Label htmlFor={id}>{label}</Label>
            <div className="relative mt-2">
                <Input
                    id={id}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="pr-8"
                />
                <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                    %
                </span>
            </div>
            <InputError message={error} className="mt-1" />
        </div>
    );
}

AdminSettings.layout = (page: React.ReactNode) => (
    <AdminLayout
        breadcrumbs={[
            { title: 'Admin Dashboard', href: '/admin' },
            { title: 'Platform Settings', href: '/admin/settings' },
        ]}
    >
        {page}
    </AdminLayout>
);
