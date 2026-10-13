import { router } from '@inertiajs/react';
import {
    AlertTriangle,
    Banknote,
    CheckCircle2,
    ExternalLink,
    Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { CountrySelect } from '@/components/shared/country-select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { countryName } from '@/lib/countries';
import {
    connect as connectAccount,
    dashboard as openDashboard,
} from '@/routes/settings/payout-account';
import type { PayoutAccountStatus } from '@/types/payouts';

type Props = {
    connected: boolean;
    status: PayoutAccountStatus | null;
    /** Creator's ISO country code; null when they never set one. */
    country: string | null;
};

function useStripeRedirect() {
    const [loading, setLoading] = useState(false);

    function go(url: string, data: Record<string, string> = {}) {
        setLoading(true);
        router.post(url, data, { onFinish: () => setLoading(false) });
    }

    return { loading, go };
}

const STATE_COPY: Record<
    'none' | PayoutAccountStatus,
    { title: string; body: string; action: string }
> = {
    none: {
        title: 'No payout account connected',
        body: 'Connect the bank account you want to be paid into through Stripe Express. Payouts arrive in your local currency. Stripe handles identity checks — we never see your banking details.',
        action: 'Set up payouts with Stripe',
    },
    pending: {
        title: 'Setup not finished',
        body: 'You started setting up payouts but Stripe still needs a few details. Continue where you left off.',
        action: 'Continue Stripe setup',
    },
    restricted: {
        title: 'Stripe needs more information',
        body: 'Your account was created but Stripe cannot send transfers yet. Update your details to start receiving earnings.',
        action: 'Update details on Stripe',
    },
    active: {
        title: 'Payouts active',
        body: 'Your Stripe account is verified. Earnings are sent automatically once a payout is released.',
        action: 'Manage bank account',
    },
};

/** Shows the creator's payout account state with the one action that moves it forward. */
export function PayoutAccountCard({ connected, status, country }: Props) {
    const { loading, go } = useStripeRedirect();
    const [selectedCountry, setSelectedCountry] = useState('');
    const needsCountry = !country;
    const state = connected && status ? status : 'none';
    const copy = STATE_COPY[state];
    const isActive = state === 'active';

    const Icon = isActive
        ? CheckCircle2
        : state === 'none'
          ? Banknote
          : AlertTriangle;

    return (
        <div className="space-y-4 rounded-xl border p-5">
            <div className="flex items-start gap-3">
                <Icon
                    className={
                        isActive
                            ? 'mt-0.5 size-5 shrink-0 text-green-600 dark:text-green-400'
                            : state === 'none'
                              ? 'mt-0.5 size-5 shrink-0 text-muted-foreground'
                              : 'mt-0.5 size-5 shrink-0 text-yellow-600 dark:text-yellow-400'
                    }
                />
                <div className="space-y-1">
                    <p className="text-sm font-medium">{copy.title}</p>
                    <p className="text-sm text-muted-foreground">{copy.body}</p>
                    {country && (
                        <p className="text-xs text-muted-foreground">
                            Payout country: {countryName(country)}
                        </p>
                    )}
                </div>
            </div>

            {needsCountry && (
                <div className="space-y-2">
                    <Label htmlFor="payout-country">
                        Country of your bank account
                    </Label>
                    <CountrySelect
                        id="payout-country"
                        value={selectedCountry}
                        onChange={setSelectedCountry}
                        clearable={false}
                    />
                </div>
            )}

            <Button
                variant={isActive ? 'outline' : 'default'}
                disabled={loading || (needsCountry && !selectedCountry)}
                className="w-full gap-2 sm:w-auto"
                onClick={() =>
                    isActive
                        ? go(openDashboard.url())
                        : go(
                              connectAccount.url(),
                              needsCountry ? { country: selectedCountry } : {},
                          )
                }
            >
                {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                ) : (
                    <ExternalLink className="size-4" />
                )}
                {loading ? 'Redirecting to Stripe…' : copy.action}
            </Button>
        </div>
    );
}
