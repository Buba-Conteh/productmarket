/**
 * Compact number formatting shared by every surface that renders social and
 * view-count metrics (12_500 -> "12.5K").
 */
export function formatCompactNumber(value: number): string {
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`;
    }

    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(1)}K`;
    }

    return String(value);
}

/** "1234.5" -> "$1,234.50". Used by wallet and payout surfaces. */
export function formatUsd(value: string | number): string {
    return `$${Number(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}
