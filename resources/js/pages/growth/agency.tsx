import { Head, useForm } from '@inertiajs/react';
import { UserPlus, Users, X } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Member {
    id: string;
    name: string;
    email: string;
    role: string;
    invited_at: string;
    accepted_at: string | null;
}

interface Props {
    members: Member[];
    brand: { id: string; company_name: string; is_agency: boolean };
}

const ROLE_LABELS: Record<string, string> = { owner: 'Owner', manager: 'Manager', viewer: 'Viewer' };

export default function Agency({ members, brand }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        role: 'viewer',
    });

    const { delete: destroy, processing: removing } = useForm({});

    const submit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        post('/agency/members', { onSuccess: () => reset() });
    };

    const remove = (id: string) => {
        if (confirm('Remove this team member?')) {
            destroy(`/agency/members/${id}` as any);
        }
    };

    return (
        <>
            <Head title="Agency Team" />
            <div className="space-y-6 px-4 py-6">
                <Heading
                    title="Agency Team"
                    description={`Manage team members for ${brand.company_name}.`}
                />

                <Card>
                    <CardHeader><CardTitle>Invite Team Member</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="team@company.com"
                                    />
                                    <InputError message={errors.email} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Role</Label>
                                    <Select value={data.role} onValueChange={(v) => setData('role', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="manager">Manager</SelectItem>
                                            <SelectItem value="viewer">Viewer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button type="submit" disabled={processing} className="gap-2">
                                <UserPlus className="h-4 w-4" />
                                Send Invitation
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Team Members</CardTitle></CardHeader>
                    <CardContent>
                        {members.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-10 text-center">
                                <Users className="h-10 w-10 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">No team members yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {members.map((m) => (
                                    <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="font-medium">{m.name}</p>
                                            <p className="text-sm text-muted-foreground">{m.email}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{ROLE_LABELS[m.role] ?? m.role}</Badge>
                                            <Badge variant={m.accepted_at ? 'default' : 'secondary'}>
                                                {m.accepted_at ? 'Active' : 'Pending'}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                disabled={removing}
                                                onClick={() => remove(m.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
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
