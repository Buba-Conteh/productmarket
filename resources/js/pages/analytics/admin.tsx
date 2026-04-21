import { Head } from '@inertiajs/react';
import { BarChart3, DollarSign, Megaphone, Users } from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
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
    top_campaigns: { id: string; title: string; type: string; total_views: number }[];
    user_growth: { month: string; users: number }[];
    summary: {
        total_gmv: number;
        total_revenue: number;
        take_rate_pct: number;
        total_brands: number;
        total_creators: number;
        active_campaigns: number;
    };
}

export default function AdminAnalytics({ gmv_by_month, top_campaigns, user_growth, summary }: Props) {
    return (
        <>
            <Head title="Platform Analytics" />
            <div className="space-y-6 px-4 py-6">
                <Heading title="Platform Analytics" description="GMV, revenue, and growth across the entire platform." />

                {/* Summary */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard label="Total GMV" value={`$${summary.total_gmv.toLocaleString()}`} icon={DollarSign} accent="primary" />
                    <StatCard label="Platform Revenue" value={`$${summary.total_revenue.toLocaleString()}`} icon={BarChart3} />
                    <StatCard label="Take Rate" value={`${summary.take_rate_pct}%`} icon={BarChart3} />
                    <StatCard label="Total Brands" value={summary.total_brands.toLocaleString()} icon={Megaphone} />
                    <StatCard label="Total Creators" value={summary.total_creators.toLocaleString()} icon={Users} />
                    <StatCard label="Active Campaigns" value={summary.active_campaigns.toLocaleString()} icon={Megaphone} />
                </div>

                {/* GMV + revenue by month */}
                <Card>
                    <CardHeader><CardTitle>GMV & Revenue — Last 6 Months</CardTitle></CardHeader>
                    <CardContent>
                        {gmv_by_month.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">No paid payouts yet.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={gmv_by_month} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                                    <Bar dataKey="gmv" name="GMV ($)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="revenue" name="Revenue ($)" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                    {/* User growth */}
                    <Card>
                        <CardHeader><CardTitle>User Acquisition — Last 6 Months</CardTitle></CardHeader>
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
                                        <Line type="monotone" dataKey="users" name="New Users" stroke="#6366f1" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top campaigns */}
                    <Card>
                        <CardHeader><CardTitle>Top Campaigns by Views</CardTitle></CardHeader>
                        <CardContent>
                            {top_campaigns.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">No campaign view data yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {top_campaigns.map((c, i) => (
                                        <div key={c.id} className="flex items-center justify-between gap-2">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">{i + 1}</span>
                                                <span className="truncate text-sm">{c.title}</span>
                                                <Badge variant="outline" className="flex-shrink-0 capitalize text-xs">{c.type}</Badge>
                                            </div>
                                            <span className="flex-shrink-0 text-sm font-medium">{Number(c.total_views).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
