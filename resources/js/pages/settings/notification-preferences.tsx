import { Head, useForm } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const TYPE_LABELS: Record<string, string> = {
    entry_submitted: 'Entry submitted',
    entry_approved: 'Entry approved',
    entry_rejected: 'Entry not accepted',
    entry_edit_requested: 'Edit requested on entry',
    entry_won: 'Contest won',
    payout_processed: 'Payout processed',
    new_message: 'New message received',
};

interface Preference {
    type: string;
    in_app_enabled: boolean;
    email_enabled: boolean;
}

interface Props {
    preferences: Preference[];
}

export default function NotificationPreferences({ preferences }: Props) {
    const { data, setData, put, processing } = useForm({ preferences });

    const updatePref = (index: number, field: 'in_app_enabled' | 'email_enabled', value: boolean) => {
        const updated = [...data.preferences];
        updated[index] = { ...updated[index], [field]: value };
        setData('preferences', updated);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/settings/notifications', {
            onSuccess: () => toast.success('Notification preferences saved.'),
        });
    };

    return (
        <>
            <Head title="Notification preferences" />
            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Notification preferences"
                    description="Choose how you want to be notified about activity on the platform."
                />
                <form onSubmit={submit} className="space-y-6">
                    {/* Column headers */}
                    <div className="grid grid-cols-[1fr_80px_80px] gap-4 px-1 text-xs font-medium text-muted-foreground">
                        <span>Event</span>
                        <span className="text-center">In-app</span>
                        <span className="text-center">Email</span>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        {data.preferences.map((pref, i) => (
                            <div key={pref.type} className="grid grid-cols-[1fr_80px_80px] items-center gap-4 px-1">
                                <div className="flex items-center gap-2">
                                    <Bell className="h-4 w-4 text-muted-foreground" />
                                    <Label htmlFor={`inapp-${pref.type}`} className="cursor-pointer text-sm font-normal">
                                        {TYPE_LABELS[pref.type] ?? pref.type}
                                    </Label>
                                </div>
                                <div className="flex justify-center">
                                    <Checkbox
                                        id={`inapp-${pref.type}`}
                                        checked={pref.in_app_enabled}
                                        onCheckedChange={(val) => updatePref(i, 'in_app_enabled', !!val)}
                                    />
                                </div>
                                <div className="flex justify-center">
                                    <Checkbox
                                        id={`email-${pref.type}`}
                                        checked={pref.email_enabled}
                                        onCheckedChange={(val) => updatePref(i, 'email_enabled', !!val)}
                                        disabled={pref.type === 'new_message'}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <Separator />
                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>
                            Save preferences
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
