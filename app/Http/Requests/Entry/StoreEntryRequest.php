<?php

declare(strict_types=1);

namespace App\Http\Requests\Entry;

use Illuminate\Foundation\Http\FormRequest;

final class StoreEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('creator') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $campaign = $this->route('campaign');
        $isDraft = $this->boolean('save_draft');

        $rules = [
            'save_draft' => ['nullable', 'boolean'],
            'requirements_acknowledged' => [$isDraft ? 'nullable' : 'required', 'boolean'],
            'video_url' => [$isDraft ? 'nullable' : 'required', 'string', 'max:2048'],
            'video_duration_sec' => ['nullable', 'integer', 'min:1'],
            'caption' => ['nullable', 'string', 'max:5000'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:100'],
            'content_type_id' => ['nullable', 'string', 'exists:content_types,id'],
            'platform_ids' => [$isDraft ? 'nullable' : 'required', 'array', 'min:1'],
            'platform_ids.*' => ['string', 'exists:platforms,id'],
        ];

        if ($campaign && $campaign->type === 'pitch') {
            $rules['proposed_bid'] = [$isDraft ? 'nullable' : 'required', 'numeric', 'min:1'];
            $rules['pitch_text'] = ['nullable', 'string', 'max:2000'];
        }

        return $rules;
    }
}
