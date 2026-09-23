import { router } from '@inertiajs/react';
import { Check, Send } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { campaignTypeLabel } from '@/lib/campaign-type';
import type { CreatorSearchResult, InvitableCampaign } from '@/types/profile';

type Props = {
    creator: CreatorSearchResult;
    campaigns: InvitableCampaign[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

/**
 * Sends a creator an invitation to enter one of the brand's live campaigns.
 * Campaigns the creator already has a pending invitation to are disabled rather
 * than hidden, so the brand can see the invite has already gone out.
 */
export function InviteCreatorDialog({
    creator,
    campaigns,
    open,
    onOpenChange,
}: Props) {
    const available = campaigns.filter(
        (c) => !creator.invited_campaign_ids.includes(c.id),
    );

    const [campaignId, setCampaignId] = useState(available[0]?.id ?? '');
    const [message, setMessage] = useState('');
    const [processing, setProcessing] = useState(false);

    function submit() {
        if (!campaignId) {
            return;
        }

        setProcessing(true);
        router.post(
            `/creators/${creator.id}/invite`,
            { campaign_id: campaignId, message: message || null },
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    setMessage('');
                    onOpenChange(false);
                },
            },
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Invite {creator.display_name}</DialogTitle>
                    <DialogDescription>
                        They&apos;ll be notified and can submit an entry
                        straight from the campaign brief.
                    </DialogDescription>
                </DialogHeader>

                {campaigns.length === 0 ? (
                    <p className="rounded-lg bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                        You have no live campaigns. Publish a campaign before
                        inviting creators to it.
                    </p>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="invite-campaign">Campaign</Label>
                            <Select
                                value={campaignId}
                                onValueChange={setCampaignId}
                            >
                                <SelectTrigger id="invite-campaign">
                                    <SelectValue placeholder="Choose a campaign" />
                                </SelectTrigger>
                                <SelectContent>
                                    {campaigns.map((c) => {
                                        const invited =
                                            creator.invited_campaign_ids.includes(
                                                c.id,
                                            );

                                        return (
                                            <SelectItem
                                                key={c.id}
                                                value={c.id}
                                                disabled={invited}
                                            >
                                                <span className="flex items-center gap-2">
                                                    {invited && (
                                                        <Check className="size-3.5 text-muted-foreground" />
                                                    )}
                                                    {c.title}
                                                    <span className="text-xs text-muted-foreground">
                                                        {campaignTypeLabel(
                                                            c.type,
                                                        )}
                                                    </span>
                                                </span>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                            {available.length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                    This creator has already been invited to all
                                    of your live campaigns.
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="invite-message">
                                Message{' '}
                                <span className="font-normal text-muted-foreground">
                                    (optional)
                                </span>
                            </Label>
                            <Textarea
                                id="invite-message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                maxLength={500}
                                rows={3}
                                placeholder="Why you'd like them on this campaign..."
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={submit}
                        disabled={
                            processing || !campaignId || available.length === 0
                        }
                        className="gap-1.5"
                    >
                        <Send className="size-4" />
                        {processing ? 'Sending...' : 'Send invitation'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
