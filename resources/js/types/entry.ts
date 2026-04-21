import type { Campaign, ContentType, Platform } from './campaign';

export type EntryStatus =
    | 'draft'
    | 'pending_review'
    | 'approved'
    | 'rejected'
    | 'live'
    | 'won'
    | 'not_selected'
    | 'disqualified';

export type EntryType = 'contest' | 'ripple' | 'pitch';

export type EntryPlatform = Platform & {
    pivot?: {
        posted_url: string | null;
        verified_view_count: number;
        last_synced_at: string | null;
    };
};

export type EntryPitchDetail = {
    id: string;
    entry_id: string;
    proposed_bid: string;
    accepted_bid: string | null;
    pitch: string | null;
    bid_accepted_at: string | null;
};

export type EntryRippleEarning = {
    id: string;
    entry_id: string;
    milestone_number: number;
    views_at_milestone: number;
    amount: string;
    type: 'initial_fee' | 'milestone';
    triggered_at: string;
    payout_id: string | null;
};

export type EntryEditRequest = {
    id: string;
    entry_id: string;
    requested_by_user_id: string;
    notes: string;
    status: 'pending' | 'addressed' | 'dismissed';
    addressed_at: string | null;
    created_at: string;
    requested_by?: {
        id: string;
        name: string;
    };
};

export type EntryPayout = {
    id: string;
    entry_id: string;
    gross_amount: string;
    platform_fee: string;
    net_amount: string;
    payout_type: string;
    status: 'pending' | 'processing' | 'paid' | 'failed';
    paid_at: string | null;
    created_at: string;
};

export type CreatorProfile = {
    id: string;
    display_name: string;
    bio: string | null;
    total_earned: string;
    pending_earnings: string;
    user?: {
        id: string;
        name: string;
        avatar: string | null;
    };
    niches?: { id: string; name: string }[];
};

export type Entry = {
    id: string;
    campaign_id: string;
    creator_profile_id: string;
    content_type_id: string | null;
    type: EntryType;
    video_url: string | null;
    video_duration_sec: number | null;
    caption: string | null;
    tags: string[];
    requirements_acknowledged: boolean;
    status: EntryStatus;
    rejection_reason: string | null;
    approved_at: string | null;
    live_at: string | null;
    submitted_at: string | null;
    created_at: string;
    updated_at: string;
    campaign?: Campaign;
    creator?: CreatorProfile;
    content_type?: ContentType | null;
    platforms?: EntryPlatform[];
    pitch_details?: EntryPitchDetail | null;
    ripple_earnings?: EntryRippleEarning[];
    edit_requests?: EntryEditRequest[];
    payouts?: EntryPayout[];
};

export type EntryFormData = {
    save_draft: boolean;
    requirements_acknowledged: boolean;
    video_url: string;
    video_duration_sec: string;
    caption: string;
    tags: string[];
    content_type_id: string;
    platform_ids: string[];
    // Pitch-specific
    proposed_bid: string;
    pitch_text: string;
};
