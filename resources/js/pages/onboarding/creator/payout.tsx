import { Head, router } from '@inertiajs/react';
import {
    Banknote,
    CheckCircle2,
    ExternalLink,
    Loader2,
    Sparkles,
    TrendingUp,
    Trophy,
    Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CREATOR_STEPS = [
    { label: 'Profile' },
    { label: 'Niches' },
    { label: 'Social' },
    { label: 'Payout' },
];

type Plan = {
    name: string;
    monthly_price: number;
    annual_price: number;
    entry_limit: number | null;
    features: string[];
    stripe_monthly: string | null;
    stripe_annual: string | null;
};

type Profile = {
    stripe_connect_id: string | null;
    stripe_connect_status: 'pending' | 'active' | 'restricted' | null;
};

type Props = {
    profile: Profile;
    plans: Record<string, Plan>;
};

function formatPrice(cents: number): string {
    if (cents === 0) return 'Free';
    return `$${(cents / 100).toFixed(0)}`;
}

function StripeConnectSection({ profile }: { profile: Profile }) {
    const [loading, setLoading] = useState(false);

    const isActive = profile.stripe_connect_status === 'active';
    const isPending =
        profile.stripe_connect_id &&
        profile.stripe_connect_status !== 'active';

    function connect() {
        setLoading(true);
        router.post(
            '/onboarding/creator/stripe/connect',
            {},
            { onFinish: () => setLoading(false) },
        );
    }

    if (isActive) {
        return (
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
                <CheckCircle2 className="size-5 shrink-0 text-green-600 dark:text-green-400" />
                <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                        Payouts connected
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-400">
                        Your Stripe account is active and ready to receive
                        payments.
                    </p>
                </div>
            </div>
        );
    }

    if (isPending) {
        return (
            <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center gap-2">
                    <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                    <p className="text-sm font-medium">
                        Stripe setup incomplete
                    </p>
                </div>
                <p className="text-xs text-muted-foreground">
                    You started Stripe onboarding but haven't finished. Complete
                    it to receive payouts.
                </p>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={connect}
                    disabled={loading}
                    className="w-full gap-2"
                >
                    {loading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                        <ExternalLink className="size-3.5" />
                    )}
                    {loading ? 'Redirecting…' : 'Continue Stripe setup'}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-2">
                <Banknote className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium">Set up payouts</p>
            </div>
            <p className="text-xs text-muted-foreground">
                Connect a bank account or debit card via Stripe Express. KYC is
                handled entirely by Stripe — we never see your banking details.
            </p>
            <Button
                size="sm"
                onClick={connect}
                disabled={loading}
                className="w-full gap-2"
            >
                {loading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                ) : (
                    <ExternalLink className="size-3.5" />
                )}
                {loading ? 'Redirecting to Stripe…' : 'Set up payouts with Stripe'}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
                You can also do this later from Settings.
            </p>
        </div>
    );
}

export default function CreatorPayout({ profile, plans }: Props) {
    const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly');
    const [loading, setLoading] = useState(false);

    const freePlan = plans?.free;
    const proPlan = plans?.pro;

    function subscribePro() {
        setLoading(true);
        router.post(
            '/billing/creator/checkout',
            { interval },
            { onFinish: () => setLoading(false) },
        );
    }

    function complete() {
        router.post('/onboarding/creator/complete');
    }

    return (
        <>
            <Head title="Welcome to ProductMarket" />

            <div className="space-y-6">
                {/* Platform overview */}
                <div className="space-y-3">
                    {[
                        {
                            icon: Trophy,
                            title: 'Win contests',
                            description:
                                'Submit your best content. Brands pick winners based on creativity and verified view counts.',
                        },
                        {
                            icon: TrendingUp,
                            title: 'Earn per view with Ripple',
                            description:
                                'Get paid an upfront fee plus milestone bonuses as your verified views grow.',
                        },
                        {
                            icon: Sparkles,
                            title: 'Pitch to brands',
                            description:
                                'Browse brand campaigns and pitch yourself. Set your own rate.',
                        },
                    ].map((feature) => (
                        <div
                            key={feature.title}
                            className="flex gap-3 rounded-lg border p-3"
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <feature.icon className="size-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">
                                    {feature.title}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Stripe Connect */}
                <StripeConnectSection profile={profile} />

                {/* Plan comparison */}
                {proPlan && (
                    <div className="space-y-3">
                        <p className="text-sm font-medium">Choose your plan</p>

                        <div className="flex gap-2">
                            {(['monthly', 'annual'] as const).map((i) => (
                                <button
                                    key={i}
                                    onClick={() => setInterval(i)}
                                    className={cn(
                                        'flex-1 rounded-full py-1.5 text-xs font-medium transition-colors',
                                        interval === i
                                            ? 'bg-foreground text-background'
                                            : 'border text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    {i === 'annual'
                                        ? 'Annual (save 20%)'
                                        : 'Monthly'}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {freePlan && (
                                <div className="rounded-lg border p-3">
                                    <p className="font-semibold">Free</p>
                                    <p className="mt-1 text-xl font-bold">
                                        $0
                                    </p>
                                    <ul className="mt-3 space-y-1.5">
                                        {freePlan.features.map((f) => (
                                            <li
                                                key={f}
                                                className="flex items-start gap-1.5 text-xs text-muted-foreground"
                                            >
                                                <CheckCircle2 className="mt-0.5 size-3 shrink-0" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="rounded-lg border border-primary/50 bg-primary/5 p-3 ring-1 ring-primary/30">
                                <div className="flex items-center gap-1">
                                    <p className="font-semibold">
                                        {proPlan.name}
                                    </p>
                                    <Zap className="size-3 text-primary" />
                                </div>
                                <p className="mt-1 text-xl font-bold">
                                    {interval === 'monthly'
                                        ? formatPrice(proPlan.monthly_price)
                                        : formatPrice(
                                              Math.round(
                                                  proPlan.annual_price / 12,
                                              ),
                                          )}
                                    <span className="text-xs font-normal text-muted-foreground">
                                        /mo
                                    </span>
                                </p>
                                <ul className="mt-3 space-y-1.5">
                                    {proPlan.features.map((f) => (
                                        <li
                                            key={f}
                                            className="flex items-start gap-1.5 text-xs text-muted-foreground"
                                        >
                                            <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-primary" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <Button
                            className="w-full"
                            onClick={subscribePro}
                            disabled={loading || !proPlan.stripe_monthly}
                        >
                            {loading ? 'Redirecting…' : 'Start Creator Pro'}
                        </Button>
                    </div>
                )}

                <button
                    onClick={complete}
                    className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                    Continue with free plan
                </button>
            </div>
        </>
    );
}

CreatorPayout.layout = {
    title: "You're all set!",
    description: 'Start earning on ProductMarket.',
    steps: CREATOR_STEPS,
    currentStep: 3,
};
