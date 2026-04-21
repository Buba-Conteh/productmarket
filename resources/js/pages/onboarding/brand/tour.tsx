import { Head, router } from '@inertiajs/react';
import { Megaphone, Search, DollarSign, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BRAND_STEPS = [
    { label: 'Company' },
    { label: 'Billing' },
    { label: 'Tour' },
];

type Feature = {
    icon: typeof Megaphone;
    title: string;
    description: string;
};

const FEATURES: Feature[] = [
    {
        icon: Megaphone,
        title: 'Launch campaigns',
        description:
            'Create Contest, Ripple, or Pitch campaigns to connect with creators who match your brand.',
    },
    {
        icon: Search,
        title: 'Discover creators',
        description:
            'Search and filter creators by niche, platform, follower count, and engagement rate.',
    },
    {
        icon: DollarSign,
        title: 'Secure payments',
        description:
            'Funds are held in escrow until campaign goals are met. You only pay for real results.',
    },
    {
        icon: BarChart3,
        title: 'Track performance',
        description:
            'Verified view counts from social platforms — no screenshots or self-reporting needed.',
    },
];

export default function BrandTour() {
    function complete() {
        router.post('/onboarding/brand/complete');
    }

    return (
        <>
            <Head title="Welcome to ProductMarket" />

            <div className="space-y-6">
                <div className="space-y-4">
                    {FEATURES.map((feature) => (
                        <div
                            key={feature.title}
                            className="flex gap-4 rounded-lg border p-4"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <feature.icon className="size-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-medium">{feature.title}</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <Button onClick={complete} className="w-full" size="lg">
                    Go to dashboard
                </Button>
            </div>
        </>
    );
}

BrandTour.layout = {
    title: "You're all set!",
    description: "Here's what you can do on ProductMarket.",
    steps: BRAND_STEPS,
    currentStep: 2,
};
