import { Head } from '@inertiajs/react';
import {
    BarChart3,
    CreditCard,
    DollarSign,
    Layers,
    Megaphone,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { StatCard } from '@/components/dashboard/stat-card';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    gmv_by_month: { month: string; gmv: number; revenue: number }[];
    commission_by_type: { type: string; commission: number; gmv: number }[];
    top_campaigns: { id: string; title: string; type: string; total_views: number }[];
    user_growth: { month: string; users: number }[];
    subscription_breakdown: { plan: string; role: string; count: number; mrr_cents: number }[];
    subscription_growth: { month: string; subscriptions: number }[];
    summary: {
        total_gmv: number;
        total_commission: number;
        take_rate_pct: number;
        estimated_mrr: number;
        active_subscriptions: number;
        pending_escrow: number;
        total_brands: number;
        total_creators: number;
        new_users_today: number;
        new_users_this_week: number;
        new_users_this_month: number;
        active_campaigns: number;
        total_entries: number;
    };
}

const PLAN_LABELS: Record<string, string> = {
    starter: 'Starter',
    growth: 'Growth',
    scale: 'Scale',
    pro: 'Creator Pro',
    free: 'Free',
};

const TYPE_COLORS: Record<string, string> = {
    Contest: '#6366f1',
    Ripple: '#f59e0b',
    Pitch: '#10b981',
};

const PIE_COLORS = ['#6366f1', '#a78bfa', '#c4b5fd', '#10b981', '#34d399'];

