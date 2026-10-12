import { Head, router } from '@inertiajs/react';
import { RotateCw, Wallet } from 'lucide-react';
import { useState } from 'react';
import { StatCard } from '@/components/dashboard/stat-card';
import Heading from '@/components/heading';
import { FlashAlert } from '@/components/shared/flash-alert';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import { formatUsd } from '@/lib/format';
import { index as payoutsIndex, retry } from '@/routes/admin/payouts';

type Filter =
    | 'attention'
    | 'failed'
    | 'awaiting_account'
    | 'pending'
    | 'paid'
    | 'all';

type AdminPayout = {
    id: string;
    creator_name: string;
    creator_email: string | null;
    account_status: 'pending' | 'active' | 'restricted' | 'not_connected';
    campaign_title: string;
    payout_type: string;
    gross_amount: string;
    net_amount: string;
    status: 'pending' | 'processing' | 'paid' | 'failed';
    failure_reason: string | null;
    retry_count: number;
    created_at: string;
    can_retry: boolean;
};

type Paginator = {
    data: AdminPayout[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    payouts: Paginator;
    filter: Filter;
    totals: {
        failed: string;
        awaiting_account: string;
        pending: string;
        paid: string;
    };
};

const FILTER_LABELS: Record<Filter, string> = {
    attention: 'Needs attention',
    failed: 'Failed',
    awaiting_account: 'Awaiting account',
    pending: 'Pending',
    paid: 'Paid',
    all: 'All',
};

const ACCOUNT_LABELS: Record<AdminPayout['account_status'], string> = {
    active: 'Active',
    pending: 'Setup unfinished',
    restricted: 'Restricted',
    not_connected: 'Not connected',
};

const STATUS_CLASSES: Record<AdminPayout['status'], string> = {
    paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    pending:
        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    processing:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function FilterTabs({ active }: { active: Filter }) {
    return (
        <div className="flex flex-wrap gap-1">
            {(Object.keys(FILTER_LABELS) as Filter[]).map((filter) => (
                <Button
                    key={filter}
                    size="sm"
                    variant={filter === active ? 'default' : 'ghost'}
                    onClick={() =>
                        router.visit(payoutsIndex.url({ query: { filter } }), {
                            preserveScroll: true,
                        })
                    }
                >
                    {FILTER_LABELS[filter]}
                </Button>
            ))}
        </div>
    );
}

function RetryButton({ payoutId }: { payoutId: string }) {
    const [loading, setLoading] = useState(false);

    return (
        <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={loading}
            onClick={() => {
                setLoading(true);
                router.post(
                    retry.url(payoutId),
                    {},
                    {
                        preserveScroll: true,
                        onFinish: () => setLoading(false),
                    },
                );
            }}
        >
            <RotateCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Retry
        </Button>
    );
}

function PayoutRow({ payout }: { payout: AdminPayout }) {
    return (
        <TableRow>
            <TableCell>
                <div className="font-medium">{payout.creator_name}</div>
                <div className="text-xs text-muted-foreground">
                    {payout.creator_email}
                </div>
            </TableCell>
            <TableCell className="text-sm">
                {ACCOUNT_LABELS[payout.account_status]}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
                {payout.campaign_title}
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
                {formatUsd(payout.net_amount)}
            </TableCell>
            <TableCell>
                <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_CLASSES[payout.status]}`}
                >
                    {payout.status}
                </span>
                {payout.failure_reason && (
                    <div className="mt-1 max-w-xs text-xs text-muted-foreground">
                        {payout.failure_reason}
                    </div>
                )}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
                {new Date(payout.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
                {payout.can_retry && <RetryButton payoutId={payout.id} />}
            </TableCell>
        </TableRow>
    );
}

export default function AdminPayoutsIndex({ payouts, filter, totals }: Props) {
    return (
        <>
            <Head title="Payouts — Admin" />

            <div className="space-y-6 p-6">
                <Heading
                    title="Creator Payouts"
                    description="Net amounts owed to creators. Payouts waiting on a payout account are sent automatically once the creator connects Stripe."
                />

                <FlashAlert className="space-y-2" />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Failed"
                        value={formatUsd(totals.failed)}
                        icon={Wallet}
                    />
                    <StatCard
                        label="Awaiting creator account"
                        value={formatUsd(totals.awaiting_account)}
                        icon={Wallet}
                    />
                    <StatCard
                        label="Pending (all)"
                        value={formatUsd(totals.pending)}
                        icon={Wallet}
                    />
                    <StatCard
                        label="Paid"
                        value={formatUsd(totals.paid)}
                        icon={Wallet}
                        accent="primary"
                    />
                </div>

                <FilterTabs active={filter} />

                <div className="overflow-x-auto rounded-xl border border-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Creator</TableHead>
                                <TableHead>Payout account</TableHead>
                                <TableHead>Campaign</TableHead>
                                <TableHead className="text-right">
                                    Net
                                </TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payouts.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="py-12 text-center text-muted-foreground"
                                    >
                                        No payouts in this view.
                                    </TableCell>
                                </TableRow>
                            )}
                            {payouts.data.map((payout) => (
                                <PayoutRow key={payout.id} payout={payout} />
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {payouts.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            Showing {payouts.from}–{payouts.to} of{' '}
                            {payouts.total}
                        </span>
                        <div className="flex gap-1">
                            {payouts.links.map((link, i) => (
                                <Button
                                    key={i}
                                    variant={link.active ? 'default' : 'ghost'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url && router.visit(link.url)
                                    }
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

AdminPayoutsIndex.layout = (page: React.ReactNode) => (
    <AdminLayout
        breadcrumbs={[
            { title: 'Admin Dashboard', href: '/admin' },
            { title: 'Payouts', href: '/admin/payouts' },
        ]}
    >
        {page}
    </AdminLayout>
);
