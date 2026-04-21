export type SocialAccountSummary = {
    platform: { name: string; slug: string };
    handle: string;
    follower_count: number;
    avg_views: number | null;
    engagement_rate: string | null;
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

export type CreatorSearchResult = {
    id: string;
    display_name: string;
    bio: string | null;
    total_earned: string;
    user: { name: string; avatar: string | null; country: string | null };
    niches: { id: string; name: string }[];
    social_accounts: {
        platform: { name: string; slug: string };
        handle: string;
        follower_count: number;
        engagement_rate: string | null;
    }[];
};
