import { Head, Link } from '@inertiajs/react';
import { Ban, TrendingUp, UserCheck, Users, UserX, Zap } from 'lucide-react';
import Heading from '@/components/heading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';

interface Stats {
    total_users: number;
    total_brands: number;
    total_creators: number;
    suspended_users: number;
    banned_users: number;
    new_users_today: number;
    new_users_this_week: number;
}

export default function AdminDashboard({ stats }: { stats: Stats }) {
    return (
        <>
            <Head title="Admin Dashboard" />

            <div className="space-y-6 p-6">
                <Heading
                    title="Admin Dashboard"
                    description="Platform overview and management"
                />

                {/* Stats grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Users"
                        value={stats.total_users}
                        icon={
                            <Users className="size-4 text-muted-foreground" />
                        }
                        description="All registered accounts"
                    />
                    <StatCard
                        title="Brands"
                        value={stats.total_brands}
                        icon={<Zap className="size-4 text-orange-500" />}
                        description="Registered brand accounts"
                        accent="orange"
                    />
                    <StatCard
                        title="Creators"
                        value={stats.total_creators}
                        icon={<UserCheck className="size-4 text-blue-500" />}
                        description="Registered creator accounts"
                        accent="blue"
                    />
                    <StatCard
                        title="New This Week"
                        value={stats.new_users_this_week}
                        icon={<TrendingUp className="size-4 text-green-500" />}
                        description={`${stats.new_users_today} joined today`}
                        accent="green"
                    />
                </div>

                {/* Moderation stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Active Users
                            </CardTitle>
                            <UserCheck className="size-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">
                                {stats.total_users -
                                    stats.suspended_users -
                                    stats.banned_users}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Users in good standing
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Suspended
                            </CardTitle>
                            <UserX className="size-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">
                                {stats.suspended_users}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Temporarily restricted
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Banned
                            </CardTitle>
                            <Ban className="size-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {stats.banned_users}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Permanently removed
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick links */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <QuickLink
                        href={route('admin.users.index')}
                        title="Manage Users"
                        description="View all users, update statuses, inspect profiles"
                        icon={<Users className="size-5 text-orange-500" />}
                    />
                    <QuickLink
                        href={route('admin.settings.edit')}
                        title="Platform Settings"
                        description="Configure fees, payout splits, and referral bonuses"
                        icon={<Zap className="size-5 text-orange-500" />}
                    />
                </div>
            </div>
        </>
    );
}

function StatCard({
    title,
    value,
    icon,
    description,
    accent,
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
    description: string;
    accent?: 'orange' | 'blue' | 'green';
}) {
    const accentClass = {
        orange: 'border-l-4 border-l-orange-500',
        blue: 'border-l-4 border-l-blue-500',
        green: 'border-l-4 border-l-green-500',
    };

    return (
        <Card className={accent ? accentClass[accent] : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{value.toLocaleString()}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}

function QuickLink({
    href,
    title,
    description,
    icon,
}: {
    href: string;
    title: string;
    description: string;
    icon: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="group flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent"
        >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                {icon}
            </div>
            <div>
                <p className="font-semibold text-foreground group-hover:text-orange-500">
                    {title}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    {description}
                </p>
            </div>
        </Link>
    );
}

AdminDashboard.layout = (page: React.ReactNode) => (
    <AdminLayout breadcrumbs={[{ title: 'Admin Dashboard', href: '/admin' }]}>
        {page}
    </AdminLayout>
);
