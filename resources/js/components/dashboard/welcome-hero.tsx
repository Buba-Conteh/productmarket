import { Link } from '@inertiajs/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

type WelcomeHeroProps = {
    eyebrow: string;
    greeting: string;
    description: string;
    primaryCta: { label: string; href: string };
    secondaryCta?: { label: string; href: string };
};

export function WelcomeHero({
    eyebrow,
    greeting,
    description,
    primaryCta,
    secondaryCta,
}: WelcomeHeroProps) {
    return (
        <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-primary/5 to-card p-6 shadow-sm">
            <div
                aria-hidden
                className="pointer-events-none absolute -top-16 -right-12 size-64 rounded-full bg-primary/20 blur-3xl"
            />
            <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xl space-y-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        <Sparkles className="size-3" />
                        {eyebrow}
                    </span>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                        {greeting}
                    </h1>
                    <p className="text-sm text-muted-foreground md:text-[15px]">
                        {description}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button asChild>
                        <Link href={primaryCta.href}>
                            {primaryCta.label}
                            <ArrowRight className="size-4" />
                        </Link>
                    </Button>
                    {secondaryCta && (
                        <Button asChild variant="outline">
                            <Link href={secondaryCta.href}>
                                {secondaryCta.label}
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </section>
    );
}
