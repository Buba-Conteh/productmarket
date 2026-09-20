export default function AppLogo() {
    return (
        <>
            <img
                src="/logo/trendko_logo_light.svg"
                alt="Trendko"
                className="h-12 w-auto dark:hidden"
            />
            <img
                src="/logo/trendko_logo_dark.svg"
                alt="Trendko"
                className="hidden h-12 w-auto dark:block"
            />
        </>
    );
}
