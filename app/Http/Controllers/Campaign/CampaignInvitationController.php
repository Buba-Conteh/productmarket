<?php

declare(strict_types=1);

namespace App\Http\Controllers\Campaign;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\CampaignInvitation;
use App\Models\CreatorProfile;
use App\Notifications\CampaignInvitationSent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Brands inviting a specific creator to enter one of their live campaigns, and
 * the creator's response to that invitation.
 */
final class CampaignInvitationController extends Controller
{
    /**
     * Brand invites a creator to a campaign.
     */
    public function store(Request $request, CreatorProfile $creatorProfile): RedirectResponse
    {
        $validated = $request->validate([
            'campaign_id' => ['required', 'string', 'exists:campaigns,id'],
            'message' => ['nullable', 'string', 'max:500'],
        ]);

        $brandProfileId = $request->user()->brandProfile?->id;

        $campaign = Campaign::query()
            ->where('id', $validated['campaign_id'])
            ->where('brand_profile_id', $brandProfileId)
            ->firstOrFail();

        abort_unless(
            $campaign->status === 'active',
            422,
            'Only live campaigns can be used for invitations.'
        );

        // A creator who already entered this campaign has nothing to be invited to.
        $alreadyEntered = $campaign->entries()
            ->where('creator_profile_id', $creatorProfile->id)
            ->exists();

        if ($alreadyEntered) {
            return back()->with('error', 'This creator has already entered that campaign.');
        }

        $invitation = CampaignInvitation::updateOrCreate(
            [
                'campaign_id' => $campaign->id,
                'creator_profile_id' => $creatorProfile->id,
            ],
            [
                'invited_by_user_id' => $request->user()->id,
                'message' => $validated['message'] ?? null,
                'status' => CampaignInvitation::STATUS_PENDING,
                'responded_at' => null,
            ],
        );

        $invitation->setRelation('campaign', $campaign->loadMissing('brand'));

        $creatorProfile->user?->notify(new CampaignInvitationSent($invitation));

        return back()->with(
            'success',
            "Invitation sent to {$creatorProfile->display_name}."
        );
    }

    /**
     * Creator accepts — the campaign brief opens so they can submit an entry.
     */
    public function accept(Request $request, CampaignInvitation $invitation): RedirectResponse
    {
        $this->authorizeCreator($request, $invitation);

        $invitation->update([
            'status' => CampaignInvitation::STATUS_ACCEPTED,
            'responded_at' => now(),
        ]);

        return redirect("/discover/{$invitation->campaign_id}")
            ->with('success', 'Invitation accepted — submit your entry below.');
    }

    /**
     * Creator declines.
     */
    public function decline(Request $request, CampaignInvitation $invitation): RedirectResponse
    {
        $this->authorizeCreator($request, $invitation);

        $invitation->update([
            'status' => CampaignInvitation::STATUS_DECLINED,
            'responded_at' => now(),
        ]);

        return back()->with('success', 'Invitation declined.');
    }

    private function authorizeCreator(Request $request, CampaignInvitation $invitation): void
    {
        abort_unless(
            $request->user()->creatorProfile?->id === $invitation->creator_profile_id,
            403,
            'This invitation is not yours.'
        );
    }
}
