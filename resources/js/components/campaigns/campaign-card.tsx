import { Link } from '@inertiajs/react';
import { Calendar, CheckCircle2, Clock, DollarSign, Users } from 'lucide-react';
import { CampaignThumbnail } from '@/components/campaigns/campaign-thumbnail';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { campaignTypeLabel } from '@/lib/campaign-type';
import { cn } from '@/lib/utils';
import type { Campaign } from '@/types';

function formatDate(date: string | null): string {
    if (!date) {
        return 'No deadline';
    }

    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

function budgetDisplay(campaign: Campaign): string {
    switch (campaign.type) {
        case 'contest':
            return campaign.contest_details
                ? `$${Number(campaign.contest_details.prize_amount).toLocaleString()} prize`
                : '';
        case 'ripple':
            return campaign.ripple_details
                ? `$${Number(campaign.ripple_details.total_budget).toLocaleString()} budget`
                : '';
        case 'pitch':
            return campaign.pitch_details?.budget_cap
                ? `Up to $${Number(campaign.pitch_details.budget_cap).toLocaleString()}`
                : 'Open bidding';
        default:
            return '';
    }
}

function EntryStatusBadge({
    campaignId,
    campaignType,
    enteredCampaignIds,
    applicationStatuses,
}: {
    campaignId: string;
    campaignType: string;
    enteredCampaignIds: string[];
    applicationStatuses: Record<string, string>;
}) {
    const hasEntry = enteredCampaignIds.includes(campaignId);
    const appStatus = applicationStatuses[campaignId];

    if (hasEntry) {
        return (
            <span className="flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white shadow">
                <CheckCircle2 className="size-3" />
                Applied
            </span>
        );
    }

    if (campaignType === 'pitch' && appStatus) {
        const isPending = appStatus === 'pending';

        return (
            <span
                className={cn(
                    'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium shadow',
                    isPending
                        ? 'bg-yellow-400 text-yellow-900'
                        : appStatus === 'approved'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-400 text-white',
                )}
            >
                <Clock className="size-3" />
                {appStatus.charAt(0).toUpperCase() + appStatus.slice(1)}
            </span>
        );
    }

    return null;
}

type Props = {
    campaign: Campaign;
    href: string;
    enteredCampaignIds: string[];
    applicationStatuses: Record<string, string>;
};

/** Campaign discovery grid tile — thumbnail, type/status badges, budget/entry-count/deadline row, platform badges. */
export function CampaignCard({
    campaign,
    href,
    enteredCampaignIds,
    applicationStatuses,
}: Props) {
    return (
        <Link href={href} className="block">
            <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                <CampaignThumbnail
                    thumbnailUrl={campaign.thumbnail_url}
                    title={campaign.title}
                    type={campaign.type}
                    className="h-40"
                    topOverlay={
                        <>
                            <Badge
                                variant="secondary"
                                className="border-0 bg-black/50 text-white capitalize backdrop-blur-sm hover:bg-black/50"
                            >
                                {campaignTypeLabel(campaign.type)}
                            </Badge>
                            <EntryStatusBadge
                                campaignId={campaign.id}
                                campaignType={campaign.type}
                                enteredCampaignIds={enteredCampaignIds}
                                applicationStatuses={applicationStatuses}
                            />
                        </>
                    }
                />

                <CardHeader className="pb-3">
                    <div className="space-y-1">
                        <CardTitle className="line-clamp-1 text-base">
                            {campaign.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-1">
                            {campaign.brand?.company_name ?? 'Brand'}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                        {campaign.brief.replace(/<[^>]*>/g, '')}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                            <DollarSign className="size-3.5" />
                            {budgetDisplay(campaign)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="size-3.5" />
                            {campaign.entries_count ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="size-3.5" />
                            {formatDate(campaign.deadline)}
                        </span>
                    </div>
                    {campaign.platforms && campaign.platforms.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {campaign.platforms.map((p) => (
                                <Badge
                                    key={p.id}
                                    variant="secondary"
                                    className="text-xs"
                                >
                                    {p.name}
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}
