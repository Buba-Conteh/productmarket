export type SocialAccountSummary = {
    platform: { name: string; slug: string };
    handle: string;
    follower_count: number;
    avg_views: number | null;
    total_likes?: number | null;
    post_count?: number | null;
    engagement_rate: string | null;
    verified?: boolean;
    last_synced_at?: string | null;
};

export type CreatorNiche = {
    id: string;
    name: string;
    slug?: string;
};

export type EntryPortfolioItem = {
    id: string;
    campaign_title: string | null;
    campaign_type: string | null;
    content_type?: string | null;
    caption: string | null;
    platforms: {
        id?: string;
        name: string;
        slug: string;
        posted_url: string | null;
        verified_view_count: number;
    }[];
    live_at: string | null;
};

export type CreatorPublicProfile = {
    id: string;
    display_name: string;
    bio: string | null;
    total_earned: string;
    entries_count: number;
    total_views: number;
    user: {
        name: string;
        avatar: string | null;
        country: string | null;
    };
    niches: CreatorNiche[];
    social_accounts: SocialAccountSummary[];
};

export type BrandPublicProfile = {
    id: string;
    company_name: string;
    logo: string | null;
    website: string | null;
    description: string | null;
    industry: string | null;
    user: { avatar: string | null };
};

export type CreatorSocialTotals = {
    followers: number;
    likes: number;
    posts: number;
    views: number;
    comments: number;
    live_entries: number;
    platform_count: number;
    engagement_rate: number | null;
};

export type CreatorSearchResult = {
    id: string;
    display_name: string;
    bio: string | null;
    total_earned: string;
    user: { name: string; avatar: string | null; country: string | null };
    niches: { id: string; name: string }[];
    totals: CreatorSocialTotals;
    social_accounts: SocialAccountSummary[];
    /** Campaigns this creator already has a pending invitation to. */
    invited_campaign_ids: string[];
};

/** A brand campaign a creator can be invited to. */
export type InvitableCampaign = {
    id: string;
    title: string;
    type: string;
};