function fmt(n: number) {
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AdminAnalytics({
    gmv_by_month,
    commission_by_type,
    top_campaigns,
    user_growth,
    subscription_breakdown,
    subscription_growth,
    summary,
}: Props) {
    const brandPlans = subscription_breakdown.filter((p) => p.role === 'brand');
    const creatorPlans = subscription_breakdown.filter((p) => p.role === 'creator');

    return (
        <>
            <Head title="Platform Analytics" />
            <div className="space-y-8 px-4 py-6">
                <Heading
                    title="Platform Analytics"
                    description="Real-time overview of revenue, subscriptions, and growth across the platform."
                />

                {/* ── Revenue KPIs ── */}
                <section className="space-y-3">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Revenue
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            label="Total GMV"
                            value={fmt(summary.total_gmv)}
                            icon={DollarSign}
                            accent="primary"
                        />
                        <StatCard
                            label="Commission Earned"
                            value={fmt(summary.total_commission)}
                            icon={BarChart3}
                            accent="primary"
                        />
                        <StatCard
                            label="Estimated MRR"
                            value={fmt(summary.estimated_mrr)}
                            icon={TrendingUp}
                        />
                        <StatCard
                            label="Funds in Escrow"
                            value={fmt(summary.pending_escrow)}
                            icon={Wallet}
                        />
                    </div>
                </section>

                {/* ── Subscription KPIs ── */}
                <section className="space-y-3">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Subscriptions
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <StatCard
                            label="Active Subscriptions"
                            value={summary.active_subscriptions.toLocaleString()}
                            icon={CreditCard}
                        />
                        <StatCard
                            label="Take Rate"
                            value={`${summary.take_rate_pct}%`}
                            icon={BarChart3}
                        />
                        <StatCard
                            label="Active Campaigns"
                            value={summary.active_campaigns.toLocaleString()}
                            icon={Megaphone}
                        />
                    </div>
                </section>

                {/* ── Users & Registrations ── */}
                <section className="space-y-3">
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Users
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            label="Total Brands"
                            value={summary.total_brands.toLocaleString()}
                            icon={Megaphone}
                        />
                        <StatCard
                            label="Total Creators"
                            value={summary.total_creators.toLocaleString()}
                            icon={Users}
                        />
                        <StatCard
                            label="New This Month"
                            value={summary.new_users_this_month.toLocaleString()}
                            icon={Users}
                        />
                        <StatCard
                            label="New This Week"
                            value={summary.new_users_this_week.toLocaleString()}
                            icon={Users}
                        />
                    </div>
                </section>

                {/* ── GMV & Revenue chart ── */}
                <Card>
                    <CardHeader>
                        <CardTitle>GMV & Commission — Last 6 Months</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {gmv_by_month.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                No paid payouts yet.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={gmv_by_month} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip formatter={(v) => fmt(Number(v))} />
                                    <Legend />
                                    <Bar dataKey="gmv" name="GMV" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="revenue" name="Commission" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* ── Commission by type + Subscription growth ── */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Commission by Campaign Type</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {commission_by_type.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    No paid commissions yet.
                                </p>
                            ) : (
                                <div className="flex items-center gap-6">
                                    <ResponsiveContainer width="50%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={commission_by_type}
                                                dataKey="commission"
                                                nameKey="type"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                label={({ name, percent }) =>
                                                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                                                }
                                                labelLine={false}
                                            >
                                                {commission_by_type.map((entry) => (
                                                    <Cell
                                                        key={entry.type}
                                                        fill={TYPE_COLORS[entry.type] ?? '#6366f1'}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v) => fmt(Number(v))} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="flex-1 space-y-3">
                                        {commission_by_type.map((row) => (
                                            <div key={row.type} className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="h-2.5 w-2.5 rounded-full"
                                                        style={{ background: TYPE_COLORS[row.type] ?? '#6366f1' }}
                                                    />
                                                    <span className="text-sm">{row.type}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium">{fmt(row.commission)}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        GMV {fmt(row.gmv)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>New Subscriptions — Last 6 Months</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {subscription_growth.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    No subscription data yet.
                                </p>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart
                                        data={subscription_growth}
                                        margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="subscriptions"
                                            name="New Subscriptions"
                                            stroke="#f59e0b"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Subscription plan breakdown ── */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Brand Plans</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {brandPlans.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    No active brand subscriptions.
                                </p>
                            ) : (
                                <div className="space-y-1">
                                    <div className="mb-3 grid grid-cols-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        <span>Plan</span>
                                        <span className="text-center">Subscribers</span>
                                        <span className="text-right">Est. MRR</span>
                                    </div>
                                    {brandPlans.map((p, i) => (
                                        <div
                                            key={p.plan}
                                            className="grid grid-cols-3 items-center rounded-lg px-2 py-2 hover:bg-muted/50"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="h-2.5 w-2.5 rounded-full"
                                                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                                                />
                                                <span className="text-sm font-medium">
                                                    {PLAN_LABELS[p.plan] ?? p.plan}
                                                </span>
                                            </div>
                                            <span className="text-center text-sm">{p.count.toLocaleString()}</span>
                                            <span className="text-right text-sm font-medium">
                                                {fmt(p.mrr_cents / 100)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Creator Plans</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {creatorPlans.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    No creator subscription data.
                                </p>
                            ) : (
                                <div className="space-y-1">
                                    <div className="mb-3 grid grid-cols-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        <span>Plan</span>
                                        <span className="text-center">Subscribers</span>
                                        <span className="text-right">Est. MRR</span>
                                    </div>
                                    {creatorPlans.map((p, i) => (
                                        <div
                                            key={p.plan}
                                            className="grid grid-cols-3 items-center rounded-lg px-2 py-2 hover:bg-muted/50"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="h-2.5 w-2.5 rounded-full"
                                                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                                                />
                                                <span className="text-sm font-medium">
                                                    {PLAN_LABELS[p.plan] ?? p.plan}
                                                </span>
                                            </div>
                                            <span className="text-center text-sm">{p.count.toLocaleString()}</span>
                                            <span className="text-right text-sm font-medium">
                                                {fmt(p.mrr_cents / 100)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── User growth + Top campaigns ── */}
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Registrations — Last 6 Months</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {user_growth.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={user_growth} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="users"
                                            name="New Users"
                                            stroke="#6366f1"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Top Campaigns by Views</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {top_campaigns.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">
                                    No campaign view data yet.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {top_campaigns.map((c, i) => (
                                        <div key={c.id} className="flex items-center justify-between gap-2">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                                    {i + 1}
                                                </span>
                                                <span className="truncate text-sm">{c.title}</span>
                                                <Badge
                                                    variant="outline"
                                                    className="flex-shrink-0 capitalize text-xs"
                                                >
                                                    {c.type}
                                                </Badge>
                                            </div>
                                            <span className="flex-shrink-0 text-sm font-medium">
                                                {Number(c.total_views).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Platform totals ── */}
                <Card>
                    <CardHeader>
                        <CardTitle>Platform Totals</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                                <p className="text-xs text-muted-foreground">Total Users</p>
                                <p className="mt-1 text-2xl font-semibold">
                                    {(summary.total_brands + summary.total_creators).toLocaleString()}
                                </p>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                                <p className="text-xs text-muted-foreground">Entries Submitted</p>
                                <p className="mt-1 text-2xl font-semibold">
                                    {summary.total_entries.toLocaleString()}
                                </p>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                                <p className="text-xs text-muted-foreground">New Users Today</p>
                                <p className="mt-1 text-2xl font-semibold">
                                    {summary.new_users_today.toLocaleString()}
                                </p>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                                <p className="text-xs text-muted-foreground">Commission Take Rate</p>
                                <p className="mt-1 text-2xl font-semibold">{summary.take_rate_pct}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
