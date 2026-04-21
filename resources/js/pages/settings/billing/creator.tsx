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
    entry_limit: number | null;
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
    currentPlan: string;
    planDetails: Plan | null;
    subscription: Subscription | null;
    invoices: Invoice[];
};

function formatPrice(cents: number): string {
    if (cents === 0) {
return '$0';
}

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

export default function CreatorBillingSettings({
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
    const [loading, setLoading] = useState(false);

    const proPlan = plans?.pro;
    const isOnPro = currentPlan === 'pro';
    const isCancelling =
        subscription?.status === 'active' && subscription.ends_at !== null;

    function subscribePro() {
        setLoading(true);
        router.post(
            '/billing/creator/checkout',
            { interval },
            { onFinish: () => setLoading(false) },
        );
    }

    function openPortal() {
        router.post('/billing/portal');
    }

    function cancel() {
        if (
            !confirm(
                'Cancel your Creator Pro subscription at the end of this billing period?',
            )
        ) {
return;
}

        router.post('/billing/creator/cancel');
    }

    function resume() {
        router.post('/billing/creator/resume');
    }

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

                {/* Current plan */}
                <div>
                    <Heading
                        variant="small"
                        title="Current plan"
                        description="Your Creator plan"
                    />

                    <Card className="mt-4">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">
                                        {planDetails?.name ?? 'Free'}
                                    </CardTitle>
                                    <CardDescription>
                                        {isOnPro
                                            ? subscription?.is_annual
                                                ? 'Annual billing'
                                                : 'Monthly billing'
                                            : 'Up to 2 entries per month'}
                                    </CardDescription>
                                </div>
                                {isOnPro && subscription && (
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
                                )}
                            </div>
                        </CardHeader>
                        {isCancelling && subscription?.ends_at && (
                            <CardContent className="pt-0">
                                <p className="text-sm text-muted-foreground">
                                    Pro access until{' '}
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
                </div>

                {/* Upgrade to Pro */}
                {!isOnPro && proPlan && (
                    <>
                        <Separator />
                        <div>
                            <Heading
                                variant="small"
                                title="Upgrade to Creator Pro"
                                description="Unlock unlimited entries and priority discovery"
                            />

                            {/* Interval toggle */}
                            <div className="mt-4 mb-4 flex w-fit gap-1 rounded-full border p-0.5 text-sm">
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
                                        {i === 'annual'
                                            ? 'Annual −20%'
                                            : 'Monthly'}
                                    </button>
                                ))}
                            </div>

                            <Card className="border-primary/50 bg-primary/5 ring-1 ring-primary/30">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-base">
                                                {proPlan.name}
                                            </CardTitle>
                                            <Zap className="size-4 text-primary" />
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold">
                                                {interval === 'monthly'
                                                    ? formatPrice(
                                                          proPlan.monthly_price,
                                                      )
                                                    : formatPrice(
                                                          Math.round(
                                                              proPlan.annual_price /
                                                                  12,
                                                          ),
                                                      )}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                per month
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <ul className="space-y-2">
                                        {proPlan.features.map((f) => (
                                            <li
                                                key={f}
                                                className="flex items-center gap-2 text-sm"
                                            >
                                                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button
                                        className="w-full"
                                        onClick={subscribePro}
                                        disabled={
                                            loading || !proPlan.stripe_monthly
                                        }
                                    >
                                        {loading
                                            ? 'Redirecting…'
                                            : !proPlan.stripe_monthly
                                              ? 'Coming soon'
                                              : 'Upgrade to Creator Pro'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}

                {/* Cancel Pro (only if on Pro and not cancelling) */}
                {isOnPro && subscription && !isCancelling && (
                    <>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">
                                    Cancel subscription
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    You&apos;ll keep Pro access until the end of
                                    your billing period.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={openPortal}
                                    className="gap-2"
                                >
                                    <ExternalLink className="size-3.5" />
                                    Manage payment
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={cancel}
                                >
                                    Cancel plan
                                </Button>
                            </div>
                        </div>
                    </>
                )}

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

CreatorBillingSettings.layout = {
    breadcrumbs: [{ title: 'Billing', href: '/settings/billing/creator' }],
};
