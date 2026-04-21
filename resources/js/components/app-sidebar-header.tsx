import { Bell, Search } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-sidebar-border/60 bg-background/70 px-4 backdrop-blur-sm transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 md:px-6">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="ml-auto flex items-center gap-2 md:gap-3">
                <div className="relative hidden items-center md:flex">
                    <Search className="absolute left-3 size-4 text-muted-foreground" />
                    <input
                        type="search"
                        placeholder="Search campaigns, creators..."
                        className="h-9 w-56 rounded-full border border-border bg-muted/40 pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30 lg:w-72"
                    />
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full"
                    aria-label="Notifications"
                >
                    <Bell className="size-4" />
                    <span className="absolute top-2 right-2 size-2 rounded-full bg-primary ring-2 ring-background" />
                </Button>
            </div>
        </header>
    );
}
