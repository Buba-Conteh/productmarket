import { usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

type Flash = { success?: string; error?: string };

/**
 * Renders the `success` / `error` flash bag. Reads straight from the page props
 * so a page only has to drop `<FlashAlert />` in rather than re-deriving the
 * flash shape and re-styling the banner each time.
 */
export function FlashAlert({ className }: { className?: string }) {
    const flash = (usePage().props as { flash?: Flash }).flash;

    if (!flash?.success && !flash?.error) {
        return null;
    }

    return (
        <div className={className ?? 'mb-5 space-y-2'}>
            {flash.success && (
                <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-500/20 ring-inset dark:text-emerald-400">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                    {flash.success}
                </div>
            )}
            {flash.error && (
                <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-500/20 ring-inset dark:text-rose-400">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    {flash.error}
                </div>
            )}
        </div>
    );
}
