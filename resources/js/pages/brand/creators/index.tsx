import { Head, Link, router } from '@inertiajs/react';
import { Filter, Search, Users } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { CreatorSearchResult, PaginatedData, Platform } from '@/types';

type Niche = { id: string; name: string };

type Props = {
    creators: PaginatedData<CreatorSearchResult>;
    filters: Record<string, string | undefined>;
    niches: Niche[];
    platforms: Platform[];
};

function formatCount(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

export default function BrandCreatorSearch({
    creators,
    filters,
    niches,
    platforms,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function applyFilter(key: string, value: string | undefined) {
        const updated = { ...filters, [key]: value || undefined };
        if (!value) delete updated[key];
        router.get('/creators', updated, { preserveState: true });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilter('search', search);
    }

    const hasFilters = Object.keys(filters).some((k) => filters[k]);

    return (
        <>
            <Head title="Find Creators" />

            <div className="px-4 py-6">
                <Heading
                    title="Find Creators"
                    description="Browse verified creators by niche, platform, followers, and location"
                />

                {/* Filters */}
                <div className="mb-6 space-y-4">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name or bio..."
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit" variant="outline">
                            Search
                        </Button>
                    </form>

                    <div className="flex flex-wrap gap-3">
                        <Select
                            value={filters.niche_id ?? ''}
                            onValueChange={(v) =>
                                applyFilter('niche_id', v || undefined)
                            }
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="All niches" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All niches</SelectItem>
                                {niches.map((n) => (
                                    <SelectItem key={n.id} value={n.id}>
                                        {n.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.platform_id ?? ''}
                            onValueChange={(v) =>
                                applyFilter('platform_id', v || undefined)
                            }
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="All platforms" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All platforms</SelectItem>
                                {platforms.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Input
                            type="number"
                            placeholder="Min followers"
                            className="w-[140px]"
                            defaultValue={filters.min_followers ?? ''}
                            onBlur={(e) =>
                                applyFilter('min_followers', e.target.value)
                            }
                        />

                        <Input
                            type="number"
                            placeholder="Max followers"
                            className="w-[140px]"
                            defaultValue={filters.max_followers ?? ''}
                            onBlur={(e) =>
                                applyFilter('max_followers', e.target.value)
                            }
                        />

                        <Input
                            placeholder="Country"
                            className="w-[120px]"
                            defaultValue={filters.country ?? ''}
                            onBlur={(e) =>
                                applyFilter('country', e.target.value)
                            }
                        />

                        {hasFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    router.get(
                                        '/creators',
                                        {},
                                        { preserveState: true },
                                    )
                                }
                                className="gap-1"
                            >
                                <Filter className="size-3.5" />
                                Clear filters
                            </Button>
                        )}
                    </div>
                </div>

                {/* Results */}
                {creators.data.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                            <Users className="size-10 text-muted-foreground" />
                            <div>
                                <p className="font-medium">
                                    No creators found
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Try adjusting your filters.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {creators.data.map((creator) => {
                            const initials = creator.display_name
                                .split(' ')
                                .map((w) => w[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase();

                            const topAccount =
                                creator.social_accounts[0] ?? null;

                            return (
                                <Link
                                    key={creator.id}
                                    href={`/creators/${creator.id}`}
                                    className="block"
                                >
                                    <Card className="h-full transition-shadow hover:shadow-md">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start gap-3">
                                                <Avatar className="size-10 shrink-0">
                                                    <AvatarImage
                                                        src={
                                                            creator.user
                                                                .avatar ??
                                                            undefined
                                                        }
                                                        alt={
                                                            creator.display_name
                                                        }
                                                    />
                                                    <AvatarFallback>
                                                        {initials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0 flex-1">
                                                    <CardTitle className="line-clamp-1 text-sm">
                                                        {creator.display_name}
                                                    </CardTitle>
                                                    {creator.user.country && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {creator.user.country}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {creator.bio && (
                                                <p className="line-clamp-2 text-xs text-muted-foreground">
                                                    {creator.bio}
                                                </p>
                                            )}

                                            {creator.niches.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {creator.niches
                                                        .slice(0, 3)
                                                        .map((n) => (
                                                            <Badge
                                                                key={n.id}
                                                                variant="secondary"
                                                                className="text-xs"
                                                            >
                                                                {n.name}
                                                            </Badge>
                                                        ))}
                                                </div>
                                            )}

                                            {topAccount && (
                                                <div className="flex items-center justify-between rounded-md border p-2 text-xs">
                                                    <span className="font-medium">
                                                        {
                                                            topAccount.platform
                                                                .name
                                                        }{' '}
                                                        @{topAccount.handle}
                                                    </span>
                                                    <span className="font-semibold">
                                                        {formatCount(
                                                            topAccount.follower_count,
                                                        )}{' '}
                                                        followers
                                                    </span>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {creators.last_page > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                        {creators.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() =>
                                    link.url &&
                                    router.get(
                                        link.url,
                                        {},
                                        { preserveState: true },
                                    )
                                }
                                dangerouslySetInnerHTML={{
                                    __html: link.label,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

BrandCreatorSearch.layout = {
    breadcrumbs: [{ title: 'Find Creators', href: '/creators' }],
};
