export default function AppLogoIcon({ className }: { className?: string }) {
    return (
        <>
            <img
                src="/logo/trendko_logo_light.svg"
                alt="Trendko"
                className={`block dark:hidden ${className ?? ''}`}
            />
            <img
                src="/logo/trendko_logo_dark.svg"
                alt="Trendko"
                className={`hidden dark:block ${className ?? ''}`}
            />
        </>
    );
}
