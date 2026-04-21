import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Zap } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

const BRAND_STEPS = [
    { label: 'Company' },
    { label: 'Billing' },
    { label: 'Tour' },
];

type Plan = {
    name: string;
    monthly_price: number;
    annual_price: number;
    campaign_limit: number | null;
    features: string[];
    stripe_monthly: string | null;
    stripe_annual: string | null;
};

type Props = {
    plans: Record<string, Plan>;
    subscribed: boolean;
};

const PLAN_ORDER = ['starter', 'growth', 'scale'] as const;

function formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(0)}`;
}

export default function BrandBilling({ plans, subscribed }: Props) {
    const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly');
    const [selectedPlan, setSelectedPlan] = useState<string>('growth');
    const [loading, setLoading] = useState(false);

    function subscribe() {
        setLoading(true);
        router.post(
            '/billing/onboarding/brand/checkout',
            { plan: selectedPlan, interval },
            { onFinish: () => setLoading(false) },
        );
    }

    function skip() {
        router.post('/onboarding/brand/billing');
    }

    if (subscribed) {
        return (
            <>
                <Head title="Billing Setup" />
                <div className="space-y-6 text-center">
                    <CheckCircle2 className="mx-auto size-12 text-green-500" />
                    <div>
                        <h2 className="text-lg font-semibold">
                            You&apos;re already subscribed!
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Your plan is active. Continue to the tour.
                        </p>
                    </div>
                    <Button
                        className="w-full"
                        onClick={() => router.post('/onboarding/brand/billing')}
                    >
                        Continue
                    </Button>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Choose a Plan" />

            <div className="space-y-6">
                {/* Interval toggle */}
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setInterval('monthly')}
                        className={cn(
                            'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                            interval === 'monthly'
                                ? 'bg-foreground text-background'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setInterval('annual')}
                        className={cn(
                            'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                            interval === 'annual'
                                ? 'bg-foreground text-background'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        Annual
                        <span className="rounded-full bg-green-500 px-1.5 py-0.5 text-xs text-white">
                            -20%
                        </span>
                    </button>
                </div>

                {/* Plan cards */}
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
                        const isSelected = selectedPlan === key;

                        return (
                            <button
                                key={key}
                                onClick={() => setSelectedPlan(key)}
                                className={cn(
                                    'w-full rounded-lg border p-4 text-left transition-all',
                                    isSelected
                                        ? 'border-foreground bg-foreground/5 ring-1 ring-foreground'
                                        : 'border-border hover:border-foreground/50',
                                )}
                            >
                                <div className="flex items-start justify-between gap-4">
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
                                    <div className="shrink-0 text-right">
                                        <div className="text-xl font-bold">
                                            {formatPrice(price)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            / mo
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <Button
                    className="w-full"
                    onClick={subscribe}
                    disabled={loading}
                >
                    {loading ? 'Redirecting…' : 'Subscribe & Continue'}
                </Button>

                <button
                    onClick={skip}
                    className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                    Skip for now — set up billing later
                </button>
            </div>
        </>
    );
}

BrandBilling.layout = {
    title: 'Choose a plan',
    description: 'Start launching campaigns with the right plan for your team.',
    steps: BRAND_STEPS,
    currentStep: 1,
};
