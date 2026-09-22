<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Issues presigned PUT URLs so the browser uploads straight to the bucket.
 * PHP never receives the body, so uploads are not bound by post_max_size,
 * upload_max_filesize or memory_limit.
 *
 * Hosts with no bucket attached (local dev on the "local" disk) cannot sign
 * URLs, so callers fall back to an ordinary multipart POST — which must stay
 * under FALLBACK_MAX_KILOBYTES to avoid exhausting PHP's memory limit.
 */
final class DirectUpload
{
    public const MAX_BYTES = 524_288_000; // 500 MB

    public const FALLBACK_MAX_KILOBYTES = 20_480; // 20 MB

    public static function supported(): bool
    {
        return config('filesystems.disks.'.FileUploader::disk().'.driver') === 's3';
    }

    public static function maxBytes(): int
    {
        return self::supported()
            ? self::MAX_BYTES
            : self::FALLBACK_MAX_KILOBYTES * 1024;
    }

    /**
     * Reserve a key in the bucket and sign a PUT URL for it.
     *
     * @return array{url: string, headers: array<string, string>, path: string, signature: string}
     */
    public static function reserve(
        string $directory,
        string $extension,
        string $contentType,
        string $userId,
    ): array {
        $path = $directory.'/'.Str::ulid().'.'.$extension;

        $target = Storage::disk(FileUploader::disk())->temporaryUploadUrl(
            $path,
            now()->addMinutes(30),
            ['ContentType' => $contentType],
        );

        return [
            'url' => $target['url'],
            // Only the signed Content-Type is replayed. The browser sets Host
            // itself and refuses to let scripts override it.
            'headers' => ['Content-Type' => $contentType],
            'path' => $path,
            'signature' => self::sign($path, $userId),
        ];
    }

    /**
     * Verify a client-supplied path was issued by reserve() for this user and
     * that the object actually landed within the size cap.
     *
     * @throws ValidationException
     */
    public static function claim(
        string $path,
        string $signature,
        string $userId,
        string $field = 'video',
    ): string {
        if (! hash_equals(self::sign($path, $userId), $signature)) {
            throw ValidationException::withMessages([
                $field => 'That upload could not be verified. Please upload the file again.',
            ]);
        }

        $disk = Storage::disk(FileUploader::disk());

        if (! $disk->exists($path)) {
            throw ValidationException::withMessages([
                $field => 'The upload did not finish. Please try again.',
            ]);
        }

        if ($disk->size($path) > self::MAX_BYTES) {
            $disk->delete($path);

            throw ValidationException::withMessages([
                $field => 'That file is larger than the '.intdiv(self::MAX_BYTES, 1024 * 1024).' MB limit.',
            ]);
        }

        return $path;
    }

    private static function sign(string $path, string $userId): string
    {
        return hash_hmac('sha256', $userId.'|'.$path, (string) config('app.key'));
    }
}
