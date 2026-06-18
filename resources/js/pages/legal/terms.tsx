import { Head, Link } from '@inertiajs/react';

const LAST_UPDATED = 'April 29, 2026';

const sections = [
    {
        title: '1. Acceptance of Terms',
        body: `By accessing or using Vyreo (the "Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Platform. These Terms apply to all users, including brands, creators, and visitors.`,
    },
    {
        title: '2. Description of Service',
        body: `Vyreo is a viral content marketing platform that connects brands with creators through three campaign types: Contest (brand selects a winner), Ripple (CPM-based pay-per-view), and Pitch (creator-initiated brand deals). View counts are verified directly through official platform APIs — no self-reporting.`,
    },
    {
        title: '3. Eligibility',
        body: `You must be at least 18 years old to create an account. By registering, you represent that all information you provide is accurate and that you have the legal capacity to enter into these Terms. Brands must be duly organised legal entities or sole traders. Creators must have at least one verified social account before submitting to campaigns.`,
    },
    {
        title: '4. Accounts',
        body: `You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. Notify us immediately at support@vyreo.com if you suspect unauthorised access. We reserve the right to terminate accounts that violate these Terms.`,
    },
    {
        title: '5. Brand Subscriptions & Payments',
        body: `Brands must subscribe to a paid plan (Starter, Growth, or Scale) to create active campaigns. Subscription fees are billed monthly or annually via Stripe and are non-refundable except as required by law. Campaign budgets are held in escrow via Stripe and released only upon payout triggers defined by campaign type. Unused Ripple budgets are refunded to the brand upon campaign closure.`,
    },
    {
        title: '6. Creator Plans & Earnings',
        body: `Creators may use the Platform on a Free plan (up to 2 entries per month) or upgrade to Creator Pro for unlimited entries and additional features. A flat 15% platform fee is deducted from every payout regardless of plan. Earnings are transferred via Stripe Connect to the creator's linked bank account or debit card. A minimum payout threshold may apply. The platform fee rate is snapshotted at campaign creation and does not change for the life of that campaign.`,
    },
    {
        title: '7. Campaign Rules',
        body: `Brands are responsible for the legality and accuracy of their campaign briefs. Campaigns must not promote illegal products, hate speech, or misleading claims. Vyreo reserves the right to reject, pause, or remove any campaign at its discretion. Escrow funds are collected before a campaign goes live and may only be refunded in the circumstances described in these Terms.`,
    },
    {
        title: '8. Content & Intellectual Property',
        body: `Creators retain ownership of content they produce. By submitting content through the Platform, creators grant Vyreo and the sponsoring brand a non-exclusive, royalty-free licence to display and promote that content in connection with the campaign. Brands retain ownership of their campaign briefs, logos, and brand assets. Neither party may use the other's content outside the scope of the campaign without express written consent.`,
    },
    {
        title: '9. Prohibited Conduct',
        body: `You may not: (a) submit fraudulent or artificially inflated view counts; (b) use bots, scripts, or automation to interact with the Platform; (c) reverse-engineer any part of the Platform; (d) use the Platform to spam, harass, or deceive other users; (e) violate any applicable law or third-party terms, including the terms of TikTok, Instagram, or YouTube.`,
    },
    {
        title: '10. View Count Verification',
        body: `View counts are pulled automatically from official platform APIs (TikTok, Instagram, YouTube) every six hours. Creators acknowledge that API data is authoritative for payout calculations. Vyreo is not responsible for delays or discrepancies caused by third-party API outages. Disputes must be raised within 14 days of the relevant payout event.`,
    },
    {
        title: '11. Dispute Resolution',
        body: `In the event of a dispute between a brand and a creator, both parties agree to first attempt resolution through the Platform's messaging system. If unresolved within 7 days, either party may escalate to Vyreo's support team. Vyreo's decision on platform-level disputes (e.g., fraudulent views, brief violations) is final and binding. Legal disputes shall be governed by the laws of the jurisdiction in which Vyreo is incorporated.`,
    },
    {
        title: '12. Limitation of Liability',
        body: `To the fullest extent permitted by law, Vyreo shall not be liable for indirect, incidental, special, or consequential damages arising from your use of the Platform. Our total liability to you for any claim shall not exceed the fees you paid to us in the 3 months preceding the claim.`,
    },
    {
        title: '13. Indemnification',
        body: `You agree to indemnify and hold harmless Vyreo, its officers, employees, and partners from any claims, damages, or expenses (including legal fees) arising from your use of the Platform, your content, or your violation of these Terms.`,
    },
    {
        title: '14. Changes to Terms',
        body: `We may update these Terms from time to time. We will notify you of material changes by email or via an in-app notice at least 14 days before the changes take effect. Continued use of the Platform after that date constitutes acceptance of the updated Terms.`,
    },
    {
        title: '15. Contact',
        body: `Questions about these Terms? Email us at legal@vyreo.com or write to: Vyreo Legal, [Company Address].`,
    },
];

export default function Terms() {
    return (
        <>
            <Head title="Terms of Service — Vyreo" />

            <div className="min-h-screen bg-white text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-50">
                {/* Navbar */}
                <header className="sticky inset-x-0 top-0 z-50 border-b border-gray-200/60 bg-white/80 backdrop-blur-md dark:border-gray-800/60 dark:bg-gray-950/80">
                    <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
                        <Link href="/" className="flex items-center gap-2">
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
                        </Link>
                        <Link
                            href="/privacy"
                            className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
                        >
                            Privacy Policy
                        </Link>
                    </div>
                </header>

                {/* Content */}
                <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
                    <div className="mb-12">
                        <h1 className="mb-3 text-4xl font-bold tracking-tight">
                            Terms of Service
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Last updated: {LAST_UPDATED}
                        </p>
                        <p className="mt-4 leading-relaxed text-gray-600 dark:text-gray-300">
                            Please read these Terms of Service carefully before
                            using Vyreo. By creating an account or using
                            any part of the Platform you agree to be bound by
                            these Terms.
                        </p>
                    </div>

                    <div className="space-y-10">
                        {sections.map((section) => (
                            <section key={section.title}>
                                <h2 className="mb-3 text-xl font-semibold">
                                    {section.title}
                                </h2>
                                <p className="leading-relaxed text-gray-600 dark:text-gray-300">
                                    {section.body}
                                </p>
                            </section>
                        ))}
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-16 border-t border-gray-200 py-10 dark:border-gray-800">
                    <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
                        <p className="text-xs text-gray-500">
                            © {new Date().getFullYear()} Vyreo. All
                            rights reserved.
                        </p>
                        <div className="flex gap-6 text-xs text-gray-500">
                            <Link
                                href="/terms"
                                className="hover:text-gray-900 dark:hover:text-gray-200"
                            >
                                Terms of Service
                            </Link>
                            <Link
                                href="/privacy"
                                className="hover:text-gray-900 dark:hover:text-gray-200"
                            >
                                Privacy Policy
                            </Link>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
