import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Props = {
    icon: LucideIcon;
    title: string;
    description?: string;
    /** Primary call to action rendered under the copy. */
    action?: ReactNode;
    className?: string;
};

/** Shared empty state for list and grid pages. */
export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: Props) {
    return (
        <Card className={cn('border-dashed bg-muted/20', className)}>
            <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <Icon className="size-6" />
                </span>
                <p className="font-medium">{title}</p>
                {description && (
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
                {action && <div className="mt-5">{action}</div>}
            </CardContent>
        </Card>
    );
}
