export default function AppLogoIcon({ className }: { className?: string }) {
    return (
        <>
            <img
                src="/logo/vyreio_logo_light.svg"
                alt="Vyreo"
                className={`block dark:hidden ${className ?? ''}`}
            />
            <img
                src="/logo/vyreio_logo_dark.svg"
                alt="Vyreo"
                className={`hidden dark:block ${className ?? ''}`}
            />
        </>
    );
}
