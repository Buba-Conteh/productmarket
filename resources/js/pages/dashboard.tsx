import { Head, Link, usePage } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import {
    AlertTriangle,
    CheckCircle2,
    CircleX,
    Clock,
    Compass,
    CreditCard,
    Eye,
    FileVideo,
    Megaphone,
    Trophy,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ActivityList } from '@/components/dashboard/activity-list';
import type { ActivityItem } from '@/components/dashboard/activity-list';
import { PerformanceChart } from '@/components/dashboard/performance-chart';
import { StatCard } from '@/components/dashboard/stat-card';
import { WelcomeHero } from '@/components/dashboard/welcome-hero';
import { dashboard } from '@/routes';
import type { Auth } from '@/types';

// ── Types ──────────────────────────────────────────────────────────────────

type EventType =
    | 'entry_submitted'
    | 'entry_approved'
    | 'entry_live'
    | 'entry_won'
    | 'entry_rejected'
    | 'entry_not_selected'
    | 'payout_paid'
    | 'payout_pending';

interface RawActivity {
    id: string;
    event_type: EventType;
    title: string;
    description: string;
    created_at: string;
}

interface BrandStats {
    active_campaigns: number;
    total_views: number;
    budget_spent: string;
    entries_this_week: number;
    total_entries: number;
    subscription_active: boolean;
}

interface CreatorStats {
    total_earned: string;
    pending_earnings: string;
    active_entries: number;
    total_views: number;
    pending_payouts_count: number;
    stripe_connect_status: 'pending' | 'active' | 'restricted';
}

interface ChartData {
    data: number[];
    labels: string[];
}

