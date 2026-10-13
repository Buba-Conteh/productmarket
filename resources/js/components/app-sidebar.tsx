import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Compass,
    FileVideo,
    Gift,
    LayoutGrid,
    Megaphone,
    MessageSquare,
    Settings,
    Users,
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
            {
                title: 'Campaigns',
                href: '/campaigns',
                icon: Megaphone,
                tourId: 'nav-campaigns',
            },
            {
                title: 'Find Creators',
                href: '/creators',
                icon: Users,
                tourId: 'nav-creators',
            },
        ],
    },
    {
        label: 'Communication',
        items: [
            {
                title: 'Messages',
                href: '/messages',
                icon: MessageSquare,
                tourId: 'nav-messages',
            },
        ],
    },
    {
        label: 'Insights',
        items: [
            {
                title: 'Analytics',
                href: '/analytics',
                icon: BarChart3,
                tourId: 'nav-analytics',
            },
        ],
    },
    {
        label: 'Growth',
        items: [{ title: 'Referrals', href: '/referrals', icon: Gift }],
    },
];

const creatorSections: NavSection[] = [
    {
        label: 'Workspace',
        items: [
            { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
            {
                title: 'Discover',
                href: '/discover',
                icon: Compass,
                tourId: 'nav-discover',
            },
            {
                title: 'My Entries',
                href: '/entries',
                icon: FileVideo,
                tourId: 'nav-entries',
            },
        ],
    },
    {
        label: 'Earnings',
        items: [
            {
                title: 'Wallet',
                href: '/wallet',
                icon: Wallet,
                tourId: 'nav-wallet',
            },
        ],
    },
    {
        label: 'Communication',
        items: [
            {
                title: 'Messages',
                href: '/messages',
                icon: MessageSquare,
                tourId: 'nav-messages',
            },
        ],
    },
    {
        label: 'Insights',
        items: [
            {
                title: 'Analytics',
                href: '/creator/analytics',
                icon: BarChart3,
                tourId: 'nav-analytics',
            },
        ],
    },
    {
        label: 'Growth',
        items: [{ title: 'Referrals', href: '/referrals', icon: Gift }],
    },
];

const defaultSections: NavSection[] = [
    {
        label: 'Workspace',
        items: [{ title: 'Dashboard', href: dashboard(), icon: LayoutGrid }],
    },
];

const supportItems: NavItem[] = [
    {
        title: 'Settings',
        href: '/settings/profile',
        icon: Settings,
        tourId: 'nav-settings',
    },
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
