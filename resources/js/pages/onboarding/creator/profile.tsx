import { Head, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type CreatorProfile = {
    display_name?: string;
    bio?: string;
} | null;

type Props = {
    profile: CreatorProfile;
};

const CREATOR_STEPS = [
    { label: 'Profile' },
    { label: 'Niches' },
    { label: 'Social' },
    { label: 'Payout' },
];

export default function CreatorProfileStep({ profile }: Props) {
    const { auth } = usePage().props;
    const user = auth.user as { name: string; country?: string };

    const { data, setData, post, processing, errors } = useForm({
        display_name: profile?.display_name ?? user.name ?? '',
        bio: profile?.bio ?? '',
        country: (user.country as string) ?? '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/onboarding/creator/profile');
    }

    return (
        <>
            <Head title="Creator Profile" />

            <form onSubmit={submit} className="space-y-6">
                <div className="grid gap-2">
                    <Label htmlFor="display_name">Display name</Label>
                    <Input
                        id="display_name"
                        value={data.display_name}
                        onChange={(e) =>
                            setData('display_name', e.target.value)
                        }
                        required
                        autoFocus
                        placeholder="How creators and brands will see you"
                    />
                    <InputError message={errors.display_name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="bio">
                        Bio{' '}
                        <span className="text-muted-foreground">
                            (optional)
                        </span>
                    </Label>
                    <textarea
                        id="bio"
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        value={data.bio}
                        onChange={(e) => setData('bio', e.target.value)}
                        placeholder="Tell brands about yourself, your content style, and what you love creating"
                        maxLength={1000}
                    />
                    <InputError message={errors.bio} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="country">
                        Country code{' '}
                        <span className="text-muted-foreground">
                            (optional)
                        </span>
                    </Label>
                    <Input
                        id="country"
                        value={data.country}
                        onChange={(e) =>
                            setData(
                                'country',
                                e.target.value.toUpperCase().slice(0, 2),
                            )
                        }
                        placeholder="US, GB, NG..."
                        maxLength={2}
                    />
                    <InputError message={errors.country} />
                </div>

                <Button type="submit" className="w-full" disabled={processing}>
                    {processing && <Spinner />}
                    Continue
                </Button>
            </form>
        </>
    );
}

CreatorProfileStep.layout = {
    title: 'Set up your profile',
    description: 'This is how brands will see you on the platform.',
    steps: CREATOR_STEPS,
    currentStep: 0,
};
