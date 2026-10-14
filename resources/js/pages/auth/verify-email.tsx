// Components
import { Form, Head } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useState } from 'react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { code as verifyCode, send } from '@/routes/verification';

const CODE_LENGTH = 6;

export default function VerifyEmail({ status }: { status?: string }) {
    const [code, setCode] = useState<string>('');

    return (
        <>
            <Head title="Email verification" />

            <div className="space-y-6">
                {status === 'verification-link-sent' && (
                    <div className="text-center text-sm font-medium text-green-600">
                        A new verification code has been sent to your email
                        address.
                    </div>
                )}

                <Form
                    {...verifyCode.form()}
                    className="space-y-4"
                    resetOnError
                    onError={() => setCode('')}
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="flex flex-col items-center justify-center space-y-3 text-center">
                                <InputOTP
                                    name="code"
                                    maxLength={CODE_LENGTH}
                                    value={code}
                                    onChange={(value) => setCode(value)}
                                    disabled={processing}
                                    pattern={REGEXP_ONLY_DIGITS}
                                    autoFocus
                                >
                                    <InputOTPGroup>
                                        {Array.from(
                                            { length: CODE_LENGTH },
                                            (_, index) => (
                                                <InputOTPSlot
                                                    key={index}
                                                    index={index}
                                                />
                                            ),
                                        )}
                                    </InputOTPGroup>
                                </InputOTP>
                                <InputError message={errors.code} />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={
                                    processing || code.length < CODE_LENGTH
                                }
                            >
                                {processing && <Spinner />}
                                Verify email
                            </Button>
                        </>
                    )}
                </Form>

                <Form {...send.form()}>
                    {({ processing }) => (
                        <div className="text-center text-sm text-muted-foreground">
                            Didn't get a code?{' '}
                            <button
                                type="submit"
                                disabled={processing}
                                className="cursor-pointer text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! disabled:opacity-50 dark:decoration-neutral-500"
                            >
                                Resend
                            </button>
                        </div>
                    )}
                </Form>

                <TextLink
                    href={logout()}
                    className="mx-auto block text-center text-sm"
                >
                    Log out
                </TextLink>
            </div>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Verify email',
    description:
        'Enter the 6-digit code we just emailed to you to verify your address.',
};
