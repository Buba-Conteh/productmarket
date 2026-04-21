import { Head } from '@inertiajs/react';
import { BarChart3, DollarSign, Eye, Megaphone } from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
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

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

interface Props {
    views_over_time: { date: string; views: number; paid_out: number }[];
    campaigns: {
        id: string;
        title: string;
        type: string;
        status: string;
        total_entries: number;
        live_count: number;
        total_paid_out: number;
    }[];
    platform_breakdown: { name: string; total_views: number }[];
    top_creators: { id: string; display_name: string; total_views: number }[];
    summary: {
        total_views: number;
        total_paid_out: number;
        cost_per_thousand_views: number;
        active_campaigns: number;
    };
}

export default function BrandAnalytics({ views_over_time, campaigns, platform_breakdown, top_creators, summary }: Props) {
    return (
        <>
            <Head title="Analytics" />
            <div className="space-y-6 px-4 py-6">
                <Heading title="Analytics" description="Performance across all your campaigns." />

                {/* Summary stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Total Views" value={summary.total_views.toLocaleString()} icon={Eye} accent="primary" />
                    <StatCard label="Total Paid Out" value={`$${summary.total_paid_out.toLocaleString()}`} icon={DollarSign} />
                    <StatCard label="CPM" value={`$${summary.cost_per_thousand_views}`} icon={BarChart3} />
                    <StatCard label="Active Campaigns" value={String(summary.active_campaigns)} icon={Megaphone} />
                </div>

                {/* Views + spend over time */}
                <Card>
                    <CardHeader>
                        <CardTitle>Views & Spend — Last 30 Days</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {views_over_time.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">No data yet. Run campaigns to see analytics.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={views_over_time} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="views" name="Views" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    <Bar yAxisId="right" dataKey="paid_out" name="Paid Out ($)" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                    {/* Platform breakdown */}
                    <Card>
                        <CardHeader><CardTitle>Platform Breakdown</CardTitle></CardHeader>
                        <CardContent>
                            {platform_breakdown.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">No live entries yet.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={platform_breakdown} dataKey="total_views" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                                            {platform_breakdown.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v: number) => v.toLocaleString()} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top creators */}
                    <Card>
                        <CardHeader><CardTitle>Top Creators by Views</CardTitle></CardHeader>
                        <CardContent>
                            {top_creators.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">No creator data yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {top_creators.map((c, i) => (
                                        <div key={c.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">{i + 1}</span>
                                                <span className="text-sm">{c.display_name}</span>
                                            </div>
                                            <span className="text-sm font-medium">{Number(c.total_views).toLocaleString()} views</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Campaign table */}
                <Card>
                    <CardHeader><CardTitle>Campaign Performance</CardTitle></CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="pb-2 font-medium">Campaign</th>
                                        <th className="pb-2 font-medium">Type</th>
                                        <th className="pb-2 font-medium">Status</th>
                                        <th className="pb-2 text-right font-medium">Entries</th>
                                        <th className="pb-2 text-right font-medium">Live</th>
                                        <th className="pb-2 text-right font-medium">Paid Out</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {campaigns.map((c) => (
                                        <tr key={c.id}>
                                            <td className="py-2.5 font-medium">{c.title}</td>
                                            <td className="py-2.5 capitalize">{c.type}</td>
                                            <td className="py-2.5"><Badge variant="outline" className="capitalize">{c.status}</Badge></td>
                                            <td className="py-2.5 text-right">{c.total_entries}</td>
                                            <td className="py-2.5 text-right">{c.live_count}</td>
                                            <td className="py-2.5 text-right">${Number(c.total_paid_out).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {campaigns.length === 0 && (
                                        <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No campaigns yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
