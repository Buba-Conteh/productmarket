export type CampaignType = 'contest' | 'ripple' | 'pitch';

export type CampaignStatus =
    | 'draft'
    | 'pending_escrow'
    | 'active'
    | 'closed'
    | 'completed'
    | 'cancelled';

export type Platform = {
    id: string;
    name: string;
    slug: string;
    icon_url: string | null;
};

export type ContentType = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
};

export type ContestDetails = {
    id: string;
    campaign_id: string;
    prize_amount: string;
    runner_up_prize: string | null;
    winner_entry_id: string | null;
    winner_selected_at: string | null;
};

export type RippleDetails = {
    id: string;
    campaign_id: string;
    initial_fee: string;
    rpm_rate: string;
    milestone_interval: number;
    max_payout_per_creator: string | null;
    total_budget: string;
    budget_spent: string;
};

export type PitchDetails = {
    id: string;
    campaign_id: string;
    product_name: string;
    product_description: string | null;
    product_url: string | null;
    product_images: string[] | null;
    budget_cap: string | null;
    min_bid: string | null;
    max_bid: string | null;
};

export type BrandProfile = {
    id: string;
    company_name: string;
    logo: string | null;
    website: string | null;
};

export type EscrowTransaction = {
    id: string;
    total_held: string;
    total_released: string;
    total_refunded: string;
    status: string;
};

export type CampaignResource = {
    id: string;
    campaign_id: string;
    original_name: string;
    file_name: string;
    mime_type: string;
    size: number;
    url: string;
    created_at: string;
};

export type Campaign = {
    id: string;
    brand_profile_id: string;
    type: CampaignType;
    title: string;
    brief: string;
    requirements: string[];
    required_hashtags: string[];
    target_regions: string[] | null;
    inspiration_links: string[];
    platform_fee_pct: string;
    status: CampaignStatus;
    published_at: string | null;
    deadline: string | null;
    max_creators: number | null;
    ai_brief_used: boolean;
    thumbnail: string | null;
    thumbnail_url: string | null;
    created_at: string;
    updated_at: string;
    entries_count?: number;
    brand?: BrandProfile;
    platforms?: Platform[];
    content_types?: ContentType[];
    contest_details?: ContestDetails | null;
    ripple_details?: RippleDetails | null;
    pitch_details?: PitchDetails | null;
    escrow_transaction?: EscrowTransaction | null;
    resources?: CampaignResource[];
};

export type CampaignApplication = {
    id: string;
    campaign_id: string;
    creator_profile_id: string;
    pitch: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    creator?: {
        id: string;
        display_name: string;
        bio: string | null;
        user?: {
            id: string;
            name: string;
            avatar: string | null;
        };
        niches?: { id: string; name: string }[];
    };
};

export type CampaignFormData = {
    type: CampaignType;
    title: string;
    brief: string;
    requirements: string[];
    required_hashtags: string[];
    target_regions: string[];
    inspiration_links: string[];
    deadline: string;
    max_creators: string;
    platform_ids: string[];
    content_type_ids: string[];
    ai_brief_used: boolean;
    // Contest
    prize_amount: string;
    runner_up_prize: string;
    // Ripple
    initial_fee: string;
    rpm_rate: string;
    milestone_interval: string;
    max_payout_per_creator: string;
    total_budget: string;
    // Pitch
    product_name: string;
    product_description: string;
    product_url: string;
    budget_cap: string;
    min_bid: string;
    max_bid: string;
};

export type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
};
