import { Link } from '@inertiajs/react';
import { ArrowRight, Menu } from 'lucide-react';
import { useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { dashboard, login, register } from '@/routes';

const NAV_LINKS = [
    { href: '#how-it-works', label: 'How it works' },
    { href: '#for-brands', label: 'For brands' },
    { href: '#for-creators', label: 'For creators' },
    { href: '#pricing', label: 'Pricing' },
];

const primaryButton =
    'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4';

function Logo() {
    return (
        <div className="flex min-w-0 shrink items-center">
            <img
                src="/logo/trendko_logo_light.svg"
                alt="Trendko"
                width={220}
                height={96}
                className="h-16 w-auto max-w-[150px] object-contain object-left sm:h-24 sm:max-w-none dark:hidden"
            />
            <img
                src="/logo/trendko_logo_dark.svg"
                alt="Trendko"
                width={220}
                height={96}
                className="hidden h-16 w-auto max-w-[150px] object-contain object-left sm:h-24 sm:max-w-none dark:block"
            />
        </div>
    );
}

function MobileMenu({
    isAuthenticated,
    canRegister,
}: {
    isAuthenticated: boolean;
    canRegister: boolean;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <button
                    type="button"
                    aria-label="Open menu"
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 md:hidden dark:text-gray-300 dark:hover:bg-gray-800"
                >
                    <Menu className="size-5" />
                </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
                <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 px-4">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            onClick={() => setOpen(false)}
                            className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            {link.label}
                        </a>
                    ))}
                    {!isAuthenticated && (
                        <Link
                            href={login()}
                            className="mt-2 rounded-lg border border-gray-200 px-3 py-2.5 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Log in
                        </Link>
                    )}
                    {!isAuthenticated && canRegister && (
                        <Link
                            href={register()}
                            className="rounded-lg bg-gray-900 px-3 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-gray-700 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-white"
                        >
                            Get started
                        </Link>
                    )}
                </nav>
            </SheetContent>
        </Sheet>
    );
}

export function WelcomeNavbar({
    isAuthenticated,
    canRegister,
}: {
    isAuthenticated: boolean;
    canRegister: boolean;
}) {
    return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-200/60 bg-white/80 backdrop-blur-md dark:border-gray-800/60 dark:bg-gray-950/80">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 overflow-hidden px-4 sm:px-6 lg:px-8">
                <Logo />

                {/* Desktop nav */}
                <nav className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex dark:text-gray-400">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="transition-colors hover:text-gray-900 dark:hover:text-gray-50"
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                {/* CTA buttons */}
                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    {isAuthenticated ? (
                        <Link
                            href={dashboard()}
                            className={`${primaryButton} bg-orange-500 text-white hover:bg-orange-600`}
                        >
                            Dashboard
                            <ArrowRight className="size-3.5" />
                        </Link>
                    ) : (
                        <>
                            <Link
                                href={login()}
                                className="hidden text-sm font-medium whitespace-nowrap text-gray-600 transition-colors hover:text-gray-900 sm:inline dark:text-gray-400 dark:hover:text-gray-50"
                            >
                                Log in
                            </Link>
                            {canRegister && (
                                <Link
                                    href={register()}
                                    className={`${primaryButton} bg-gray-900 text-white hover:bg-gray-700 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-white`}
                                >
                                    Get started
                                    <ArrowRight className="hidden size-3.5 sm:block" />
                                </Link>
                            )}
                        </>
                    )}
                    <MobileMenu
                        isAuthenticated={isAuthenticated}
                        canRegister={canRegister}
                    />
                </div>
            </div>
        </header>
    );
}
