<?php

declare(strict_types=1);

namespace App\Http\Controllers\Entry;

use App\Http\Controllers\Controller;
use App\Support\DirectUpload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

final class VideoUploadUrlController extends Controller
{
    /**
     * Extensions creators may upload, mapped to the Content-Type the URL is
     * signed for. The browser has to send back exactly this type.
     */
    private const CONTENT_TYPES = [
        'mp4' => 'video/mp4',
        'mov' => 'video/quicktime',
        'avi' => 'video/x-msvideo',
        'webm' => 'video/webm',
    ];

    public function store(Request $request): JsonResponse
    {
        abort_unless(
            DirectUpload::supported(),
            409,
            'Direct uploads are not available on this host.'
        );

        $request->merge([
            'extension' => mb_strtolower((string) $request->input('extension')),
        ]);

        $validated = $request->validate([
            'extension' => ['required', 'string', Rule::in(array_keys(self::CONTENT_TYPES))],
            'size' => ['required', 'integer', 'min:1', 'max:'.DirectUpload::MAX_BYTES],
        ]);

        return response()->json(DirectUpload::reserve(
            'entries/videos',
            $validated['extension'],
            self::CONTENT_TYPES[$validated['extension']],
            (string) $request->user()->id,
        ));
    }
}
