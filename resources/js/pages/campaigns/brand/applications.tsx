import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Check,
    X,
    User,
} from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Campaign, CampaignApplication, PaginatedData } from '@/types';

type Props = {
    campaign: Campaign;
    applications: PaginatedData<CampaignApplication>;
};

const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
};

export default function CampaignApplications({
    campaign,
    applications,
}: Props) {
    const { props } = usePage();
    const flash = (props as { flash?: { success?: string; error?: string } })
        .flash;

    function approve(applicationId: string) {
        router.post(
            `/campaigns/${campaign.id}/applications/${applicationId}/approve`,
        );
    }

    function reject(applicationId: string) {
        if (!confirm('Reject this application?')) {
            return;
        }

        router.post(
            `/campaigns/${campaign.id}/applications/${applicationId}/reject`,
        );
    }

    return (
        <>
            <Head title={`Applications — ${campaign.title}`} />

            <div className="mx-auto max-w-3xl px-4 py-6">
                {flash?.success && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                        <CheckCircle2 className="size-4 shrink-0" />
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        <AlertCircle className="size-4 shrink-0" />
                        {flash.error}
                    </div>
                )}

                <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="mb-4 gap-1"
                >
                    <Link href={`/campaigns/${campaign.id}`}>
                        <ArrowLeft className="size-4" />
                        Back to campaign
                    </Link>
                </Button>

                <Heading
                    title="Applications"
                    description={`Pitch applications for "${campaign.title}"`}
                />

                {applications.data.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                            <User className="size-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                No applications yet.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {applications.data.map((app) => (
                            <Card key={app.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                                                <User className="size-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-sm">
                                                    {app.creator
                                                        ?.display_name ??
                                                        app.creator?.user
                                                            ?.name ??
                                                        'Creator'}
                                                </CardTitle>
                                                {app.creator?.niches &&
                                                    app.creator.niches.length >
                                                        0 && (
                                                        <div className="mt-1 flex gap-1">
                                                            {app.creator.niches
                                                                .slice(0, 3)
                                                                .map((n) => (
                                                                    <Badge
                                                                        key={
                                                                            n.id
                                                                        }
                                                                        variant="secondary"
                                                                        className="text-xs"
                                                                    >
                                                                        {n.name}
                                                                    </Badge>
                                                                ))}
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[app.status] ?? ''}`}
                                        >
                                            {app.status}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {app.pitch && (
                                        <p className="mb-3 text-sm text-muted-foreground">
                                            {app.pitch}
                                        </p>
                                    )}
                                    <p className="mb-3 text-xs text-muted-foreground">
                                        Applied{' '}
                                        {new Date(
                                            app.created_at,
                                        ).toLocaleDateString()}
                                    </p>
                                    {app.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => approve(app.id)}
                                                className="gap-1"
                                            >
                                                <Check className="size-3.5" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => reject(app.id)}
                                                className="gap-1"
                                            >
                                                <X className="size-3.5" />
                                                Reject
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {applications.last_page > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                        {applications.links.map((link, i) => (
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

CampaignApplications.layout = {
    breadcrumbs: [
        { title: 'Campaigns', href: '/campaigns' },
        { title: 'Applications', href: '#' },
    ],
};
