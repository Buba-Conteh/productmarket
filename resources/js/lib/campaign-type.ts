import type { CampaignType } from '@/types';

/** Display label for each campaign type. */
export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
    contest: 'Contest',
    ripple: 'Ripple',
    pitch: 'Pitch',
};

/**
 * Gradient classes used as a thumbnail fallback when a campaign has no
 * uploaded image, keyed by campaign type.
 */
export const CAMPAIGN_TYPE_GRADIENTS: Record<CampaignType, string> = {
    contest: 'from-purple-500 to-indigo-600',
    ripple: 'from-blue-500 to-cyan-600',
    pitch: 'from-orange-500 to-rose-600',
};

const FALLBACK_GRADIENT = 'from-gray-400 to-gray-600';

export function campaignTypeGradient(type: string): string {
    return CAMPAIGN_TYPE_GRADIENTS[type as CampaignType] ?? FALLBACK_GRADIENT;
}

export function campaignTypeLabel(type: string): string {
    return CAMPAIGN_TYPE_LABELS[type as CampaignType] ?? type;
}

/**
 * Campaign status chip tones. Same `/10` tint + explicit dark text approach as
 * `lib/entry-status.ts`, so both chip families read correctly in dark mode.
 */
export const CAMPAIGN_STATUS_STYLES: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground ring-border',
    pending_escrow:
        'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400',
    active: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400',
    closed: 'bg-orange-500/10 text-orange-700 ring-orange-500/20 dark:text-orange-400',
    completed:
        'bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-400',
    cancelled:
        'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-400',
};

export function campaignStatusStyle(status: string): string {
    return CAMPAIGN_STATUS_STYLES[status] ?? CAMPAIGN_STATUS_STYLES.draft;
}
