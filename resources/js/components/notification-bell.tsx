import { Link } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AppNotification } from '@/hooks/use-notifications';
import { useNotifications } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';

export function NotificationBell() {
    const {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markRead,
        markAllRead,
    } = useNotifications();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (open) {
            fetchNotifications();
        }
    }, [open, fetchNotifications]);

    const handleSelect = (notification: AppNotification) => {
        if (!notification.read_at) {
            markRead(notification.id);
        }

        setOpen(false);
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full"
                    aria-label={
                        unreadCount > 0
                            ? `Notifications, ${unreadCount} unread`
                            : 'Notifications'
                    }
                >
                    <Bell className="size-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-3 py-2">
                    <DropdownMenuLabel className="p-0 font-semibold">
                        Notifications
                    </DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                markAllRead();
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground"
                        >
                            Mark all read
                        </button>
                    )}
                </div>
                <DropdownMenuSeparator />
                {loading && notifications.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                        Loading…
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                        No notifications yet.
                    </div>
                ) : (
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.map((n) => (
                            <DropdownMenuItem
                                key={n.id}
                                asChild
                                className="cursor-pointer p-0"
                            >
                                <Link
                                    href={n.url ?? '#'}
                                    className={cn(
                                        'flex flex-col items-start gap-0.5 px-3 py-2.5',
                                        !n.read_at && 'bg-accent/50',
                                    )}
                                    onClick={() => handleSelect(n)}
                                >
                                    <span className="text-sm leading-snug">
                                        {n.message}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(
                                            new Date(n.created_at),
                                            { addSuffix: true },
                                        )}
                                    </span>
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
