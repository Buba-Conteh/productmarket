<?php

declare(strict_types=1);

namespace App\Http\Requests\Campaign;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateCampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $campaign = $this->route('campaign');

        return $user?->hasRole('brand')
            && $campaign
            && $user->brandProfile?->id === $campaign->brand_profile_id
            && $campaign->status === 'draft';
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $campaign = $this->route('campaign');
        $type = $campaign?->type;

        $rules = [
            'title' => ['sometimes', 'string', 'max:255'],
            'brief' => ['sometimes', 'string', 'max:50000'],
            'requirements' => ['nullable', 'array'],
            'requirements.*' => ['string', 'max:500'],
            'required_hashtags' => ['nullable', 'array'],
            'required_hashtags.*' => ['string', 'max:100'],
            'target_regions' => ['nullable', 'array'],
            'target_regions.*' => ['string', 'max:5'],
            'inspiration_links' => ['nullable', 'array'],
            'inspiration_links.*' => ['url', 'max:2048'],
            'deadline' => ['nullable', 'date', 'after:today'],
            'max_creators' => ['nullable', 'integer', 'min:1'],
            'platform_ids' => ['sometimes', 'array', 'min:1'],
            'platform_ids.*' => ['string', 'exists:platforms,id'],
            'content_type_ids' => ['nullable', 'array'],
            'content_type_ids.*' => ['string', 'exists:content_types,id'],
            'ai_brief_used' => ['nullable', 'boolean'],
        ];

        if ($type === 'contest') {
            $rules['prize_amount'] = ['sometimes', 'numeric', 'min:1'];
            $rules['runner_up_prize'] = ['nullable', 'numeric', 'min:0'];
        }

        if ($type === 'ripple') {
            $rules['initial_fee'] = ['sometimes', 'numeric', 'min:0'];
            $rules['rpm_rate'] = ['sometimes', 'numeric', 'min:0.01'];
            $rules['milestone_interval'] = ['sometimes', 'integer', 'min:1000'];
            $rules['max_payout_per_creator'] = ['nullable', 'numeric', 'min:0'];
            $rules['total_budget'] = ['sometimes', 'numeric', 'min:1'];
        }

        if ($type === 'pitch') {
            $rules['product_name'] = ['sometimes', 'string', 'max:255'];
            $rules['product_description'] = ['nullable', 'string', 'max:5000'];
            $rules['product_url'] = ['nullable', 'url', 'max:2048'];
            $rules['budget_cap'] = ['nullable', 'numeric', 'min:0'];
            $rules['min_bid'] = ['nullable', 'numeric', 'min:0'];
            $rules['max_bid'] = ['nullable', 'numeric', 'min:0', 'gte:min_bid'];
        }

        return $rules;
    }
}
