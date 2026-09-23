import { router } from '@inertiajs/react';
import { Clock, Mail, Quote } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { campaignTypeLabel } from '@/lib/campaign-type';

export type CampaignInvitation = {
    id: string;
    message: string | null;
    created_at: string | null;
    campaign: {
        id: string;
        title: string;
        type: string;
        deadline: string | null;
        brand_name: string | null;
    };
};

function formatDeadline(date: string | null): string | null {
    if (!date) {
        return null;
    }

    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

/**
 * A brand's standing invitation for this creator to enter one of its campaigns.
 * Accepting routes straight to the brief so the creator can submit.
 */
export function CampaignInvitationCard({
    invitation,
}: {
    invitation: CampaignInvitation;
}) {
    const [processing, setProcessing] = useState(false);
    const deadline = formatDeadline(invitation.campaign.deadline);

    function respond(action: 'accept' | 'decline') {
        setProcessing(true);
        router.post(
            `/invitations/${invitation.id}/${action}`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/[0.07] via-card to-card p-4 sm:flex-row sm:items-center">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Mail className="size-4" />
            </span>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                        {invitation.campaign.brand_name ?? 'A brand'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        invited you to
                    </span>
                    <span className="font-medium">
                        {invitation.campaign.title}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                        {campaignTypeLabel(invitation.campaign.type)}
                    </Badge>
                </div>

                {invitation.message && (
                    <p className="mt-1.5 flex gap-1.5 text-xs text-muted-foreground italic">
                        <Quote className="mt-0.5 size-3 shrink-0" />
                        {invitation.message}
                    </p>
                )}

                {deadline && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        Closes {deadline}
                    </p>
                )}
            </div>

            <div className="flex shrink-0 gap-2">
                <Button
                    size="sm"
                    disabled={processing}
                    onClick={() => respond('accept')}
                >
                    Accept
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    disabled={processing}
                    onClick={() => respond('decline')}
                >
                    Decline
                </Button>
            </div>
        </div>
    );
}
