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
            flash: {
                success?: string | null;
                error?: string | null;
            };
            [key: string]: unknown;
        };
    }
}
