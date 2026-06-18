<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Centralised helper for storing, replacing, and deleting uploaded files.
 *
 * Picks the disk automatically:
 *  - Production (Laravel Cloud) attaches a bucket-backed disk and sets it as
 *    the default (e.g. "private", an S3/R2 driver). We write there so files
 *    persist across deploys instead of landing on the ephemeral local disk.
 *  - Locally the default disk is "local"; we map that to the symlinked
 *    "public" disk so uploads remain browser-accessible during development.
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
     * Store a file and return its path relative to the disk root.
     */
    public static function store(UploadedFile $file, string $directory): string
    {
        $name = Str::ulid().'.'.$file->getClientOriginalExtension();

        return $file->storeAs($directory, $name, self::disk());
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
     * Delete a file from the disk. Silently skips null/missing paths.
     */
    public static function delete(?string $path): void
    {
        if ($path && Storage::disk(self::disk())->exists($path)) {
            Storage::disk(self::disk())->delete($path);
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

        return Storage::disk(self::disk())->url($path);
    }

    /**
     * The disk all uploads are read from and written to.
     *
     * Returns the application's default disk in production (the attached
     * bucket) and the symlinked "public" disk for local development.
     */
    public static function disk(): string
    {
        $default = (string) config('filesystems.default');

        return in_array($default, ['local', 'public'], true) ? 'public' : $default;
    }
}
