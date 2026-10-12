export type PayoutAccountStatus = 'pending' | 'active' | 'restricted';

/** Wallet figures computed server-side from the creator's payout rows. */
export type WalletSummary = {
    total_earned: string;
    pending_earnings: string;
    awaiting_account: string;
    failed_amount: string;
    paid_count: number;
    pending_count: number;
};
