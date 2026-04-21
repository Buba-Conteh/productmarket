import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/30">
                <AppLogoIcon className="size-5" />
            </div>
            <div className="ml-1 grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold tracking-tight">
                    ProductMarket
                </span>
                <span className="truncate text-[11px] text-muted-foreground">
                    Viral content platform
                </span>
            </div>
        </>
    );
}
