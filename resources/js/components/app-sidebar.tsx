import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    BookOpen,
    Compass,
    CreditCard,
    FileVideo,
    FolderGit2,
    LayoutGrid,
    LifeBuoy,
    Megaphone,
    MessageSquare,
    Settings,
    Trophy,
    Users,
    Wallet,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
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
            { title: 'Creators', href: '/creators', icon: Users },
            { title: 'Messages', href: '/messages', icon: MessageSquare },
        ],
    },
    {
        label: 'Insights',
        items: [
            { title: 'Analytics', href: '/analytics', icon: BarChart3 },
            { title: 'Billing', href: '/billing', icon: CreditCard },
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
            { title: 'Messages', href: '/messages', icon: MessageSquare },
        ],
    },
    {
        label: 'Earnings',
        items: [
            { title: 'Wallet', href: '/wallet', icon: Wallet },
            { title: 'Achievements', href: '/achievements', icon: Trophy },
            { title: 'Billing', href: '/billing', icon: CreditCard },
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
    { title: 'Help Center', href: '/support', icon: LifeBuoy },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
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
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
