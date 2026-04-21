import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    CreditCard,
    ExternalLink,
    FileText,
    Zap,
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
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type Plan = {
    name: string;
    monthly_price: number;
    annual_price: number;
    campaign_limit: number | null;
    features: string[];
};

type Subscription = {
    status: string;
    ends_at: string | null;
    is_annual: boolean;
    cancel_url: string;
    resume_url: string;
};

type Invoice = {
    id: string;
    date: string;
    total: string;
    status: string;
    pdf: string;
    description: string;
};

type Props = {
    plans: Record<string, Plan>;
    currentPlan: string | null;
    planDetails: Plan | null;
    subscription: Subscription | null;
    invoices: Invoice[];
};

const PLAN_ORDER = ['starter', 'growth', 'scale'] as const;

function formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(0)}`;
}

function statusBadge(status: string) {
    const map: Record<string, string> = {
        active: 'bg-green-100 text-green-700',
        trialing: 'bg-blue-100 text-blue-700',
        canceled: 'bg-red-100 text-red-700',
        incomplete: 'bg-yellow-100 text-yellow-700',
        past_due: 'bg-red-100 text-red-700',
    };

    return map[status] ?? 'bg-muted text-muted-foreground';
}

export default function BrandBillingSettings({
    plans,
    currentPlan,
    planDetails,
    subscription,
    invoices,
}: Props) {
    const { props } = usePage();
    const flash = (props as { flash?: { success?: string; error?: string } })
        .flash;

    const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly');
    const [loading, setLoading] = useState<string | null>(null);

    function checkout(planKey: string) {
        setLoading(planKey);
        router.post(
            '/billing/brand/checkout',
            { plan: planKey, interval },
            { onFinish: () => setLoading(null) },
        );
    }

    function openPortal() {
        router.post('/billing/portal');
    }

    function cancel() {
        if (
            !confirm(
                'Cancel your subscription at the end of this billing period?',
            )
        ) {
return;
}

        router.post('/billing/brand/cancel');
    }

    function resume() {
        router.post('/billing/brand/resume');
    }

    const isCancelling =
        subscription?.status === 'active' && subscription.ends_at !== null;

    return (
        <>
            <Head title="Billing" />

            <h1 className="sr-only">Billing</h1>

            <div className="space-y-8">
                {/* Flash messages */}
                {flash?.success && (
                    <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                        <CheckCircle2 className="size-4 shrink-0" />
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        <AlertCircle className="size-4 shrink-0" />
                        {flash.error}
                    </div>
                )}

                {/* Current subscription status */}
                <div>
                    <Heading
                        variant="small"
                        title="Current plan"
                        description="Manage your brand subscription"
                    />

                    {subscription ? (
                        <Card className="mt-4">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base">
                                            {planDetails?.name ??
                                                'Unknown plan'}
                                        </CardTitle>
                                        <CardDescription>
                                            {subscription.is_annual
                                                ? 'Annual billing'
                                                : 'Monthly billing'}
                                        </CardDescription>
                                    </div>
                                    <span
                                        className={cn(
                                            'rounded-full px-2.5 py-0.5 text-xs font-medium',
                                            statusBadge(subscription.status),
                                        )}
                                    >
                                        {isCancelling
                                            ? 'Cancelling'
                                            : subscription.status}
                                    </span>
                                </div>
                            </CardHeader>
                            {isCancelling && subscription.ends_at && (
                                <CardContent className="pt-0">
                                    <p className="text-sm text-muted-foreground">
                                        Access until{' '}
                                        {new Date(
                                            subscription.ends_at,
                                        ).toLocaleDateString()}
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-3"
                                        onClick={resume}
                                    >
                                        Resume subscription
                                    </Button>
                                </CardContent>
                            )}
                        </Card>
                    ) : (
                        <Card className="mt-4 border-dashed">
                            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                                <CreditCard className="size-8 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">
                                        No active subscription
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Choose a plan below to start creating
                                        campaigns.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Separator />

                {/* Plan selection */}
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <Heading
                            variant="small"
                            title="Change plan"
                            description="Upgrade or downgrade at any time"
                        />

                        {/* Interval toggle */}
                        <div className="flex gap-1 rounded-full border p-0.5 text-sm">
                            {(['monthly', 'annual'] as const).map((i) => (
                                <button
                                    key={i}
                                    onClick={() => setInterval(i)}
                                    className={cn(
                                        'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                                        interval === i
                                            ? 'bg-foreground text-background'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    {i === 'annual' ? 'Annual −20%' : 'Monthly'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {PLAN_ORDER.map((key) => {
                            const plan = plans[key];

                            if (!plan) {
return null;
}

                            const price =
                                interval === 'monthly'
                                    ? plan.monthly_price
                                    : Math.round(plan.annual_price / 12);
                            const isCurrent = currentPlan === key;

                            return (
                                <div
                                    key={key}
                                    className={cn(
                                        'flex items-start justify-between gap-4 rounded-lg border p-4',
                                        isCurrent &&
                                            'border-primary/50 bg-primary/5',
                                    )}
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">
                                                {plan.name}
                                            </span>
                                            {key === 'growth' && (
                                                <span className="flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                                    <Zap className="size-3" />
                                                    Popular
                                                </span>
                                            )}
                                            {isCurrent && (
                                                <Badge variant="secondary">
                                                    Current
                                                </Badge>
                                            )}
                                        </div>
                                        <ul className="space-y-1">
                                            {plan.features.map((f) => (
                                                <li
                                                    key={f}
                                                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                                                >
                                                    <CheckCircle2 className="size-3 shrink-0 text-green-500" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-2">
                                        <div className="text-right">
                                            <div className="text-lg font-bold">
                                                {formatPrice(price)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                / mo
                                            </div>
                                        </div>
                                        {!isCurrent ? (
                                            <Button
                                                size="sm"
                                                onClick={() => checkout(key)}
                                                disabled={loading === key}
                                            >
                                                {loading === key
                                                    ? 'Loading…'
                                                    : 'Select'}
                                            </Button>
                                        ) : (
                                            !isCancelling && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={cancel}
                                                >
                                                    Cancel
                                                </Button>
                                            )
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={openPortal}
                            className="gap-2"
                        >
                            <ExternalLink className="size-3.5" />
                            Manage payment method
                        </Button>
                    </div>
                </div>

                {/* Invoices */}
                {invoices.length > 0 && (
                    <>
                        <Separator />
                        <div>
                            <Heading
                                variant="small"
                                title="Billing history"
                                description="Download past invoices"
                            />
                            <div className="mt-4 space-y-2">
                                {invoices.map((invoice) => (
                                    <div
                                        key={invoice.id}
                                        className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {invoice.date}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {invoice.description}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium">
                                                {invoice.total}
                                            </span>
                                            <a
                                                href={invoice.pdf}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-muted-foreground hover:text-foreground"
                                            >
                                                <FileText className="size-4" />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

BrandBillingSettings.layout = {
    breadcrumbs: [{ title: 'Billing', href: '/settings/billing/brand' }],
};
