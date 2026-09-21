import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { SharedData } from '@/types/global';

export interface AppNotification {
    id: string;
    type: string;
    message: string;
    url: string | null;
    read_at: string | null;
    created_at: string;
}

const csrfToken = (): string =>
    (
        document.querySelector(
            'meta[name="csrf-token"]',
        ) as HTMLMetaElement | null
    )?.content ?? '';

const post = (url: string): Promise<Response> =>
    fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
        },
    });

export function useNotifications() {
    const { auth, unreadNotifications: initialUnread } =
        usePage<SharedData>().props;
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(initialUnread ?? 0);
    const [loading, setLoading] = useState(false);

    // The layout persists across Inertia visits, so re-sync the badge from
    // the server-provided count whenever a new page load reports it.
    useEffect(() => {
        setUnreadCount(initialUnread ?? 0);
    }, [initialUnread]);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);

        try {
            const res = await fetch('/notifications', {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!res.ok) {
                return;
            }

            const data = await res.json();
            setNotifications(data.notifications ?? []);
            setUnreadCount(data.unread_count ?? 0);
        } catch {
            // Leave existing state untouched on network failure.
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const echo = (window as any).Echo;
        const userId = auth?.user?.id;

        if (!echo || !userId) {
            return;
        }

        const channelName = `notifications.${userId}`;

        echo.private(channelName).listen(
            '.notification.created',
            (event: AppNotification) => {
                setNotifications((prev) =>
                    prev.some((n) => n.id === event.id)
                        ? prev
                        : [event, ...prev],
                );
                setUnreadCount((prev) => prev + 1);
                toast(event.message);
            },
        );

        return () => {
            echo.leave(channelName);
        };
    }, [auth?.user?.id]);

    const markRead = useCallback(async (id: string) => {
        let alreadyRead = false;

        setNotifications((prev) => {
            alreadyRead = prev.some((n) => n.id === id && n.read_at !== null);

            return prev.map((n) =>
                n.id === id && n.read_at === null
                    ? { ...n, read_at: new Date().toISOString() }
                    : n,
            );
        });

        if (alreadyRead) {
            return;
        }

        setUnreadCount((prev) => Math.max(0, prev - 1));

        try {
            await post(`/notifications/${id}/read`);
        } catch {
            // Best effort — the server count re-syncs on the next page load.
        }
    }, []);

    const markAllRead = useCallback(async () => {
        setNotifications((prev) =>
            prev.map((n) => ({
                ...n,
                read_at: n.read_at ?? new Date().toISOString(),
            })),
        );
        setUnreadCount(0);

        try {
            await post('/notifications/read-all');
        } catch {
            // Best effort — the server count re-syncs on the next page load.
        }
    }, []);

    return {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markRead,
        markAllRead,
    };
}
