import OnboardingLayoutTemplate from '@/layouts/onboarding/onboarding-wizard-layout';

export default function OnboardingLayout({
    children,
    title = '',
    description = '',
    steps = [],
    currentStep = 0,
}: {
    children: React.ReactNode;
    title?: string;
    description?: string;
    steps?: { label: string }[];
    currentStep?: number;
}) {
    return (
        <OnboardingLayoutTemplate
            title={title}
            description={description}
            steps={steps}
            currentStep={currentStep}
        >
            {children}
        </OnboardingLayoutTemplate>
    );
}
