import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden bg-muted/30 p-6 md:p-10">
            {/* Soft ambient glow so the page isn't a flat, empty field */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
            />

            <div className="relative w-full max-w-sm">
                <div className="flex flex-col gap-6">
                    <Link
                        href={home()}
                        className="flex flex-col items-center gap-2 self-center font-medium"
                    >
                        <AppLogoIcon className="h-16 w-auto" />
                        <span className="sr-only">{title}</span>
                    </Link>

                    <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
                        <div className="flex flex-col gap-6">
                            <div className="space-y-1.5 text-center">
                                <h1 className="text-xl font-semibold tracking-tight">
                                    {title}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    {description}
                                </p>
                            </div>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
