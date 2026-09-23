import { router } from '@inertiajs/react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const MAX_BYTES = 4 * 1024 * 1024;

type Props = {
    /** Currently rendered picture — uploaded, or pulled from a connected platform. */
    avatarUrl: string | null;
    name: string;
    /** True when the picture came from a platform rather than an upload. */
    fromPlatform?: boolean;
};

function initials(name: string): string {
    return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

/**
 * Upload or remove the account's profile photo.
 *
 * A local preview is shown immediately so the change feels instant, then the
 * server's version takes over once the request lands. Removing an upload falls
 * back to the connected platform's picture rather than to a blank avatar.
 */
export function AvatarUploader({ avatarUrl, name, fromPlatform }: Props) {
    const input = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    // Object URLs leak until explicitly revoked.
    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    function choose(file: File | undefined) {
        if (!file) {
            return;
        }

        if (file.size > MAX_BYTES) {
            setError('Image must be 4MB or smaller.');

            return;
        }

        setError(null);
        setPreview(URL.createObjectURL(file));
        setProcessing(true);

        router.post(
            '/settings/profile/avatar',
            { avatar: file },
            {
                forceFormData: true,
                preserveScroll: true,
                onError: (errors) => {
                    setError(errors.avatar ?? 'Upload failed.');
                    setPreview(null);
                },
                onFinish: () => {
                    setProcessing(false);

                    if (input.current) {
                        input.current.value = '';
                    }
                },
            },
        );
    }

    function remove() {
        setProcessing(true);
        setPreview(null);
        router.delete('/settings/profile/avatar', {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    }

    const shown = preview ?? avatarUrl;

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Avatar className="size-20 ring-2 ring-border">
                        <AvatarImage src={shown ?? undefined} alt={name} />
                        <AvatarFallback className="text-lg font-semibold">
                            {initials(name)}
                        </AvatarFallback>
                    </Avatar>
                    {processing && (
                        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
                            <Loader2 className="size-5 animate-spin text-muted-foreground" />
                        </span>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={processing}
                            onClick={() => input.current?.click()}
                            className="gap-1.5"
                        >
                            <Camera className="size-4" />
                            {avatarUrl ? 'Change photo' : 'Upload photo'}
                        </Button>

                        {avatarUrl && !fromPlatform && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={processing}
                                onClick={remove}
                                className="gap-1.5 text-muted-foreground"
                            >
                                <Trash2 className="size-4" />
                                Remove
                            </Button>
                        )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                        {fromPlatform
                            ? 'Using the photo from your connected account. Upload one to override it.'
                            : 'JPG, PNG or WebP. Up to 4MB.'}
                    </p>
                </div>
            </div>

            <input
                ref={input}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => choose(e.target.files?.[0])}
            />

            <InputError message={error ?? undefined} />
        </div>
    );
}
