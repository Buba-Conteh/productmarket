import { Head, router } from '@inertiajs/react';
import { Download, Mail } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import { exportMethod as exportWaitlist } from '@/routes/admin/early-access';

type Role = 'creator' | 'brand';

type Signup = {
    id: string;
    name: string | null;
    email: string;
    role: Role;
    created_at: string;
};

type Paginator = {
    data: Signup[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

const ROLE_BADGE: Record<Role, string> = {
    creator:
        'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400 border-green-200 dark:border-green-800',
    brand: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400 border-blue-200 dark:border-blue-800',
};

export default function AdminEarlyAccessIndex({
    signups,
}: {
    signups: Paginator;
}) {
    return (
        <>
            <Head title="Early Access — Admin" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Early Access Waitlist"
                        description={`${signups.total.toLocaleString()} signup${signups.total !== 1 ? 's' : ''}`}
                    />
                    <Button asChild variant="outline" className="gap-2">
                        <a href={exportWaitlist.url()}>
                            <Download className="size-4" />
                            Export CSV
                        </a>
                    </Button>
                </div>

                <div className="rounded-xl border border-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Joined</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {signups.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="py-12 text-center text-muted-foreground"
                                    >
                                        <Mail className="mx-auto mb-3 size-8 text-muted-foreground/40" />
                                        No signups yet.
                                    </TableCell>
                                </TableRow>
                            )}
                            {signups.data.map((signup) => (
                                <TableRow key={signup.id}>
                                    <TableCell className="font-medium">
                                        {signup.name ?? '—'}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {signup.email}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${ROLE_BADGE[signup.role]}`}
                                        >
                                            {signup.role}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(
                                            signup.created_at,
                                        ).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {signups.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            Showing {signups.from}–{signups.to} of{' '}
                            {signups.total}
                        </span>
                        <div className="flex gap-1">
                            {signups.links.map((link, i) => (
                                <Button
                                    key={i}
                                    variant={link.active ? 'default' : 'ghost'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url && router.visit(link.url)
                                    }
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

AdminEarlyAccessIndex.layout = (page: React.ReactNode) => (
    <AdminLayout
        breadcrumbs={[
            { title: 'Admin Dashboard', href: '/admin' },
            { title: 'Early Access', href: '/admin/early-access' },
        ]}
    >
        {page}
    </AdminLayout>
);
