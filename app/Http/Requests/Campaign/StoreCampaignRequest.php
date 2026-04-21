<?php

declare(strict_types=1);

namespace App\Http\Requests\Campaign;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreCampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('brand') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $type = $this->input('type');

        $rules = [
            'type' => ['required', Rule::in(['contest', 'ripple', 'pitch'])],
            'title' => ['required', 'string', 'max:255'],
            'brief' => ['required', 'string', 'max:50000'],
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
            'platform_ids' => ['required', 'array', 'min:1'],
            'platform_ids.*' => ['string', 'exists:platforms,id'],
            'content_type_ids' => ['nullable', 'array'],
            'content_type_ids.*' => ['string', 'exists:content_types,id'],
            'ai_brief_used' => ['nullable', 'boolean'],
        ];

        // Type-specific validation
        if ($type === 'contest') {
            $rules['prize_amount'] = ['required', 'numeric', 'min:1'];
            $rules['runner_up_prize'] = ['nullable', 'numeric', 'min:0'];
        }

        if ($type === 'ripple') {
            $rules['initial_fee'] = ['required', 'numeric', 'min:0'];
            $rules['rpm_rate'] = ['required', 'numeric', 'min:0.01'];
            $rules['milestone_interval'] = ['required', 'integer', 'min:1000'];
            $rules['max_payout_per_creator'] = ['nullable', 'numeric', 'min:0'];
            $rules['total_budget'] = ['required', 'numeric', 'min:1'];
        }

        if ($type === 'pitch') {
            $rules['product_name'] = ['required', 'string', 'max:255'];
            $rules['product_description'] = ['nullable', 'string', 'max:5000'];
            $rules['product_url'] = ['nullable', 'url', 'max:2048'];
            $rules['budget_cap'] = ['nullable', 'numeric', 'min:0'];
            $rules['min_bid'] = ['nullable', 'numeric', 'min:0'];
            $rules['max_bid'] = ['nullable', 'numeric', 'min:0', 'gte:min_bid'];
        }

        return $rules;
    }
}
