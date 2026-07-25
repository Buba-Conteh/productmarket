import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';

export default function Phone() {
    return (
        <>
            <Head title="Continue with phone" />

            <Form
                action="/auth/phone"
                method="post"
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                name="phone"
                                required
                                autoFocus
                                autoComplete="tel"
                                inputMode="tel"
                                placeholder="+1 415 555 2671"
                            />
                            <p className="text-xs text-muted-foreground">
                                Use international format, including your country
                                code. We'll text you a verification code.
                            </p>
                            <InputError message={errors.phone} />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Send code
                        </Button>

                        <div className="text-center text-sm text-muted-foreground">
                            Prefer email?{' '}
                            <TextLink href={login()}>Log in</TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Phone.layout = {
    title: 'Continue with phone',
    description: "Enter your phone number and we'll send you a code",
};
