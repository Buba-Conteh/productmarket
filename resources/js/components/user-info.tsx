import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { BillingState, User } from '@/types';
import { cn } from '@/lib/utils';

const PLAN_LABELS: Record<string, string> = {
    pro: 'Pro',
    starter: 'Starter',
    growth: 'Growth',
    scale: 'Scale',
};

export function UserInfo({
    user,
    showEmail = false,
    billing,
}: {
    user: User;
    showEmail?: boolean;
    billing?: BillingState | null;
}) {
    const getInitials = useInitials();
    const planLabel =
        billing?.subscribed && billing.plan
            ? (PLAN_LABELS[billing.plan] ?? billing.plan)
            : null;

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="flex items-center gap-1.5 truncate font-medium">
                    <span className="truncate">{user.name}</span>
                    {planLabel && (
                        <span
                            className={cn(
                                'inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                                billing?.plan === 'pro' &&
                                    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
                                billing?.plan === 'starter' &&
                                    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
                                billing?.plan === 'growth' &&
                                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                                billing?.plan === 'scale' &&
                                    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                            )}
                        >
                            {planLabel}
                        </span>
                    )}
                </span>
                {showEmail && (
                    <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                    </span>
                )}
            </div>
        </>
    );
}
