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
        value: 'creator',
        title: 'Creator',
        description: 'Get notified when you can browse campaigns and earn.',
        icon: Sparkles,
    },
    {
        value: 'brand',
        title: 'Brand',
        description: 'Get notified when you can launch campaigns and hire.',
        icon: Building2,
    },
];

type Props = {
    status?: string;
};

export default function EarlyAccess({ status }: Props) {
    const [selected, setSelected] = useState<Role | null>(null);

    return (
        <>
            <Head title="Join early access" />

            <Form
                action="/early-access"
                method="post"
                resetOnSuccess={['name', 'email']}
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

                        <div className="grid gap-2">
                            <Label htmlFor="name">Name (optional)</Label>
                            <Input
                                id="name"
                                type="text"
                                name="name"
                                autoComplete="name"
                                placeholder="Jane Doe"
                            />
                            <InputError message={errors.name} />
                        </div>

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
                            <InputError message={errors.email} />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={processing || !selected}
                        >
                            {processing && <Spinner />}
                            Join the list
                        </Button>
                    </>
                )}
            </Form>

            {status && (
                <div className="text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </>
    );
}

EarlyAccess.layout = {
    title: 'Get early access',
    description:
        "Tell us who you are and we'll let you know as soon as it's your turn.",
};
