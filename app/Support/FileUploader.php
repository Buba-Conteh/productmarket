<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Centralised helper for storing, replacing, and deleting uploaded files
 * on the public disk (storage/app/public → symlinked at public/storage).
 *
 * Usage:
 *   $path = FileUploader::store($file, 'campaigns/thumbnails');
 *   $path = FileUploader::replace($old, $file, 'campaigns/thumbnails');
 *   FileUploader::delete($path);
 *   $url  = FileUploader::url($path);
 */
final class FileUploader
{
    /**
     * Store a file and return its path relative to the public disk root.
     */
    public static function store(UploadedFile $file, string $directory): string
    {
        $name = Str::ulid().'.'.$file->getClientOriginalExtension();

        return $file->storeAs($directory, $name, 'public');
    }

    /**
     * Replace an existing file (deletes old if present) and store the new one.
     */
    public static function replace(?string $oldPath, UploadedFile $file, string $directory): string
    {
        self::delete($oldPath);

        return self::store($file, $directory);
    }

    /**
     * Delete a file from the public disk. Silently skips null/missing paths.
     */
    public static function delete(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * Return the full public URL for a stored path.
     */
    public static function url(?string $path): ?string
    {
        if ($path === null) {
            return null;
        }

        return Storage::disk('public')->url($path);
    }
}
