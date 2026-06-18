export default function AppLogo() {
    return (
        <>
            <img
                src="/logo/vyreio_logo_light.svg"
                alt="Vyreo"
                className="h-10 w-auto dark:hidden"
            />
            <img
                src="/logo/vyreio_logo_dark.svg"
                alt="Vyreo"
                className="hidden h-10 w-auto dark:block"
            />
        </>
    );
}