interface PageProps extends Record<string, unknown> {
    auth: Auth;
    stats?: BrandStats | CreatorStats;
    chart?: ChartData;
    recent_activity?: RawActivity[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const eventIconMap: Record<EventType, { icon: LucideIcon; tone: ActivityItem['tone'] }> = {
    entry_submitted: { icon: FileVideo, tone: 'primary' },
    entry_approved: { icon: CheckCircle2, tone: 'success' },
    entry_live: { icon: Eye, tone: 'success' },
    entry_won: { icon: Trophy, tone: 'success' },
    entry_rejected: { icon: CircleX, tone: 'neutral' },
    entry_not_selected: { icon: Clock, tone: 'neutral' },
    payout_paid: { icon: Wallet, tone: 'primary' },
    payout_pending: { icon: TrendingUp, tone: 'neutral' },
};

function mapActivity(raw: RawActivity[]): ActivityItem[] {
    return raw.map((r) => {
        const config = eventIconMap[r.event_type] ?? { icon: Compass, tone: 'neutral' as const };
        return {
            id: r.id,
            title: r.title,
            description: r.description,
            meta: formatDistanceToNow(new Date(r.created_at), { addSuffix: true }),
            icon: config.icon,
            tone: config.tone,
        };
    });
}

function formatViews(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
}

function formatCurrency(s: string): string {
    return `$${Number(s).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Brand dashboard ────────────────────────────────────────────────────────

function BrandDashboard({
    name,
    stats,
    chart,
    activity,
}: {
    name: string;
    stats?: BrandStats;
    chart?: ChartData;
    activity: ActivityItem[];
}) {
    const s = stats;
    const emptyChart = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    return (
        <>
            <WelcomeHero
                eyebrow="Brand workspace"
                greeting={`Welcome back, ${name}`}
                description="Launch a campaign, review fresh entries, and track how your creators are performing — all in one place."
                primaryCta={{ label: 'Create campaign', href: '/campaigns/create' }}
                secondaryCta={{ label: 'Browse creators', href: '/creators' }}
            />

            {s && !s.subscription_active && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-3.5 text-sm dark:border-yellow-900/50 dark:bg-yellow-950/30">
                    <div className="flex items-center gap-2.5 text-yellow-800 dark:text-yellow-300">
                        <CreditCard className="size-4 shrink-0" />
                        <span>No active subscription — campaign creation is disabled until you pick a plan.</span>
                    </div>
                    <Link
                        href="/settings/billing/brand"
                        className="shrink-0 font-medium text-yellow-900 underline-offset-2 hover:underline dark:text-yellow-200"
                    >
                        Choose a plan →
                    </Link>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Active campaigns"
                    value={s ? String(s.active_campaigns) : '—'}
                    icon={Megaphone}
                    accent="primary"
                />
                <StatCard
                    label="Verified views"
                    value={s ? formatViews(s.total_views) : '—'}
                    icon={Eye}
                />
                <StatCard
                    label="Budget spent"
                    value={s ? formatCurrency(s.budget_spent) : '—'}
                    icon={Wallet}
                />
                <StatCard
                    label="Entries this week"
                    value={s ? String(s.entries_this_week) : '—'}
                    delta={s && s.entries_this_week > 0 ? `+${s.entries_this_week}` : undefined}
                    trend={s && s.entries_this_week > 0 ? 'up' : 'flat'}
                    icon={Users}
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <PerformanceChart
                        title="Campaign entries"
                        subtitle="Entries submitted per month"
                        currentValue={s ? String(s.total_entries) : '0'}
                        currentDelta={s && s.entries_this_week > 0 ? `+${s.entries_this_week} this week` : undefined}
                        data={chart?.data ?? emptyChart}
                        labels={chart?.labels}
                    />
                </div>
                <div className="lg:col-span-2">
                    <ActivityList
                        title="Recent activity"
                        items={
                            activity.length > 0
                                ? activity
                                : [
                                      {
                                          id: 'empty',
                                          title: 'No recent activity',
                                          description: 'Entry actions will appear here',
                                          meta: '',
                                          icon: Compass,
                                          tone: 'neutral',
                                      },
                                  ]
                        }
                    />
                </div>
            </div>
        </>
    );
}

// ── Creator dashboard ──────────────────────────────────────────────────────

function CreatorDashboard({
    name,
    stats,
    chart,
    activity,
}: {
    name: string;
    stats?: CreatorStats;
    chart?: ChartData;
    activity: ActivityItem[];
}) {
    const s = stats;
    const emptyChart = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    return (
        <>
            <WelcomeHero
                eyebrow="Creator workspace"
                greeting={`Hey ${name}, let's make something viral`}
                description="Browse campaigns tailored to your niche, track your entries, and watch your earnings roll in with verified views."
                primaryCta={{ label: 'Discover campaigns', href: '/discover' }}
                secondaryCta={{ label: 'My entries', href: '/entries' }}
            />

            {s && s.stripe_connect_status !== 'active' && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-3.5 text-sm dark:border-yellow-900/50 dark:bg-yellow-950/30">
                    <div className="flex items-center gap-2.5 text-yellow-800 dark:text-yellow-300">
                        <AlertTriangle className="size-4 shrink-0" />
                        <span>
                            {s.stripe_connect_status === 'restricted'
                                ? 'Your Stripe payout account is restricted — update your information to receive transfers.'
                                : 'Payout account not connected — complete Stripe setup to receive earnings.'}
                        </span>
                    </div>
                    <Link
                        href="/onboarding/creator/payout"
                        className="shrink-0 font-medium text-yellow-900 underline-offset-2 hover:underline dark:text-yellow-200"
                    >
                        {s.stripe_connect_status === 'restricted' ? 'Fix account →' : 'Set up payouts →'}
                    </Link>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Total earned"
                    value={s ? formatCurrency(s.total_earned) : '—'}
                    icon={Wallet}
                    accent="primary"
                />
                <StatCard
                    label="Pending earnings"
                    value={s ? formatCurrency(s.pending_earnings) : '—'}
                    delta={s && s.pending_payouts_count > 0 ? `${s.pending_payouts_count} payout${s.pending_payouts_count !== 1 ? 's' : ''}` : undefined}
                    trend="flat"
                    icon={Clock}
                />
                <StatCard
                    label="Active entries"
                    value={s ? String(s.active_entries) : '—'}
                    icon={FileVideo}
                />
                <StatCard
                    label="Verified views"
                    value={s ? formatViews(s.total_views) : '—'}
                    icon={Eye}
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <PerformanceChart
                        title="Monthly earnings"
                        subtitle="Net earnings paid out"
                        currentValue={s ? formatCurrency(s.total_earned) : '$0.00'}
                        currentDelta={
                            s && Number(s.pending_earnings) > 0
                                ? `${formatCurrency(s.pending_earnings)} pending`
                                : undefined
                        }
                        data={chart?.data ?? emptyChart}
                        labels={chart?.labels}
                    />
                </div>
                <div className="lg:col-span-2">
                    <ActivityList
                        title="Recent activity"
                        items={
                            activity.length > 0
                                ? activity
                                : [
                                      {
                                          id: 'empty',
                                          title: 'No recent activity',
                                          description: 'Entry and payout events will appear here',
                                          meta: '',
                                          icon: Compass,
                                          tone: 'neutral',
                                      },
                                  ]
                        }
                    />
                </div>
            </div>

            {s && (
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-5 py-3.5 text-sm">
                    <span className="text-muted-foreground">
                        Full payout history and Stripe status
                    </span>
                    <Link href="/wallet" className="text-primary font-medium hover:underline">
                        View wallet →
                    </Link>
                </div>
            )}
        </>
    );
}

// ── Fallback ───────────────────────────────────────────────────────────────

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

// ── Page ───────────────────────────────────────────────────────────────────

export default function Dashboard() {
    const { auth, stats, chart, recent_activity } = usePage<PageProps>().props;
    const roles = auth?.roles ?? [];
    const firstName = auth?.user?.name?.split(' ')[0] ?? 'there';

    const isBrand = roles.includes('brand');
    const isCreator = roles.includes('creator');

    const activity = mapActivity(recent_activity ?? []);

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {isBrand && (
                    <BrandDashboard
                        name={firstName}
                        stats={stats as BrandStats | undefined}
                        chart={chart}
                        activity={activity}
                    />
                )}
                {!isBrand && isCreator && (
                    <CreatorDashboard
                        name={firstName}
                        stats={stats as CreatorStats | undefined}
                        chart={chart}
                        activity={activity}
                    />
                )}
                {!isBrand && !isCreator && <FallbackDashboard name={firstName} />}
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
