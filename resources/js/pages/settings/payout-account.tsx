import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { PayoutAccountCard } from '@/components/payouts/payout-account-card';
import { WalletBalanceList } from '@/components/payouts/wallet-balance-list';
import { FlashAlert } from '@/components/shared/flash-alert';
import type { PayoutAccountStatus, WalletSummary } from '@/types/payouts';

type Props = {
    account: {
        connected: boolean;
        status: PayoutAccountStatus | null;
        country: string | null;
    };
    wallet: WalletSummary;
};

export default function PayoutAccount({ account, wallet }: Props) {
    return (
        <>
            <Head title="Payout account" />

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Payout account"
                    description="Where your campaign earnings are sent. Payouts go through Stripe Connect — you don't need to save a card on ProductMarket."
                />

                <FlashAlert className="space-y-2" />

                <PayoutAccountCard
                    connected={account.connected}
                    status={account.status}
                    country={account.country}
                />

                <div className="space-y-3">
                    <Heading
                        variant="small"
                        title="Balance"
                        description="Net of the 15% platform fee. Matches your Wallet."
                    />
                    <WalletBalanceList wallet={wallet} />
                </div>
            </div>
        </>
    );
}

PayoutAccount.layout = {
    breadcrumbs: [
        {
            title: 'Payout account',
            href: '/settings/payout-account',
        },
    ],
};
