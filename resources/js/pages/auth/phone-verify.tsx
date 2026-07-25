import { Form, Head } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { Spinner } from '@/components/ui/spinner';

const OTP_LENGTH = 6;

type Props = {
    phone: string;
    status?: string;
};

export default function PhoneVerify({ phone, status }: Props) {
    const [code, setCode] = useState<string>('');

    return (
        <>
            <Head title="Verify your phone" />

            <div className="space-y-6">
                {status && (
                    <div className="text-center text-sm font-medium text-green-600">
                        {status}
                    </div>
                )}

                <Form
                    action="/auth/phone/verify"
                    method="post"
                    className="space-y-4"
                    resetOnError
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="flex flex-col items-center justify-center space-y-3 text-center">
                                <p className="text-sm text-muted-foreground">
                                    Enter the {OTP_LENGTH}-digit code sent to{' '}
                                    <span className="font-medium text-foreground">
                                        {phone}
                                    </span>
                                    .
                                </p>
                                <InputOTP
                                    name="code"
                                    maxLength={OTP_LENGTH}
                                    value={code}
                                    onChange={(value) => setCode(value)}
                                    disabled={processing}
                                    pattern={REGEXP_ONLY_DIGITS}
                                    autoFocus
                                >
                                    <InputOTPGroup>
                                        {Array.from(
                                            { length: OTP_LENGTH },
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
                                disabled={processing}
                            >
                                {processing && <Spinner />}
                                Verify &amp; continue
                            </Button>
                        </>
                    )}
                </Form>

                <Form action="/auth/phone/resend" method="post">
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
            </div>
        </>
    );
}

PhoneVerify.layout = {
    title: 'Verify your phone',
    description: 'Enter the code we sent to your phone',
};
