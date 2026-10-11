import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { COUNTRIES, countryName } from '@/lib/countries';
import { cn } from '@/lib/utils';

type Props = {
    /** ISO 3166-1 alpha-2 code, or an empty string for no selection. */
    value: string;
    onChange: (code: string) => void;
    id?: string;
    placeholder?: string;
    className?: string;
};

export function CountrySelect({
    value,
    onChange,
    id,
    placeholder = 'Select a country',
    className,
}: Props) {
    const [open, setOpen] = useState(false);
    const selected = value.toUpperCase();

    function select(code: string) {
        onChange(code);
        setOpen(false);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <div className={cn('relative', className)}>
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            'w-full justify-between px-3 font-normal',
                            !value && 'text-muted-foreground',
                            value && 'pr-14',
                        )}
                    >
                        <span className="truncate">
                            {value ? countryName(value) : placeholder}
                        </span>
                        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>

                {value && (
                    <button
                        type="button"
                        aria-label="Clear country"
                        onClick={() => onChange('')}
                        className="absolute top-1/2 right-8 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
                    >
                        <X className="size-3.5" />
                    </button>
                )}
            </div>

            <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64">
                <Command>
                    <CommandInput placeholder="Search countries..." />
                    <CommandList>
                        <CommandEmpty>No country found.</CommandEmpty>
                        {COUNTRIES.map((country) => (
                            <CommandItem
                                key={country.code}
                                // Searchable by name or code (e.g. "nigeria" or "ng").
                                value={`${country.name} ${country.code}`}
                                onSelect={() => select(country.code)}
                            >
                                <Check
                                    className={cn(
                                        'size-4',
                                        selected === country.code
                                            ? 'opacity-100'
                                            : 'opacity-0',
                                    )}
                                />
                                <span className="truncate">{country.name}</span>
                                <span className="ml-auto text-xs text-muted-foreground">
                                    {country.code}
                                </span>
                            </CommandItem>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
