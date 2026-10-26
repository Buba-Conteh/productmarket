import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { TikTokPostPayload, TikTokPublishStatus } from '@/types';

type PublishResponse = {
    publish_status: TikTokPublishStatus;
    posted_url: string | null;
};

const POLL_INTERVAL_MS = 5000;

function isInFlight(status: TikTokPublishStatus): boolean {
    return status === 'pending' || status === 'processing';
}

/**
 * Starts a TikTok direct post and tracks it until TikTok finishes processing.
 */
export function useTikTokPublish(
    entryId: string,
    initialStatus: TikTokPublishStatus,
    initialPostedUrl: string | null,
) {
    const [status, setStatus] = useState<TikTokPublishStatus>(initialStatus);
    const [postedUrl, setPostedUrl] = useState<string | null>(initialPostedUrl);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const applyResponse = useCallback((data: PublishResponse) => {
        setStatus(data.publish_status);

        if (data.posted_url) {
            setPostedUrl(data.posted_url);
        }
    }, []);

    const stopPolling = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!isInFlight(status)) {
            return;
        }

        pollRef.current = setInterval(async () => {
            try {
                const res = await axios.get<PublishResponse>(
                    `/entries/${entryId}/publish/tiktok/status`,
                );
                applyResponse(res.data);
            } catch {
                stopPolling();
            }
        }, POLL_INTERVAL_MS);

        return stopPolling;
    }, [status, entryId, applyResponse, stopPolling]);

    const post = useCallback(
        async (payload: TikTokPostPayload) => {
            setPosting(true);
            setError(null);

            try {
                const res = await axios.post<PublishResponse>(
                    `/entries/${entryId}/publish/tiktok`,
                    payload,
                );
                applyResponse(res.data);
            } catch (err: unknown) {
                const data = axios.isAxiosError(err)
                    ? err.response?.data
                    : undefined;
                const firstFieldError = data?.errors
                    ? (
                          Object.values(data.errors)[0] as string[] | undefined
                      )?.[0]
                    : undefined;

                setError(
                    firstFieldError ??
                        (data?.message
                            ? String(data.message)
                            : 'Something went wrong. Please try again.'),
                );
            } finally {
                setPosting(false);
            }
        },
        [entryId, applyResponse],
    );

    const reset = useCallback(() => {
        setError(null);
        setStatus(null);
    }, []);

    return { status, postedUrl, posting, error, post, reset };
}
