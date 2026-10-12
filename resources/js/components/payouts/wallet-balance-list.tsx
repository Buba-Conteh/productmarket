import { formatUsd } from '@/lib/format';
import type { WalletSummary } from '@/types/payouts';

type Props = {
    wallet: WalletSummary;
};

/** Compact list of the creator's wallet figures — same numbers as the Wallet page. */
export function WalletBalanceList({ wallet }: Props) {
    const rows = [
        { label: 'Total paid out', value: wallet.total_earned },
        { label: 'Pending', value: wallet.pending_earnings },
        ...(Number(wallet.awaiting_account) > 0
            ? [
                  {
                      label: 'Waiting for payout account',
                      value: wallet.awaiting_account,
                  },
              ]
            : []),
    ];

    return (
        <dl className="divide-y rounded-xl border">
            {rows.map((row) => (
                <div
                    key={row.label}
                    className="flex items-center justify-between px-5 py-3 text-sm"
                >
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="font-medium tabular-nums">
                        {formatUsd(row.value)}
                    </dd>
                </div>
            ))}
        </dl>
    );
}
