import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import type { TikTokCreatorInfo } from '@/types';

type CreatorInfoState = {
    info: TikTokCreatorInfo | null;
    loading: boolean;
    error: string | null;
    reload: () => void;
};

/**
 * Loads the creator's live TikTok posting settings. TikTok requires the post
 * form to be driven by these (privacy options, disabled interactions, max
 * duration) rather than hardcoded values.
 */
export function useTikTokCreatorInfo(entryId: string): CreatorInfoState {
    const [info, setInfo] = useState<TikTokCreatorInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const res = await axios.get<TikTokCreatorInfo>(
                `/entries/${entryId}/publish/tiktok/creator-info`,
            );
            setInfo(res.data);
            setError(null);
        } catch (err: unknown) {
            setError(
                axios.isAxiosError(err) && err.response?.data?.message
                    ? String(err.response.data.message)
                    : 'Could not load your TikTok posting settings.',
            );
        } finally {
            setLoading(false);
        }
    }, [entryId]);

    useEffect(() => {
        void load();
    }, [load]);

    const reload = useCallback(() => {
        setLoading(true);
        setError(null);
        void load();
    }, [load]);

    return { info, loading, error, reload };
}
