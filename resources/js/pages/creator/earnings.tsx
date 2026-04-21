import { Head } from '@inertiajs/react';
import {
    CheckCircle2,
    CircleDashed,
    Clock,
    DollarSign,
    Wallet,
    XCircle,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import Heading from '@/components/heading';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';

type Payout = {
    id: string;
    campaign_title: string;
    campaign_type: 'contest' | 'ripple' | 'pitch' | null;
    payout_type: string;
    gross_amount: string;
    platform_fee: string;
    net_amount: string;
    status: 'pending' | 'processing' | 'paid' | 'failed';
    failure_reason: string | null;
    paid_at: string | null;
    created_at: string;
};

type PaginatedPayouts = {
    data: Payout[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};

type Props = {
    total_earned: string;
    pending_earnings: string;
    paid_count: number;
    stripe_connect_status: 'pending' | 'active' | 'restricted';
    payouts: PaginatedPayouts;
};

const PAYOUT_TYPE_LABELS: Record<string, string> = {
    contest_prize: 'Contest Prize',
    contest_runner_up: 'Runner-up Prize',
    ripple_initial_fee: 'Ripple Initial',
    ripple_milestone: 'Ripple Milestone',
    pitch_payment: 'Pitch Payment',
};

function formatCurrency(value: string | number): string {
    return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatusBadge({ status }: { status: Payout['status'] }) {
    const map: Record<Payout['status'], { label: string; icon: typeof CheckCircle2; className: string }> = {
        paid: { label: 'Paid', icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
        pending: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
        processing: { label: 'Processing', icon: CircleDashed, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
        failed: { label: 'Failed', icon: XCircle, className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    };

    const { label, icon: Icon, className } = map[status];

    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
            <Icon className="size-3" />
            {label}
        </span>
    );
}

function StripeStatusIndicator({ status }: { status: Props['stripe_connect_status'] }) {
    if (status === 'active') {
return null;
}

    return (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-800/40 dark:bg-yellow-900/20 dark:text-yellow-300">
            {status === 'pending'
                ? 'Your Stripe account is pending verification. Payouts will be held until verification is complete.'
                : 'Your Stripe account is restricted. Please update your payout information to receive transfers.'}
        </div>
    );
}

export default function CreatorEarnings({
    total_earned,
    pending_earnings,
    paid_count,
    stripe_connect_status,
    payouts,
}: Props) {
    return (
        <>
            <Head title="Earnings" />

            <div className="space-y-8 p-6">
                <Heading
                    title="Earnings"
                    description="Your payout history and current balance"
                />

                {stripe_connect_status !== 'active' && (
                    <StripeStatusIndicator status={stripe_connect_status} />
                )}

                {/* Stat cards */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <StatCard
                        label="Total Earned"
                        value={formatCurrency(total_earned)}
                        icon={Wallet}
                        accent="primary"
                    />
                    <StatCard
                        label="Pending Payouts"
                        value={formatCurrency(pending_earnings)}
                        icon={Clock}
                    />
                    <StatCard
                        label="Paid Payouts"
                        value={String(paid_count)}
                        icon={DollarSign}
                    />
                </div>

                <Separator />

                {/* Payout history */}
                <div>
                    <Heading
                        variant="small"
                        title="Payout History"
                        description={`${payouts.total} transaction${payouts.total !== 1 ? 's' : ''}`}
                    />

                    {payouts.data.length === 0 ? (
                        <Card className="mt-4">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <Wallet className="mb-3 size-10 text-muted-foreground/40" />
                                <p className="font-medium text-muted-foreground">No payouts yet</p>
                                <p className="mt-1 text-sm text-muted-foreground/70">
                                    Your earnings will appear here once campaigns pay out.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="mt-4 overflow-hidden rounded-xl border">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/40">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Campaign</th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Gross</th>
                                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Fee</th>
                                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Net</th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {payouts.data.map((payout) => (
                                        <tr key={payout.id} className="bg-card hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 font-medium">
                                                {payout.campaign_title}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {PAYOUT_TYPE_LABELS[payout.payout_type] ?? payout.payout_type}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {formatCurrency(payout.gross_amount)}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                                                −{formatCurrency(payout.platform_fee)}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums font-semibold">
                                                {formatCurrency(payout.net_amount)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1">
                                                    <StatusBadge status={payout.status} />
                                                    {payout.status === 'failed' && payout.failure_reason && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {payout.failure_reason}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {payout.paid_at ?? payout.created_at}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination info */}
                            {payouts.last_page > 1 && (
                                <div className="border-t px-4 py-3 text-sm text-muted-foreground">
                                    Page {payouts.current_page} of {payouts.last_page} — {payouts.total} total
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

CreatorEarnings.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Earnings', href: '/wallet' }]}>
        {page}
    </AppLayout>
);
