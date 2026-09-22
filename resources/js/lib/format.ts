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
