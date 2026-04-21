import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type Niche = {
    id: string;
    name: string;
    slug: string;
};

type Props = {
    niches: Niche[];
    selectedNiches: string[];
};

const CREATOR_STEPS = [
    { label: 'Profile' },
    { label: 'Niches' },
    { label: 'Social' },
    { label: 'Payout' },
];

export default function CreatorNiches({ niches, selectedNiches }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        niches: selectedNiches ?? ([] as string[]),
    });

    function toggleNiche(nicheId: string) {
        const current = data.niches;

        if (current.includes(nicheId)) {
            setData(
                'niches',
                current.filter((id) => id !== nicheId),
            );
        } else if (current.length < 5) {
            setData('niches', [...current, nicheId]);
        }
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/onboarding/creator/niches');
    }

    return (
        <>
            <Head title="Select Niches" />

            <form onSubmit={submit} className="space-y-6">
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Select up to 5 niches that best describe your content.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {niches.map((niche) => {
                            const selected = data.niches.includes(niche.id);

                            return (
                                <button
                                    key={niche.id}
                                    type="button"
                                    onClick={() => toggleNiche(niche.id)}
                                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                                        selected
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-border bg-background text-foreground hover:bg-muted'
                                    } ${
                                        !selected && data.niches.length >= 5
                                            ? 'cursor-not-allowed opacity-50'
                                            : ''
                                    }`}
                                    disabled={
                                        !selected && data.niches.length >= 5
                                    }
                                >
                                    {niche.name}
                                </button>
                            );
                        })}
                    </div>
                    <InputError message={errors.niches} />
                    <p className="text-xs text-muted-foreground">
                        {data.niches.length}/5 selected
                    </p>
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={processing || data.niches.length === 0}
                >
                    {processing && <Spinner />}
                    Continue
                </Button>
            </form>
        </>
    );
}

CreatorNiches.layout = {
    title: 'Pick your niches',
    description:
        'Help brands find you by choosing the content categories that match your style.',
    steps: CREATOR_STEPS,
    currentStep: 1,
};
