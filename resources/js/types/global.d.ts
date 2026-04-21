import type { route as routeFn } from 'ziggy-js';
import type { Auth } from '@/types/auth';

declare global {
    const route: typeof routeFn;
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            unreadNotifications: number;
            flash: {
                success?: string | null;
                error?: string | null;
            };
            [key: string]: unknown;
        };
    }
}

export type SharedData = {
    auth: Auth;
    unreadNotifications: number;
    flash: { success?: string | null; error?: string | null };
    [key: string]: unknown;
};
