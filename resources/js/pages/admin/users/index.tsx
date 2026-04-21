import { Head, router, usePage } from '@inertiajs/react';
import { Ban, Search, Shield, UserCheck, UserX } from 'lucide-react';
import { useRef } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';

interface Role {
    name: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    status: 'active' | 'suspended' | 'banned';
    email_verified_at: string | null;
    created_at: string;
    roles: Role[];
}

interface Paginator {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Filters {
    search?: string;
    role?: string;
    status?: string;
}

const STATUS_BADGE: Record<
    string,
    {
        label: string;
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
    }
> = {
    active: { label: 'Active', variant: 'default' },
    suspended: { label: 'Suspended', variant: 'secondary' },
    banned: { label: 'Banned', variant: 'destructive' },
};

const ROLE_BADGE: Record<string, string> = {
    admin: 'text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    brand: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    creator:
        'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400 border-green-200 dark:border-green-800',
};

export default function AdminUsersIndex({
    users,
    filters,
}: {
    users: Paginator;
    filters: Filters;
}) {
    const searchRef = useRef<HTMLInputElement>(null);
    const { auth } = usePage().props;
    const currentUserId = String(auth.user.id);

    function applyFilter(key: string, value: string) {
        router.get(
            route('admin.users.index'),
            { ...filters, [key]: value || undefined },
            { preserveScroll: true, replace: true },
        );
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilter('search', searchRef.current?.value ?? '');
    }

    function updateStatus(userId: string, status: string) {
        router.patch(
            route('admin.users.update-status', { user: userId }),
            { status },
            { preserveScroll: true },
        );
    }

    return (
        <>
            <Head title="Users — Admin" />

            <div className="space-y-6 p-6">
                <Heading
                    title="User Management"
                    description={`${users.total.toLocaleString()} total users`}
                />

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <form
                        onSubmit={handleSearch}
                        className="flex items-center gap-2"
                    >
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                ref={searchRef}
                                defaultValue={filters.search ?? ''}
                                placeholder="Search name or email…"
                                className="w-64 pl-9"
                            />
                        </div>
                        <Button type="submit" variant="secondary" size="sm">
                            Search
                        </Button>
                    </form>

                    <Select
                        defaultValue={filters.role ?? 'all'}
                        onValueChange={(v) =>
                            applyFilter('role', v === 'all' ? '' : v)
                        }
                    >
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All roles</SelectItem>
                            <SelectItem value="brand">Brand</SelectItem>
                            <SelectItem value="creator">Creator</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        defaultValue={filters.status ?? 'all'}
                        onValueChange={(v) =>
                            applyFilter('status', v === 'all' ? '' : v)
                        }
                    >
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                            <SelectItem value="banned">Banned</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Verified</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="w-24 text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="py-10 text-center text-muted-foreground"
                                    >
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                            {users.data.map((user) => {
                                const isSelf = user.id === currentUserId;
                                const statusMeta =
                                    STATUS_BADGE[user.status] ??
                                    STATUS_BADGE.active;

                                return (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">
                                                    {user.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles.map((role) => (
                                                    <span
                                                        key={role.name}
                                                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[role.name] ?? ''}`}
                                                    >
                                                        {role.name ===
                                                            'admin' && (
                                                            <Shield className="size-3" />
                                                        )}
                                                        {role.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <Badge variant={statusMeta.variant}>
                                                {statusMeta.label}
                                            </Badge>
                                        </TableCell>

                                        <TableCell>
                                            {user.email_verified_at ? (
                                                <span className="text-sm text-green-600 dark:text-green-400">
                                                    Yes
                                                </span>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">
                                                    No
                                                </span>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(
                                                user.created_at,
                                            ).toLocaleDateString()}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            {isSelf ? (
                                                <span className="text-xs text-muted-foreground">
                                                    You
                                                </span>
                                            ) : (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                        >
                                                            Actions
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                updateStatus(
                                                                    user.id,
                                                                    'active',
                                                                )
                                                            }
                                                            disabled={
                                                                user.status ===
                                                                'active'
                                                            }
                                                        >
                                                            <UserCheck className="mr-2 size-4 text-green-500" />
                                                            Activate
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                updateStatus(
                                                                    user.id,
                                                                    'suspended',
                                                                )
                                                            }
                                                            disabled={
                                                                user.status ===
                                                                'suspended'
                                                            }
                                                        >
                                                            <UserX className="mr-2 size-4 text-yellow-500" />
                                                            Suspend
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                updateStatus(
                                                                    user.id,
                                                                    'banned',
                                                                )
                                                            }
                                                            disabled={
                                                                user.status ===
                                                                'banned'
                                                            }
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <Ban className="mr-2 size-4" />
                                                            Ban
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            Showing {users.from}–{users.to} of {users.total}
                        </span>
                        <div className="flex gap-1">
                            {users.links.map((link, i) => (
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

AdminUsersIndex.layout = (page: React.ReactNode) => (
    <AdminLayout
        breadcrumbs={[
            { title: 'Admin Dashboard', href: '/admin' },
            { title: 'Users', href: '/admin/users' },
        ]}
    >
        {page}
    </AdminLayout>
);
