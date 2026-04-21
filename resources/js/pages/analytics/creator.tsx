import { Head } from '@inertiajs/react';
import { BarChart3, DollarSign, Eye, FileVideo } from 'lucide-react';
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
import Heading from '@/components/heading';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    weekly_snapshots: { week: string; views: number; earned: number; entries: number; engagement: number }[];
    entry_views: { id: string; campaign_title: string; total_views: number }[];
    earnings_per_campaign: { title: string; total_earned: number }[];
    summary: {
        total_views: number;
        total_earned: number;
        pending_earnings: number;
        total_entries: number;
    };
}

export default function CreatorAnalytics({ weekly_snapshots, entry_views, earnings_per_campaign, summary }: Props) {
    return (
        <>
            <Head title="My Analytics" />
            <div className="space-y-6 px-4 py-6">
                <Heading title="My Analytics" description="Your views, earnings, and performance over time." />

                {/* Summary */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Total Views" value={summary.total_views.toLocaleString()} icon={Eye} accent="primary" />
                    <StatCard label="Total Earned" value={`$${summary.total_earned.toLocaleString()}`} icon={DollarSign} />
                    <StatCard label="Pending" value={`$${summary.pending_earnings.toLocaleString()}`} icon={BarChart3} />
                    <StatCard label="Entries" value={String(summary.total_entries)} icon={FileVideo} />
                </div>

                {/* Views trend */}
                <Card>
                    <CardHeader><CardTitle>Views — Last 12 Weeks</CardTitle></CardHeader>
                    <CardContent>
                        {weekly_snapshots.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">No data yet. Get some entries live to track views.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={240}>
                                <LineChart data={weekly_snapshots} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="views" name="Views" stroke="#6366f1" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                    {/* Earnings per campaign */}
                    <Card>
                        <CardHeader><CardTitle>Earnings by Campaign</CardTitle></CardHeader>
                        <CardContent>
                            {earnings_per_campaign.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">No paid earnings yet.</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={earnings_per_campaign} layout="vertical" margin={{ left: 8, right: 16 }}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                        <XAxis type="number" tick={{ fontSize: 11 }} />
                                        <YAxis dataKey="title" type="category" tick={{ fontSize: 11 }} width={110} />
                                        <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                                        <Bar dataKey="total_earned" name="Earned ($)" fill="#6366f1" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top entries by views */}
                    <Card>
                        <CardHeader><CardTitle>Top Entries by Views</CardTitle></CardHeader>
                        <CardContent>
                            {entry_views.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">No live entries yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {entry_views.map((e, i) => (
                                        <div key={e.id} className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">{i + 1}</span>
                                                <span className="truncate text-sm">{e.campaign_title}</span>
                                            </div>
                                            <span className="flex-shrink-0 text-sm font-medium">{Number(e.total_views).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Weekly earnings trend */}
                <Card>
                    <CardHeader><CardTitle>Weekly Earnings</CardTitle></CardHeader>
                    <CardContent>
                        {weekly_snapshots.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={weekly_snapshots} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                                    <Bar dataKey="earned" name="Earned ($)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
