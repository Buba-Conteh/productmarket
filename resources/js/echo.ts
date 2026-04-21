import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const key = import.meta.env.VITE_REVERB_APP_KEY;

const echo =
    typeof window !== 'undefined' && key
        ? (() => {
              (window as any).Pusher = Pusher;
              return new Echo({
                  broadcaster: 'reverb',
                  key,
                  wsHost: import.meta.env.VITE_REVERB_HOST ?? 'localhost',
                  wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
                  wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
                  forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
                  enabledTransports: ['ws', 'wss'],
              });
          })()
        : null;

export default echo;
