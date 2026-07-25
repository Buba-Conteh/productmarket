import { Form, Head } from '@inertiajs/react';
import { Building2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type Role = 'brand' | 'creator';

const ROLES: {
    value: Role;
    title: string;
    description: string;
    icon: typeof Building2;
}[] = [
    {
        value: 'brand',
        title: 'Brand',
        description:
            'Launch campaigns and hire creators to promote your product.',
        icon: Building2,
    },
    {
        value: 'creator',
        title: 'Creator',
        description:
            'Discover campaigns, submit content, and earn from your views.',
        icon: Sparkles,
    },
];

type Props = {
    needsEmail?: boolean;
};

export default function SelectRole({ needsEmail = false }: Props) {
    const [selected, setSelected] = useState<Role | null>(null);

    return (
        <>
            <Head title="Choose your account type" />

            <Form
                action="/auth/select-role"
                method="post"
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <input
                            type="hidden"
                            name="role"
                            value={selected ?? ''}
                        />

                        <div className="grid gap-3">
                            {ROLES.map((role) => {
                                const Icon = role.icon;
                                const isActive = selected === role.value;

                                return (
                                    <button
                                        key={role.value}
                                        type="button"
                                        onClick={() => setSelected(role.value)}
                                        aria-pressed={isActive}
                                        className={cn(
                                            'flex items-start gap-4 rounded-lg border p-4 text-left transition-colors',
                                            isActive
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                : 'border-border hover:bg-muted/50',
                                        )}
                                    >
                                        <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                                        <span className="grid gap-1">
                                            <span className="font-medium">
                                                {role.title}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {role.description}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <InputError message={errors.role} />

                        {needsEmail && (
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <p className="text-xs text-muted-foreground">
                                    We'll use this for billing, receipts, and
                                    account notifications.
                                </p>
                                <InputError message={errors.email} />
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={processing || !selected}
                        >
                            {processing && <Spinner />}
                            Continue
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}

SelectRole.layout = {
    title: 'Choose your account type',
    description: 'Tell us how you want to use ProductMarket',
};
