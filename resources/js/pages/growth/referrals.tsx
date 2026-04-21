import { Head } from '@inertiajs/react';
import { CheckCircle, Clock, Copy, Gift, Users } from 'lucide-react';
import { useState } from 'react';
import { StatCard } from '@/components/dashboard/stat-card';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Referral {
    id: string;
    referred_name: string;
    type: string;
    status: string;
    qualified_at: string | null;
    rewarded_at: string | null;
    created_at: string;
}

interface Props {
    referral_code: string;
    referral_link: string;
    referrals: Referral[];
    stats: { total: number; qualified: number; rewarded: number };
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
    pending: 'outline',
    qualified: 'secondary',
    rewarded: 'default',
};

export default function Referrals({ referral_code, referral_link, referrals, stats }: Props) {
    const [copied, setCopied] = useState(false);

    const copy = () => {
        navigator.clipboard.writeText(referral_link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <Head title="Referrals" />
            <div className="space-y-6 px-4 py-6">
                <Heading title="Referrals" description="Invite others and earn bonuses when they join." />

                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard label="Total Referred" value={String(stats.total)} icon={Users} />
                    <StatCard label="Qualified" value={String(stats.qualified)} icon={CheckCircle} />
                    <StatCard label="Rewarded" value={String(stats.rewarded)} icon={Gift} accent="primary" />
                </div>

                <Card>
                    <CardHeader><CardTitle>Your Referral Link</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Share this link. When someone signs up and completes their first action, you earn a bonus.
                        </p>
                        <div className="flex gap-2">
                            <Input value={referral_link} readOnly className="font-mono text-sm" />
                            <Button variant="outline" onClick={copy} className="shrink-0 gap-2">
                                <Copy className="h-4 w-4" />
                                {copied ? 'Copied!' : 'Copy'}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Your code: <span className="font-mono font-semibold">{referral_code}</span>
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Referred Users</CardTitle></CardHeader>
                    <CardContent>
                        {referrals.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-10 text-center">
                                <Clock className="h-10 w-10 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">No referrals yet. Share your link to get started.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="pb-2 font-medium">Name</th>
                                            <th className="pb-2 font-medium">Type</th>
                                            <th className="pb-2 font-medium">Status</th>
                                            <th className="pb-2 font-medium">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {referrals.map((r) => (
                                            <tr key={r.id}>
                                                <td className="py-2.5 font-medium">{r.referred_name}</td>
                                                <td className="py-2.5 capitalize">{r.type}</td>
                                                <td className="py-2.5">
                                                    <Badge variant={STATUS_VARIANTS[r.status] ?? 'outline'} className="capitalize">
                                                        {r.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-2.5 text-muted-foreground">
                                                    {new Date(r.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
