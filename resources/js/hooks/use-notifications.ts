import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import type { SharedData } from '@/types/global';

export interface AppNotification {
    id: string;
    type: string;
    message: string;
    url: string | null;
    read_at: string | null;
    created_at: string;
}

export function useNotifications() {
    const { auth, unreadNotifications: initialUnread } = usePage<SharedData>().props;
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(initialUnread ?? 0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);

        try {
            const res = await fetch('/notifications', {
                headers: { Accept: 'application/json' },
            });
            const data = await res.json();
            setNotifications(data.notifications ?? []);
            setUnreadCount(data.unread_count ?? 0);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const echo = (window as any).Echo;

        if (!echo || !auth?.user?.id) {
return;
}

        const channel = echo.private(`notifications.${auth.user.id}`);
        channel.listen('.notification.created', (event: { data: AppNotification }) => {
            setNotifications((prev) => [event.data, ...prev]);
            setUnreadCount((prev) => prev + 1);
        });

        return () => {
            echo.leave(`notifications.${auth.user.id}`);
        };
    }, [auth?.user?.id]);

    const markAllRead = async () => {
        await fetch('/notifications/read-all', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
            },
        });
        setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
        setUnreadCount(0);
    };

    return { notifications, unreadCount, loading, fetchNotifications, markAllRead };
}
