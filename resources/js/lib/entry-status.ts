import type { EntryStatus } from '@/types';

/** Human label for each entry status. */
export const ENTRY_STATUS_LABELS: Record<EntryStatus, string> = {
    draft: 'Draft',
    pending_review: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
    live: 'Live',
    won: 'Won',
    not_selected: 'Not Selected',
    disqualified: 'Disqualified',
};

/**
 * Chip classes per status. Tones are built from `/10` tints plus an explicit
 * dark-mode text colour so a status chip stays legible in both themes — the
 * previous hand-copied `bg-yellow-100 text-yellow-700` maps washed out on dark
 * backgrounds.
 */
export const ENTRY_STATUS_STYLES: Record<EntryStatus, string> = {
    draft: 'bg-muted text-muted-foreground ring-border',
    pending_review:
        'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400',
    approved:
        'bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-400',
    rejected:
        'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-400',
    live: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400',
    won: 'bg-purple-500/10 text-purple-700 ring-purple-500/20 dark:text-purple-400',
    not_selected: 'bg-muted text-muted-foreground ring-border',
    disqualified:
        'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-400',
};

/** Same tone scale for the pending/approved/rejected states used by applications and invitations. */
export const REVIEW_STATUS_STYLES: Record<string, string> = {
    pending: ENTRY_STATUS_STYLES.pending_review,
    approved: ENTRY_STATUS_STYLES.live,
    accepted: ENTRY_STATUS_STYLES.live,
    rejected: ENTRY_STATUS_STYLES.rejected,
    declined: ENTRY_STATUS_STYLES.rejected,
    expired: ENTRY_STATUS_STYLES.draft,
};

export function entryStatusLabel(status: string): string {
    return ENTRY_STATUS_LABELS[status as EntryStatus] ?? status;
}

export function entryStatusStyle(status: string): string {
    return (
        ENTRY_STATUS_STYLES[status as EntryStatus] ?? ENTRY_STATUS_STYLES.draft
    );
}
