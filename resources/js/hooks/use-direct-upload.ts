import axios from 'axios';
import { useCallback, useState } from 'react';

type Reservation = {
    url: string;
    headers: Record<string, string>;
    path: string;
    signature: string;
};

/** The signed reference handed back to the form once the bucket has the file. */
export type UploadedFileRef = {
    path: string;
    signature: string;
};

function extensionOf(file: File): string {
    return file.name.split('.').pop()?.toLowerCase() ?? '';
}

/**
 * Uploads a file straight to the storage bucket via a presigned PUT, so the
 * bytes never pass through PHP. Returns a signed reference the form submits
 * in place of the file itself.
 */
export function useDirectUpload() {
    const [progress, setProgress] = useState<number | null>(null);

    const upload = useCallback(async (file: File): Promise<UploadedFileRef> => {
        setProgress(0);

        try {
            const { data } = await axios.post<Reservation>(
                '/entries/upload-url',
                { extension: extensionOf(file), size: file.size },
            );

            await axios.put(data.url, file, {
                headers: data.headers,
                withCredentials: false,
                onUploadProgress: (event) => {
                    if (event.total) {
                        setProgress(
                            Math.round((event.loaded / event.total) * 100),
                        );
                    }
                },
            });

            return { path: data.path, signature: data.signature };
        } finally {
            setProgress(null);
        }
    }, []);

    return { upload, progress };
}
