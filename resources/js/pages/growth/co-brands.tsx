import { Head, useForm } from '@inertiajs/react';
import { Users } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CoBrand {
    id: string;
    brand_name: string;
    contribution_amount: number;
    contribution_pct: number;
    status: string;
}

interface Props {
    campaign: { id: string; title: string; type: string };
    co_brands: CoBrand[];
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
    invited: 'outline',
    accepted: 'default',
    declined: 'secondary',
};

export default function CoBrands({ campaign, co_brands }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        brand_email: '',
        contribution_amount: '',
    });

    const submit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        post(`/campaigns/${campaign.id}/co-brands`, { onSuccess: () => reset() });
    };

    return (
        <>
            <Head title={`Co-Brands — ${campaign.title}`} />
            <div className="space-y-6 px-4 py-6">
                <Heading
                    title="Co-Brand Sponsors"
                    description={`Invite another brand to co-sponsor "${campaign.title}".`}
                />

                <Card>
                    <CardHeader><CardTitle>Invite a Co-Sponsor</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="brand_email">Brand email address</Label>
                                <Input
                                    id="brand_email"
                                    type="email"
                                    value={data.brand_email}
                                    onChange={(e) => setData('brand_email', e.target.value)}
                                    placeholder="brand@company.com"
                                />
                                <InputError message={errors.brand_email} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="contribution_amount">Contribution amount ($)</Label>
                                <Input
                                    id="contribution_amount"
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={data.contribution_amount}
                                    onChange={(e) => setData('contribution_amount', e.target.value)}
                                    placeholder="500"
                                />
                                <InputError message={errors.contribution_amount} />
                            </div>
                            <Button type="submit" disabled={processing}>Send Invitation</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Co-Sponsors</CardTitle></CardHeader>
                    <CardContent>
                        {co_brands.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-10 text-center">
                                <Users className="h-10 w-10 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">No co-sponsors yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {co_brands.map((cb) => (
                                    <div key={cb.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="font-medium">{cb.brand_name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                ${Number(cb.contribution_amount).toLocaleString()} ({cb.contribution_pct}%)
                                            </p>
                                        </div>
                                        <Badge variant={STATUS_VARIANTS[cb.status] ?? 'outline'} className="capitalize">
                                            {cb.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
