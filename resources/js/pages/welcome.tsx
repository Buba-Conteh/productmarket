import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    CheckCircle2,
    ChevronRight,
    Eye,
    Megaphone,
    Play,
    Shield,
    Sparkles,
    TrendingUp,
    Trophy,
    Users,
    Zap,
} from 'lucide-react';
import { dashboard, login, register } from '@/routes';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;
    const user = (auth as { user?: { name: string } }).user;

    return (
        <>
            <Head title="ProductMarket — Viral Content Marketing">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700"
                    rel="stylesheet"
                />
            </Head>

            <div
                className="min-h-screen bg-white text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-50"
                style={{ fontFamily: "'Instrument Sans', sans-serif" }}
            >
                {/* ── Navbar ── */}
                <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-200/60 bg-white/80 backdrop-blur-md dark:border-gray-800/60 dark:bg-gray-950/80">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-orange-500">
                                <Sparkles className="size-4 text-white" />
                            </div>
                            <span className="text-lg font-semibold tracking-tight">
                                ProductMarket
                            </span>
                        </div>

                        {/* Desktop nav */}
                        <nav className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex dark:text-gray-400">
                            <a
                                href="#how-it-works"
                                className="transition-colors hover:text-gray-900 dark:hover:text-gray-50"
                            >
                                How it works
                            </a>
                            <a
                                href="#for-brands"
                                className="transition-colors hover:text-gray-900 dark:hover:text-gray-50"
                            >
                                For brands
                            </a>
                            <a
                                href="#for-creators"
                                className="transition-colors hover:text-gray-900 dark:hover:text-gray-50"
                            >
                                For creators
                            </a>
                            <a
                                href="#pricing"
                                className="transition-colors hover:text-gray-900 dark:hover:text-gray-50"
                            >
                                Pricing
                            </a>
                        </nav>

                        {/* CTA buttons */}
                        <div className="flex items-center gap-3">
                            {user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
                                >
                                    Dashboard
                                    <ArrowRight className="size-3.5" />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                                    >
                                        Log in
                                    </Link>
                                    {canRegister && (
                                        <Link
                                            href={register()}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-white"
                                        >
                                            Get started
                                            <ArrowRight className="size-3.5" />
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* ── Hero ── */}
                <section className="relative overflow-hidden bg-gray-950 pt-32 pb-24 text-white">
                    {/* Background grid */}
                    <div
                        className="absolute inset-0 opacity-[0.04]"
                        style={{
                            backgroundImage:
                                'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                            backgroundSize: '60px 60px',
                        }}
                    />
                    {/* Gradient orbs */}
                    <div className="absolute top-20 left-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-orange-500/20 blur-3xl" />
                    <div className="absolute right-1/4 bottom-0 h-80 w-80 translate-x-1/2 rounded-full bg-violet-500/15 blur-3xl" />

                    <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
                        {/* Badge */}
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm text-orange-300">
                            <Sparkles className="size-3.5" />
                            Verified view tracking — not self-reporting
                        </div>

                        {/* Headline */}
                        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
                            Content marketing{' '}
                            <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                                you can trust
                            </span>
                        </h1>

                        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-400 sm:text-xl">
                            Connect brands with creators through Contest,
                            Ripple, and Pitch campaigns. Pay for real,
                            verified views — never take a creator's word for
                            it again.
                        </p>

                        {/* CTA row */}
                        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                            {canRegister && (
                                <Link
                                    href={`${register()}?role=brand`}
                                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-500/30 transition-all hover:bg-orange-600 hover:shadow-orange-500/40"
                                >
                                    Launch a campaign
                                    <ArrowRight className="size-4" />
                                </Link>
                            )}
                            {canRegister && (
                                <Link
                                    href={`${register()}?role=creator`}
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-base font-semibold text-white backdrop-blur transition-all hover:border-white/30 hover:bg-white/10"
                                >
                                    Join as creator
                                    <ChevronRight className="size-4" />
                                </Link>
                            )}
                        </div>

                        {/* Stats row */}
                        <div className="mt-20 grid grid-cols-3 gap-8 border-t border-white/10 pt-12 sm:grid-cols-3">
                            {[
                                { value: '10K+', label: 'Active creators' },
                                {
                                    value: '$2.4M',
                                    label: 'Paid out to creators',
                                },
                                {
                                    value: '99.9%',
                                    label: 'View tracking accuracy',
                                },
                            ].map((s) => (
                                <div key={s.label}>
                                    <div className="text-3xl font-bold text-white sm:text-4xl">
                                        {s.value}
                                    </div>
                                    <div className="mt-1 text-sm text-gray-500">
                                        {s.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Trust bar ── */}
                <div className="border-b border-gray-100 bg-gray-50 py-5 dark:border-gray-800 dark:bg-gray-900">
                    <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                        {[
                            { icon: Shield, text: 'Verified view counts' },
                            { icon: Zap, text: 'Instant milestone payouts' },
                            { icon: Eye, text: 'TikTok · Instagram · YouTube' },
                            {
                                icon: BarChart3,
                                text: 'Real-time campaign analytics',
                            },
                        ].map(({ icon: Icon, text }) => (
                            <div
                                key={text}
                                className="flex items-center gap-2"
                            >
                                <Icon className="size-4 text-orange-500" />
                                {text}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── How it works ── */}
                <section
                    id="how-it-works"
                    className="py-24 dark:bg-gray-950"
                >
                    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-14 text-center">
                            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-orange-500">
                                Campaign types
                            </p>
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Three ways to go viral
                            </h2>
                            <p className="mx-auto mt-4 max-w-xl text-gray-500 dark:text-gray-400">
                                Choose the model that fits your goal — every
                                payout is tied to real, verified performance.
                            </p>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-3">
                            {/* Contest */}
                            <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 transition-shadow hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
                                <div className="mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50">
                                    <Trophy className="size-5 text-amber-500" />
                                </div>
                                <h3 className="mb-2 text-xl font-semibold">
                                    Contest
                                </h3>
                                <p className="mb-5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                                    Open the floor to all creators. They
                                    compete privately — brand picks a winner
                                    who posts publicly. Best organic reach,
                                    zero wasted spend.
                                </p>
                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                    {[
                                        'Winner-takes-most prize pool',
                                        'Optional runner-up prizes',
                                        'Brand controls winner selection',
                                        'Verified view ranking at deadline',
                                    ].map((f) => (
                                        <li
                                            key={f}
                                            className="flex items-center gap-2"
                                        >
                                            <CheckCircle2 className="size-3.5 shrink-0 text-amber-500" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-6 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                                    Best for awareness campaigns
                                </div>
                            </div>

                            {/* Ripple */}
                            <div className="group relative overflow-hidden rounded-2xl border border-orange-200 bg-orange-500 p-8 text-white shadow-xl shadow-orange-500/20">
                                <div className="absolute right-0 bottom-0 size-48 translate-x-12 translate-y-12 rounded-full bg-white/5" />
                                <div className="mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-white/20">
                                    <TrendingUp className="size-5 text-white" />
                                </div>
                                <div className="mb-3 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium">
                                    Most popular
                                </div>
                                <h3 className="mb-2 text-xl font-semibold">
                                    Ripple
                                </h3>
                                <p className="mb-5 text-sm leading-relaxed text-orange-100">
                                    Pay creators an upfront fee, then
                                    milestone bonuses as views accumulate.
                                    The content keeps earning as long as it
                                    keeps performing.
                                </p>
                                <ul className="space-y-2 text-sm text-orange-100">
                                    {[
                                        'Upfront fee on approval',
                                        'Automatic milestone payouts',
                                        'Set budget cap per creator',
                                        'Real-time view sync every 6h',
                                    ].map((f) => (
                                        <li
                                            key={f}
                                            className="flex items-center gap-2"
                                        >
                                            <CheckCircle2 className="size-3.5 shrink-0 text-white" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-6 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                                    Best for performance campaigns
                                </div>
                            </div>

                            {/* Pitch */}
                            <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 transition-shadow hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
                                <div className="mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/50">
                                    <Megaphone className="size-5 text-violet-500" />
                                </div>
                                <h3 className="mb-2 text-xl font-semibold">
                                    Pitch
                                </h3>
                                <p className="mb-5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                                    Describe your product, set a budget. Let
                                    creators pitch you their approach and
                                    rate. Accept the bid that fits — you only
                                    pay when you approve.
                                </p>
                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                    {[
                                        'Creator proposes bid & concept',
                                        'Brand approves or rejects',
                                        'Payment held in escrow',
                                        'Released when post goes live',
                                    ].map((f) => (
                                        <li
                                            key={f}
                                            className="flex items-center gap-2"
                                        >
                                            <CheckCircle2 className="size-3.5 shrink-0 text-violet-500" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-6 inline-block rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-950/50 dark:text-violet-400">
                                    Best for product partnerships
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Why us ── */}
                <section className="bg-gray-50 py-24 dark:bg-gray-900">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                            <div>
                                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-orange-500">
                                    The difference
                                </p>
                                <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
                                    Views you can actually
                                    <br />
                                    <span className="text-orange-500">
                                        trust and pay for
                                    </span>
                                </h2>
                                <p className="mb-8 text-gray-500 dark:text-gray-400">
                                    Every other platform lets creators
                                    self-report performance. We pull verified
                                    counts directly from TikTok, Instagram,
                                    and YouTube APIs every six hours. If a
                                    post underperforms, the brand simply
                                    doesn't pay for it.
                                </p>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    {[
                                        {
                                            icon: Eye,
                                            title: 'API-verified views',
                                            desc: 'Direct from platform APIs, refreshed every 6 hours',
                                        },
                                        {
                                            icon: Zap,
                                            title: 'Instant payouts',
                                            desc: 'Stripe Connect delivers earnings the moment milestones hit',
                                        },
                                        {
                                            icon: Shield,
                                            title: 'Escrow protection',
                                            desc: 'Funds locked before campaign goes live — brands and creators protected',
                                        },
                                        {
                                            icon: BarChart3,
                                            title: 'Live analytics',
                                            desc: 'Dashboards for both brands and creators with real campaign data',
                                        },
                                    ].map(({ icon: Icon, title, desc }) => (
                                        <div key={title} className="flex gap-3">
                                            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/50">
                                                <Icon className="size-4 text-orange-500" />
                                            </div>
                                            <div>
                                                <div className="mb-1 text-sm font-semibold">
                                                    {title}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {desc}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Visual */}
                            <div className="relative">
                                <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                                    {/* Mock analytics card */}
                                    <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-gray-500">
                                                    Live view count
                                                </p>
                                                <p className="text-2xl font-bold">
                                                    1,248,302
                                                </p>
                                            </div>
                                            <div className="flex size-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                                <TrendingUp className="size-5 text-green-500" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="mb-4 flex items-center gap-2 text-xs font-medium text-gray-500">
                                            <div className="size-2 rounded-full bg-green-400" />
                                            Synced 4 minutes ago via TikTok API
                                        </div>
                                        {/* Fake bar chart */}
                                        <div className="flex h-24 items-end gap-2">
                                            {[40, 65, 45, 80, 60, 90, 75, 100, 85, 95, 70, 88].map(
                                                (h, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex-1 rounded-t bg-orange-100 dark:bg-orange-950/50"
                                                        style={{
                                                            height: `${h}%`,
                                                        }}
                                                    >
                                                        <div
                                                            className="h-1/3 rounded-t bg-orange-400"
                                                            style={{}}
                                                        />
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                                            {[
                                                {
                                                    label: 'Earned',
                                                    value: '$425.00',
                                                    color: 'text-green-600',
                                                },
                                                {
                                                    label: 'Pending',
                                                    value: '$120.00',
                                                    color: 'text-amber-600',
                                                },
                                                {
                                                    label: 'Next at',
                                                    value: '1.5M views',
                                                    color: 'text-blue-600',
                                                },
                                            ].map(({ label, value, color }) => (
                                                <div
                                                    key={label}
                                                    className="rounded-lg bg-gray-50 p-2 dark:bg-gray-700/50"
                                                >
                                                    <div
                                                        className={`text-sm font-bold ${color}`}
                                                    >
                                                        {value}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {label}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Floating badge */}
                                <div className="absolute -top-4 -right-4 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                    <Play className="size-3.5 fill-orange-500 text-orange-500" />
                                    <span className="text-xs font-medium">
                                        Milestone hit — payout sent
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── For Brands ── */}
                <section id="for-brands" className="py-24 dark:bg-gray-950">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-14 text-center">
                            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-orange-500">
                                For brands
                            </p>
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Launch campaigns in minutes
                            </h2>
                            <p className="mx-auto mt-4 max-w-xl text-gray-500 dark:text-gray-400">
                                Set your brief, lock escrow, and watch
                                verified results come in. No spreadsheets, no
                                invoices, no guesswork.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                {
                                    step: '01',
                                    title: 'Create a brief',
                                    desc: 'Choose Contest, Ripple, or Pitch. Write your brief, set requirements and budget.',
                                },
                                {
                                    step: '02',
                                    title: 'Deposit escrow',
                                    desc: 'Funds are held securely via Stripe. Nothing leaves until performance is verified.',
                                },
                                {
                                    step: '03',
                                    title: 'Review creators',
                                    desc: 'See entries with verified follower counts. Approve, request edits, or reject.',
                                },
                                {
                                    step: '04',
                                    title: 'Pay for results',
                                    desc: 'Payouts fire automatically on milestones. Unused budget is returned.',
                                },
                            ].map(({ step, title, desc }) => (
                                <div
                                    key={step}
                                    className="relative rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
                                >
                                    <div className="mb-4 text-5xl font-bold text-gray-100 dark:text-gray-800">
                                        {step}
                                    </div>
                                    <h3 className="mb-2 text-base font-semibold">
                                        {title}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Pricing ── */}
                <section
                    id="pricing"
                    className="bg-gray-50 py-24 dark:bg-gray-900"
                >
                    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-14 text-center">
                            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-orange-500">
                                Pricing
                            </p>
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Simple, transparent pricing
                            </h2>
                            <p className="mx-auto mt-4 max-w-xl text-gray-500 dark:text-gray-400">
                                Flat 15% platform fee on all payouts.
                                Subscriptions give you the seat at the table.
                            </p>
                        </div>

                        {/* Brand plans */}
                        <div className="mb-6">
                            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                <Users className="size-4" />
                                Brand plans
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-3">
                                {[
                                    {
                                        name: 'Starter',
                                        price: '$49',
                                        desc: 'Up to 3 active campaigns',
                                        features: [
                                            'All campaign types',
                                            'Basic analytics',
                                            'Standard support',
                                        ],
                                        highlight: false,
                                    },
                                    {
                                        name: 'Growth',
                                        price: '$149',
                                        desc: 'Up to 10 active campaigns',
                                        features: [
                                            'All campaign types',
                                            'Advanced analytics',
                                            'Priority support',
                                            'Agency invite (3 members)',
                                        ],
                                        highlight: true,
                                    },
                                    {
                                        name: 'Scale',
                                        price: '$399',
                                        desc: 'Unlimited campaigns',
                                        features: [
                                            'Everything in Growth',
                                            'White-label mode',
                                            'Co-brand campaigns',
                                            'Dedicated account manager',
                                        ],
                                        highlight: false,
                                    },
                                ].map(
                                    ({
                                        name,
                                        price,
                                        desc,
                                        features,
                                        highlight,
                                    }) => (
                                        <div
                                            key={name}
                                            className={`relative rounded-2xl border p-6 ${
                                                highlight
                                                    ? 'border-orange-300 bg-orange-500 text-white shadow-xl shadow-orange-500/20 dark:border-orange-600'
                                                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                                            }`}
                                        >
                                            {highlight && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gray-900 px-3 py-0.5 text-xs font-medium text-white">
                                                    Most popular
                                                </div>
                                            )}
                                            <div className="mb-4">
                                                <div
                                                    className={`text-sm font-medium ${highlight ? 'text-orange-100' : 'text-gray-500 dark:text-gray-400'}`}
                                                >
                                                    {name}
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-bold">
                                                        {price}
                                                    </span>
                                                    <span
                                                        className={`text-sm ${highlight ? 'text-orange-200' : 'text-gray-400'}`}
                                                    >
                                                        /mo
                                                    </span>
                                                </div>
                                                <div
                                                    className={`mt-1 text-xs ${highlight ? 'text-orange-100' : 'text-gray-500 dark:text-gray-400'}`}
                                                >
                                                    {desc}
                                                </div>
                                            </div>
                                            <ul className="mb-6 space-y-2">
                                                {features.map((f) => (
                                                    <li
                                                        key={f}
                                                        className="flex items-center gap-2 text-sm"
                                                    >
                                                        <CheckCircle2
                                                            className={`size-3.5 shrink-0 ${highlight ? 'text-orange-200' : 'text-orange-500'}`}
                                                        />
                                                        <span
                                                            className={
                                                                highlight
                                                                    ? 'text-orange-50'
                                                                    : 'text-gray-600 dark:text-gray-300'
                                                            }
                                                        >
                                                            {f}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                            {canRegister && (
                                                <Link
                                                    href={register()}
                                                    className={`block rounded-lg px-4 py-2 text-center text-sm font-medium transition-colors ${
                                                        highlight
                                                            ? 'bg-white text-orange-600 hover:bg-orange-50'
                                                            : 'bg-gray-900 text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600'
                                                    }`}
                                                >
                                                    Get started
                                                </Link>
                                            )}
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>

                        {/* Creator plans */}
                        <div>
                            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                <Play className="size-4" />
                                Creator plans
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {[
                                    {
                                        name: 'Free',
                                        price: '$0',
                                        desc: 'Browse and apply',
                                        features: [
                                            'Browse all campaigns',
                                            'Up to 2 entries per month',
                                            'Basic profile',
                                        ],
                                        highlight: false,
                                    },
                                    {
                                        name: 'Creator Pro',
                                        price: '$9',
                                        desc: 'Unlimited entries',
                                        features: [
                                            'Unlimited entries',
                                            'Shareable media kit',
                                            'Priority discovery in search',
                                            'Verified badge',
                                            'Advanced earnings dashboard',
                                        ],
                                        highlight: true,
                                    },
                                ].map(
                                    ({
                                        name,
                                        price,
                                        desc,
                                        features,
                                        highlight,
                                    }) => (
                                        <div
                                            key={name}
                                            className={`rounded-2xl border p-6 ${
                                                highlight
                                                    ? 'border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30'
                                                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                                            }`}
                                        >
                                            <div className="mb-4">
                                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    {name}
                                                </div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-bold">
                                                        {price}
                                                    </span>
                                                    <span className="text-sm text-gray-400">
                                                        /mo
                                                    </span>
                                                </div>
                                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    {desc}
                                                </div>
                                            </div>
                                            <ul className="mb-6 space-y-2">
                                                {features.map((f) => (
                                                    <li
                                                        key={f}
                                                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
                                                    >
                                                        <CheckCircle2 className="size-3.5 shrink-0 text-violet-500" />
                                                        {f}
                                                    </li>
                                                ))}
                                            </ul>
                                            {canRegister && (
                                                <Link
                                                    href={register()}
                                                    className={`block rounded-lg px-4 py-2 text-center text-sm font-medium transition-colors ${
                                                        highlight
                                                            ? 'bg-violet-600 text-white hover:bg-violet-700'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                                                    }`}
                                                >
                                                    Join free
                                                </Link>
                                            )}
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── CTA banner ── */}
                <section className="bg-gray-950 py-24">
                    <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
                        <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            Ready to run campaigns that
                            <br />
                            <span className="text-orange-400">
                                actually convert?
                            </span>
                        </h2>
                        <p className="mb-10 text-gray-400">
                            Join thousands of brands and creators already on
                            ProductMarket. Free to start — no credit card
                            required.
                        </p>
                        {canRegister && (
                            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                                <Link
                                    href={`${register()}?role=brand`}
                                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-orange-600"
                                >
                                    I'm a brand
                                    <ArrowRight className="size-4" />
                                </Link>
                                <Link
                                    href={`${register()}?role=creator`}
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/5"
                                >
                                    I'm a creator
                                    <ChevronRight className="size-4" />
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Footer ── */}
                <footer className="border-t border-gray-800 bg-gray-950 py-12">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-orange-500">
                                    <Sparkles className="size-3.5 text-white" />
                                </div>
                                <span className="text-sm font-semibold text-white">
                                    ProductMarket
                                </span>
                            </div>
                            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
                                <a
                                    href="#how-it-works"
                                    className="hover:text-gray-300"
                                >
                                    How it works
                                </a>
                                <a
                                    href="#pricing"
                                    className="hover:text-gray-300"
                                >
                                    Pricing
                                </a>
                                {canRegister && (
                                    <Link
                                        href={login()}
                                        className="hover:text-gray-300"
                                    >
                                        Log in
                                    </Link>
                                )}
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="hover:text-gray-300"
                                    >
                                        Sign up
                                    </Link>
                                )}
                            </div>
                            <p className="text-xs text-gray-600">
                                © {new Date().getFullYear()} ProductMarket
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
