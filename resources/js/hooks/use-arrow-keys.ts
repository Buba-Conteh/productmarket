import { useEffect, useRef } from 'react';

type ArrowHandlers = {
    left?: () => void;
    right?: () => void;
    up?: () => void;
    down?: () => void;
};

/**
 * Binds the arrow keys while `enabled` is true. Keystrokes inside form fields
 * are ignored so typing in an open dialog never pages away from it.
 *
 * Handlers are read through a ref, so callers can pass inline closures
 * without re-binding the listener on every render.
 */
export function useArrowKeys(handlers: ArrowHandlers, enabled = true): void {
    const ref = useRef(handlers);

    useEffect(() => {
        ref.current = handlers;
    });

    useEffect(() => {
        if (!enabled) {
            return;
        }

        function onKeyDown(event: KeyboardEvent) {
            const target = event.target as HTMLElement | null;

            if (
                target?.closest(
                    'input, textarea, select, [contenteditable], [role="listbox"]',
                )
            ) {
                return;
            }

            const handler = {
                ArrowLeft: ref.current.left,
                ArrowRight: ref.current.right,
                ArrowUp: ref.current.up,
                ArrowDown: ref.current.down,
            }[event.key];

            if (handler) {
                event.preventDefault();
                handler();
            }
        }

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [enabled]);
}
