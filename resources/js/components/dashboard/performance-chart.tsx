import { useId, useMemo } from 'react';

type PerformanceChartProps = {
    title: string;
    subtitle?: string;
    currentValue: string;
    currentDelta?: string;
    data: number[];
    labels?: string[];
};

export function PerformanceChart({
    title,
    subtitle,
    currentValue,
    currentDelta,
    data,
    labels,
}: PerformanceChartProps) {
    const gradientId = useId();
    const glowId = useId();

    const { areaPath, linePath, focalPoint } = useMemo(() => {
        if (data.length === 0) {
            return { areaPath: '', linePath: '', focalPoint: null };
        }

        const width = 600;
        const height = 180;
        const padding = 12;
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = Math.max(max - min, 1);
        const step = (width - padding * 2) / Math.max(data.length - 1, 1);

        const points = data.map((value, index) => {
            const x = padding + index * step;
            const y =
                padding + (1 - (value - min) / range) * (height - padding * 2);

            return { x, y };
        });

        const line = points
            .map(
                (p, i) =>
                    `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`,
            )
            .join(' ');

        const area = `${line} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

        const focalIndex = Math.floor(points.length * 0.7);

        return {
            areaPath: area,
            linePath: line,
            focalPoint: points[focalIndex],
        };
    }, [data]);

    return (
        <div className="flex h-full flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h3 className="text-base font-semibold tracking-tight">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-sm text-muted-foreground">
                            {subtitle}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-3 rounded-full bg-muted/60 px-3 py-1.5 text-sm">
                    <span className="font-semibold text-foreground">
                        {currentValue}
                    </span>
                    {currentDelta && (
                        <span className="font-medium text-primary">
                            {currentDelta}
                        </span>
                    )}
                </div>
            </div>

            <div className="relative mt-5 flex-1">
                <svg
                    viewBox="0 0 600 180"
                    className="h-48 w-full"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <linearGradient
                            id={gradientId}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor="var(--primary)"
                                stopOpacity="0.35"
                            />
                            <stop
                                offset="100%"
                                stopColor="var(--primary)"
                                stopOpacity="0"
                            />
                        </linearGradient>
                        <filter
                            id={glowId}
                            x="-20%"
                            y="-20%"
                            width="140%"
                            height="140%"
                        >
                            <feGaussianBlur stdDeviation="3" />
                        </filter>
                    </defs>

                    <path d={areaPath} fill={`url(#${gradientId})`} />
                    <path
                        d={linePath}
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {focalPoint && (
                        <>
                            <line
                                x1={focalPoint.x}
                                y1="12"
                                x2={focalPoint.x}
                                y2="168"
                                stroke="var(--primary)"
                                strokeWidth="1"
                                strokeDasharray="3 3"
                                opacity="0.4"
                            />
                            <circle
                                cx={focalPoint.x}
                                cy={focalPoint.y}
                                r="8"
                                fill="var(--primary)"
                                opacity="0.25"
                                filter={`url(#${glowId})`}
                            />
                            <circle
                                cx={focalPoint.x}
                                cy={focalPoint.y}
                                r="4"
                                fill="var(--primary)"
                                stroke="var(--card)"
                                strokeWidth="2"
                            />
                        </>
                    )}
                </svg>
            </div>

            {labels && labels.length > 0 && (
                <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                    {labels.map((label) => (
                        <span key={label}>{label}</span>
                    ))}
                </div>
            )}
        </div>
    );
}
