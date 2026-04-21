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
import { useNotifications } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';

export function NotificationBell() {
    const { notifications, unreadCount, loading, fetchNotifications, markAllRead } = useNotifications();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (open) {
            fetchNotifications();
        }
    }, [open, fetchNotifications]);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="group relative h-9 w-9">
                    <Bell className="!size-5 opacity-80 group-hover:opacity-100" />
                    {unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-3 py-2">
                    <DropdownMenuLabel className="p-0 font-semibold">Notifications</DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                markAllRead();
                            }}
                            className="text-muted-foreground hover:text-foreground text-xs"
                        >
                            Mark all read
                        </button>
                    )}
                </div>
                <DropdownMenuSeparator />
                {loading ? (
                    <div className="text-muted-foreground py-6 text-center text-sm">Loading…</div>
                ) : notifications.length === 0 ? (
                    <div className="text-muted-foreground py-6 text-center text-sm">No notifications yet.</div>
                ) : (
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.map((n) => (
                            <DropdownMenuItem key={n.id} asChild className="cursor-pointer p-0">
                                <Link
                                    href={n.url ?? '#'}
                                    className={cn(
                                        'flex flex-col items-start gap-0.5 px-3 py-2.5',
                                        !n.read_at && 'bg-accent/50',
                                    )}
                                    onClick={() => setOpen(false)}
                                >
                                    <span className="text-sm leading-snug">{n.message}</span>
                                    <span className="text-muted-foreground text-xs">
                                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
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
