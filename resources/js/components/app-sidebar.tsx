import { Link, usePage } from '@inertiajs/react';
import {
    Compass,
    FileVideo,
    LayoutGrid,
    Megaphone,
    Settings,
    Wallet,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { Auth, NavItem } from '@/types';

type NavSection = { label: string; items: NavItem[] };

const brandSections: NavSection[] = [
    {
        label: 'Workspace',
        items: [
            { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
            { title: 'Campaigns', href: '/campaigns', icon: Megaphone },
        ],
    },
];

const creatorSections: NavSection[] = [
    {
        label: 'Workspace',
        items: [
            { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
            { title: 'Discover', href: '/discover', icon: Compass },
            { title: 'My Entries', href: '/entries', icon: FileVideo },
        ],
    },
    {
        label: 'Earnings',
        items: [
            { title: 'Wallet', href: '/wallet', icon: Wallet },
        ],
    },
];

const defaultSections: NavSection[] = [
    {
        label: 'Workspace',
        items: [{ title: 'Dashboard', href: dashboard(), icon: LayoutGrid }],
    },
];

const supportItems: NavItem[] = [
    { title: 'Settings', href: '/settings/profile', icon: Settings },
];

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const roles = auth?.roles ?? [];

    const sections = roles.includes('brand')
        ? brandSections
        : roles.includes('creator')
          ? creatorSections
          : defaultSections;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="gap-4">
                {sections.map((section) => (
                    <NavMain
                        key={section.label}
                        label={section.label}
                        items={section.items}
                    />
                ))}
                <NavMain label="Support" items={supportItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
