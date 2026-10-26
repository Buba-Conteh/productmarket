import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type Props = {
    enabled: boolean;
    yourBrand: boolean;
    brandedContent: boolean;
    onEnabledChange: (enabled: boolean) => void;
    onYourBrandChange: (checked: boolean) => void;
    onBrandedContentChange: (checked: boolean) => void;
};

function disclosureLabel(yourBrand: boolean, brandedContent: boolean) {
    if (brandedContent) {
        return "Your video will be labeled as 'Paid partnership'.";
    }

    if (yourBrand) {
        return "Your video will be labeled as 'Promotional content'.";
    }

    return null;
}

export function TikTokCommercialDisclosure({
    enabled,
    yourBrand,
    brandedContent,
    onEnabledChange,
    onYourBrandChange,
    onBrandedContentChange,
}: Props) {
    const label = disclosureLabel(yourBrand, brandedContent);
    const incomplete = enabled && !yourBrand && !brandedContent;

    return (
        <div className="space-y-3 rounded-lg border p-3">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                    <Label htmlFor="tiktok-disclose">
                        Disclose video content
                    </Label>
                    <p className="text-xs text-muted-foreground">
                        Turn on to disclose that this video promotes goods or
                        services in exchange for something of value. Your video
                        could promote yourself, a third party, or both.
                    </p>
                </div>
                <Switch
                    id="tiktok-disclose"
                    checked={enabled}
                    onCheckedChange={onEnabledChange}
                />
            </div>

            {enabled && (
                <div className="space-y-3">
                    {label && (
                        <p className="rounded-md bg-blue-50 p-2 text-xs text-blue-700">
                            {label} This cannot be changed once your video is
                            posted.
                        </p>
                    )}

                    <div className="flex items-start gap-2">
                        <Checkbox
                            id="tiktok-your-brand"
                            checked={yourBrand}
                            onCheckedChange={(v) =>
                                onYourBrandChange(v === true)
                            }
                        />
                        <div className="space-y-0.5">
                            <Label htmlFor="tiktok-your-brand">
                                Your brand
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                You are promoting yourself or your own business.
                                This video will be classified as Brand Organic.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2">
                        <Checkbox
                            id="tiktok-branded-content"
                            checked={brandedContent}
                            onCheckedChange={(v) =>
                                onBrandedContentChange(v === true)
                            }
                        />
                        <div className="space-y-0.5">
                            <Label htmlFor="tiktok-branded-content">
                                Branded content
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                You are promoting another brand or a third
                                party. This video will be classified as Branded
                                Content.
                            </p>
                        </div>
                    </div>

                    {incomplete && (
                        <p className="text-xs text-red-600">
                            You need to indicate if your content promotes
                            yourself, a third party, or both.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
