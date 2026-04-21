import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

type Industry = {
    id: string;
    name: string;
    slug: string;
};

type BrandProfile = {
    company_name?: string;
    website?: string;
    industry_id?: string;
    description?: string;
} | null;

type Props = {
    industries: Industry[];
    profile: BrandProfile;
};

const BRAND_STEPS = [
    { label: 'Company' },
    { label: 'Billing' },
    { label: 'Tour' },
];

export default function BrandCompany({ industries, profile }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        company_name: profile?.company_name ?? '',
        website: profile?.website ?? '',
        industry_id: profile?.industry_id ?? '',
        description: profile?.description ?? '',
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/onboarding/brand/company');
    }

    return (
        <>
            <Head title="Company Profile" />

            <form onSubmit={submit} className="space-y-6">
                <div className="grid gap-2">
                    <Label htmlFor="company_name">Company name</Label>
                    <Input
                        id="company_name"
                        value={data.company_name}
                        onChange={(e) =>
                            setData('company_name', e.target.value)
                        }
                        required
                        autoFocus
                        placeholder="Your company name"
                    />
                    <InputError message={errors.company_name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="industry_id">Industry</Label>
                    <Select
                        value={data.industry_id}
                        onValueChange={(value) => setData('industry_id', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select your industry" />
                        </SelectTrigger>
                        <SelectContent>
                            {industries.map((industry) => (
                                <SelectItem
                                    key={industry.id}
                                    value={industry.id}
                                >
                                    {industry.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.industry_id} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="website">
                        Website{' '}
                        <span className="text-muted-foreground">
                            (optional)
                        </span>
                    </Label>
                    <Input
                        id="website"
                        type="url"
                        value={data.website}
                        onChange={(e) => setData('website', e.target.value)}
                        placeholder="https://yourcompany.com"
                    />
                    <InputError message={errors.website} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="description">
                        About your company{' '}
                        <span className="text-muted-foreground">
                            (optional)
                        </span>
                    </Label>
                    <textarea
                        id="description"
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="Tell us about your company and what you're looking for"
                        maxLength={1000}
                    />
                    <InputError message={errors.description} />
                </div>

                <Button type="submit" className="w-full" disabled={processing}>
                    {processing && <Spinner />}
                    Continue
                </Button>
            </form>
        </>
    );
}

BrandCompany.layout = {
    title: 'Set up your company',
    description:
        "Let's get to know your brand so we can match you with the right creators.",
    steps: BRAND_STEPS,
    currentStep: 0,
};
