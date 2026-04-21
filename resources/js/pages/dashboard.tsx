import { Head, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    Compass,
    Eye,
    FileVideo,
    Megaphone,
    MessageSquare,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import { ActivityList } from '@/components/dashboard/activity-list';
import type { ActivityItem } from '@/components/dashboard/activity-list';
import { PerformanceChart } from '@/components/dashboard/performance-chart';
import { StatCard } from '@/components/dashboard/stat-card';
import { WelcomeHero } from '@/components/dashboard/welcome-hero';
import { dashboard } from '@/routes';
import type { Auth } from '@/types';

const chartLabels = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

const brandChartData = [12, 18, 16, 24, 22, 30, 28, 34, 40, 44, 52, 48];

const creatorChartData = [8, 14, 11, 20, 18, 26, 30, 28, 36, 42, 48, 55];

const brandActivity: ActivityItem[] = [
    {
        id: '1',
        title: 'New entry on "Summer Glow Contest"',
        description: 'Maya Rivera submitted a GRWM video',
        meta: '2m ago',
        icon: FileVideo,
        tone: 'primary',
    },
    {
        id: '2',
        title: 'Ripple milestone reached',
        description: 'Nitro drop campaign crossed 100k views',
        meta: '1h ago',
        icon: TrendingUp,
        tone: 'success',
    },
    {
        id: '3',
        title: 'Pitch accepted',
        description: 'Alex Nguyen accepted $350 bid',
        meta: '3h ago',
        icon: CheckCircle2,
        tone: 'success',
    },
    {
        id: '4',
        title: 'New message from creator',
        description: 'Jordan: Can we adjust the hashtags?',
        meta: 'Yesterday',
        icon: MessageSquare,
    },
];

const creatorActivity: ActivityItem[] = [
    {
        id: '1',
        title: 'Entry approved — Ripple',
        description: '"Glow routine" approved by Northside Skincare',
        meta: '5m ago',
        icon: CheckCircle2,
        tone: 'success',
    },
    {
        id: '2',
        title: 'Payout processed',
        description: '$212.50 sent to your Stripe account',
        meta: '2h ago',
        icon: Wallet,
        tone: 'primary',
    },
    {
        id: '3',
        title: 'New matching campaign',
        description: 'Fitness contest matches your niches',
        meta: '6h ago',
        icon: Compass,
    },
    {
        id: '4',
        title: 'Edit request',
        description: 'Brand asked for a shorter hook',
        meta: 'Yesterday',
        icon: Clock,
    },
];

function BrandDashboard({ name }: { name: string }) {
    return (
        <>
            <WelcomeHero
                eyebrow="Brand workspace"
                greeting={`Welcome back, ${name}`}
                description="Launch a campaign, review fresh entries, and track how your creators are performing — all in one place."
                primaryCta={{
                    label: 'Create campaign',
                    href: '/campaigns/create',
                }}
                secondaryCta={{ label: 'Browse creators', href: '/creators' }}
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Active campaigns"
                    value="7"
                    delta="+2"
                    trend="up"
                    icon={Megaphone}
                    accent="primary"
                />
                <StatCard
                    label="Verified views"
                    value="482.5K"
                    delta="+18.4%"
                    trend="up"
                    icon={Eye}
                />
                <StatCard
                    label="Budget spent"
                    value="$12,840"
                    delta="$1,204"
                    trend="up"
                    icon={Wallet}
                />
                <StatCard
                    label="Applicants this week"
                    value="34"
                    delta="+6"
                    trend="up"
                    icon={Users}
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <PerformanceChart
                        title="Verified views"
                        subtitle="Across all active campaigns"
                        currentValue="482,540"
                        currentDelta="+18.4%"
                        data={brandChartData}
                        labels={chartLabels}
                    />
                </div>
                <div className="lg:col-span-2">
                    <ActivityList
                        title="Recent activity"
                        items={brandActivity}
                    />
                </div>
            </div>
        </>
    );
}

function CreatorDashboard({ name }: { name: string }) {
    return (
        <>
            <WelcomeHero
                eyebrow="Creator workspace"
                greeting={`Hey ${name}, let's make something viral`}
                description="Browse campaigns tailored to your niche, track your entries, and watch your earnings roll in with verified views."
                primaryCta={{ label: 'Discover campaigns', href: '/discover' }}
                secondaryCta={{ label: 'My entries', href: '/entries' }}
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Total earned"
                    value="$2,845.00"
                    delta="+$212"
                    trend="up"
                    icon={Wallet}
                    accent="primary"
                />
                <StatCard
                    label="Pending earnings"
                    value="$482.50"
                    delta="3 payouts"
                    trend="flat"
                    icon={Clock}
                />
                <StatCard
                    label="Active entries"
                    value="4"
                    delta="+1"
                    trend="up"
                    icon={FileVideo}
                />
                <StatCard
                    label="Verified views"
                    value="128.3K"
                    delta="+9.1%"
                    trend="up"
                    icon={Eye}
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <PerformanceChart
                        title="Earnings trend"
                        subtitle="Last 12 weeks"
                        currentValue="$2,845"
                        currentDelta="+14.2%"
                        data={creatorChartData}
                        labels={chartLabels}
                    />
                </div>
                <div className="lg:col-span-2">
                    <ActivityList
                        title="Recent activity"
                        items={creatorActivity}
                    />
                </div>
            </div>
        </>
    );
}

function FallbackDashboard({ name }: { name: string }) {
    return (
        <WelcomeHero
            eyebrow="Getting started"
            greeting={`Welcome, ${name}`}
            description="Pick a role during onboarding to unlock a workspace tailored for brands or creators."
            primaryCta={{ label: 'Complete onboarding', href: '/onboarding' }}
        />
    );
}

export default function Dashboard() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const roles = auth?.roles ?? [];
    const firstName = auth?.user?.name?.split(' ')[0] ?? 'there';

    const isBrand = roles.includes('brand');
    const isCreator = roles.includes('creator');

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {isBrand && <BrandDashboard name={firstName} />}
                {!isBrand && isCreator && <CreatorDashboard name={firstName} />}
                {!isBrand && !isCreator && (
                    <FallbackDashboard name={firstName} />
                )}
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
