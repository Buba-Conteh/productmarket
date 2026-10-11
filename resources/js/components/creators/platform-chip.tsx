import { cn } from '@/lib/utils';
import { platformTone } from './platform-reach-row';

const LABELS: Record<string, string> = {
    tiktok: 'TikTok',
    instagram: 'Instagram',
    youtube: 'YouTube',
};

export function platformLabel(slug: string): string {
    return LABELS[slug] ?? slug;
}

/** Small tinted platform marker, matching the directory's reach rows. */
export function PlatformChip({
    slug,
    className,
}: {
    slug: string;
    className?: string;
}) {
    return (
        <span
            title={platformLabel(slug)}
            className={cn(
                'inline-flex size-6 shrink-0 items-center justify-center rounded-md text-[9px] font-bold uppercase',
                platformTone(slug),
                className,
            )}
        >
            {platformLabel(slug).slice(0, 2)}
        </span>
    );
}
