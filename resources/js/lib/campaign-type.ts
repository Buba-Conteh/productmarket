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
