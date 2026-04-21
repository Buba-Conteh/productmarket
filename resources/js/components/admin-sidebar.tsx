import { Link } from '@inertiajs/react';
import { LayoutGrid, Settings, Users, Shield } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { dashboard } from '@/routes/admin';
import { index as adminUsersIndex } from '@/routes/admin/users';
import { edit as adminSettingsEdit } from '@/routes/admin/settings';
import type { NavItem } from '@/types';

const overviewItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard.url(),
        icon: LayoutGrid,
    },
];

const manageItems: NavItem[] = [
    {
        title: 'Users',
        href: adminUsersIndex.url(),
        icon: Users,
    },
];

const platformItems: NavItem[] = [
    {
        title: 'Platform Settings',
        href: adminSettingsEdit.url(),
        icon: Settings,
    },
];

function AdminNavGroup({ label, items }: { label: string; items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}

export function AdminSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard.url()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                <div className="flex items-center gap-2 px-2 py-1">
                    <div className="flex size-5 items-center justify-center rounded bg-orange-500/10">
                        <Shield className="size-3 text-orange-500" />
                    </div>
                    <span className="text-xs font-medium text-orange-500 group-data-[collapsible=icon]:hidden">
                        Admin Panel
                    </span>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <AdminNavGroup label="Overview" items={overviewItems} />
                <AdminNavGroup label="Manage" items={manageItems} />
                <AdminNavGroup label="Platform" items={platformItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={[]} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
