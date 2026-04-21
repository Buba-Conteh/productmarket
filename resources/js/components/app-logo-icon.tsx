import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M16 2 L29 9 L29 23 L16 30 L3 23 L3 9 Z"
                fill="currentColor"
                opacity="0.15"
            />
            <path
                d="M10 10 L16 7 L22 10 L22 17 L16 20 L10 17 Z"
                fill="currentColor"
            />
            <circle cx="16" cy="13.5" r="2.25" fill="white" />
        </svg>
    );
}
