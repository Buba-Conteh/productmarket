import { Link } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { formatUsd } from '@/lib/format';
import { edit as payoutAccountEdit } from '@/routes/settings/payout-account';
import type { PayoutAccountStatus } from '@/types/payouts';

type Props = {
    status: PayoutAccountStatus | null;
    /** Earnings held until the account is active (net, USD). */
    awaitingAmount?: string;
};

/**
 * Warns a creator that their payout account is missing or not yet active,
 * and links to the payout account settings page to fix it.
 */
export function PayoutAccountBanner({ status, awaitingAmount }: Props) {
    if (status === 'active') {
        return null;
    }

    const held = Number(awaitingAmount ?? 0);
    const heldText =
        held > 0 ? ` ${formatUsd(held)} is waiting to be sent to you.` : '';

    const message =
        status === 'restricted'
            ? 'Your Stripe payout account needs more information before it can receive transfers.'
            : status === 'pending'
              ? 'Your payout account setup is not finished yet.'
              : 'Connect a payout account to receive your earnings.';

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-3.5 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-yellow-900/50 dark:bg-yellow-950/30">
            <div className="flex items-start gap-2.5 text-yellow-800 dark:text-yellow-300">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>
                    {message}
                    {heldText}
                </span>
            </div>
            <Link
                href={payoutAccountEdit.url()}
                className="shrink-0 font-medium text-yellow-900 underline-offset-2 hover:underline dark:text-yellow-200"
            >
                {status === null ? 'Set up payouts →' : 'Finish setup →'}
            </Link>
        </div>
    );
}
