import AdminSidebarLayout from '@/layouts/admin/admin-sidebar-layout';
import type { BreadcrumbItem } from '@/types';

export default function AdminLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    return (
        <AdminSidebarLayout breadcrumbs={breadcrumbs}>
            {children}
        </AdminSidebarLayout>
    );
}
