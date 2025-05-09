import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandEmpty,
  CommandInput,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, X } from "lucide-react";

export type Option = {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  disable?: boolean;
};

interface MultiSelectProps {
  options: Option[];
  selected: (string | number)[];
  onChange: (selected: (string | number)[]) => void;
  className?: string;
  placeholder?: string;
  badges?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  className,
  placeholder = "Select options",
  badges = true,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (item: string | number) => {
    onChange(selected.filter((i) => i !== item));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = e.target as HTMLInputElement;
    if (selected.length > 0 && input.value === "" && e.key === "Backspace") {
      onChange(selected.slice(0, -1));
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const selectAll = () => {
    onChange(
      options.filter((option) => !option.disable).map((option) => option.value)
    );
  };

  const clearAll = () => {
    onChange([]);
  };

  // Only show in the button when there are few selections
  const showInButton = selected.length <= 0;

  // Render selected tags inline (like in the image provided)
  const renderSelectedTags = () => {
    if (selected.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {selected.map((item) => {
          const option = options.find((o) => o.value === item);
          if (!option) return null;

          return (
            <Badge
              key={item}
              variant="secondary"
              className="flex items-center gap-1 px-3 py-1.5 rounded-full"
            >
              <div className="flex items-center gap-1.5">
                {option.icon}
                <span className="text-sm">{option.label}</span>
              </div>
              <button
                type="button"
                className="ml-1 rounded-full outline-none opacity-70 hover:opacity-100"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleUnselect(item);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Badge>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {showInButton ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <span>{selected.length} selected</span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search sources..." />
            <div className="flex items-center px-2 pt-2">
              <div className="flex ml-auto gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  className="h-8 px-2 text-xs"
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="h-8 px-2 text-xs"
                >
                  Clear All
                </Button>
              </div>
            </div>
            <CommandList onKeyDown={handleKeyDown}>
              <CommandEmpty>No source found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {options.map((option) => {
                  const isSelected = selected.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      disabled={option.disable}
                      onSelect={() => {
                        if (isSelected) {
                          onChange(
                            selected.filter((item) => item !== option.value)
                          );
                        } else {
                          onChange([...selected, option.value]);
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <Check className={cn("h-4 w-4")} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {option.icon}
                        <span>{option.label}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Display selected options as individual tags outside the dropdown */}
      {badges && renderSelectedTags()}
    </div>
  );
}
