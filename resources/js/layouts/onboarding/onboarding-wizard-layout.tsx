import { Link } from '@inertiajs/react';
import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';

type Step = {
    label: string;
};

type Props = {
    children: ReactNode;
    title: string;
    description: string;
    steps: Step[];
    currentStep: number;
};

export default function OnboardingWizardLayout({
    children,
    title,
    description,
    steps,
    currentStep,
}: Props) {
    return (
        <div className="flex min-h-svh flex-col bg-background">
            <header className="flex items-center justify-center border-b px-6 py-4">
                <Link
                    href={home()}
                    className="flex items-center gap-2 font-medium"
                >
                    <AppLogoIcon className="size-7 fill-current text-foreground" />
                    <span className="text-lg font-semibold">ProductMarket</span>
                </Link>
            </header>

            {steps.length > 0 && (
                <nav className="flex justify-center border-b px-6 py-4">
                    <ol className="flex items-center gap-2">
                        {steps.map((step, index) => (
                            <li key={step.label} className="flex items-center">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                                            index < currentStep
                                                ? 'bg-primary text-primary-foreground'
                                                : index === currentStep
                                                  ? 'border-2 border-primary bg-background text-primary'
                                                  : 'border border-muted-foreground/30 bg-background text-muted-foreground'
                                        }`}
                                    >
                                        {index < currentStep ? (
                                            <Check className="size-4" />
                                        ) : (
                                            index + 1
                                        )}
                                    </span>
                                    <span
                                        className={`hidden text-sm sm:inline ${
                                            index <= currentStep
                                                ? 'font-medium text-foreground'
                                                : 'text-muted-foreground'
                                        }`}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`mx-3 h-px w-8 sm:w-12 ${
                                            index < currentStep
                                                ? 'bg-primary'
                                                : 'bg-muted-foreground/30'
                                        }`}
                                    />
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
            )}

            <main className="flex flex-1 flex-col items-center px-6 py-10">
                <div className="w-full max-w-lg">
                    <div className="mb-8 text-center">
                        <h1 className="text-2xl font-semibold">{title}</h1>
                        {description && (
                            <p className="mt-2 text-sm text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                    {children}
                </div>
            </main>
        </div>
    );
}
