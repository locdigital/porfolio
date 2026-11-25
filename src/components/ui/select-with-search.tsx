"use client";

import { Check, ChevronDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { filterCommandItem } from "@/lib/command-search";
import { cn } from "@/lib/utils";

export interface SelectWithSearchOption {
  value: string;
  label: string;
  description?: string;
  keywords?: string;
  disabled?: boolean;
}

export interface SelectWithSearchProps {
  id?: string;
  name?: string;
  dataKey?: string;
  selectDataAttr?: string;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  header?: string;
  options: SelectWithSearchOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  allowDeselect?: boolean;
  disabled?: boolean;
  align?: "start" | "center" | "end";
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

export function SelectWithSearch({
  id,
  name,
  dataKey,
  selectDataAttr,
  label,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  header,
  options,
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  allowDeselect = true,
  disabled = false,
  align = "start",
  className,
  triggerClassName,
  contentClassName,
}: SelectWithSearchProps) {
  const generatedId = React.useId();
  const triggerId = id ? `${id}-trigger` : generatedId;
  const isControlled = controlledValue !== undefined;

  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const selectRef = React.useRef<HTMLSelectElement>(null);

  const currentValue = isControlled ? controlledValue : uncontrolledValue;
  const selectedOption = React.useMemo(
    () => options.find((opt) => opt.value === currentValue),
    [options, currentValue],
  );

  React.useEffect(() => {
    const handleBeforeSwap = () => {
      setOpen(false);
      setSearch("");
    };
    document.addEventListener("astro:before-swap", handleBeforeSwap);
    return () => {
      document.removeEventListener("astro:before-swap", handleBeforeSwap);
    };
  }, []);

  React.useEffect(() => {
    const selectEl = selectRef.current;
    if (!selectEl) return;
    if (selectEl.value !== currentValue) {
      selectEl.value = currentValue;
    }
  }, [currentValue]);

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearch("");
    }
  }, []);

  const handleSelect = React.useCallback(
    (optionValue: string) => {
      const nextValue =
        allowDeselect && optionValue === currentValue ? "" : optionValue;

      if (!isControlled) {
        setUncontrolledValue(nextValue);
      }

      onValueChange?.(nextValue);

      const selectEl = selectRef.current;
      if (selectEl && selectEl.value !== nextValue) {
        selectEl.value = nextValue;
        selectEl.dispatchEvent(new Event("change", { bubbles: true }));
      }

      const nextOption = options.find((opt) => opt.value === nextValue);
      rootRef.current?.dispatchEvent(
        new CustomEvent("dropdown:change", {
          bubbles: true,
          detail: {
            value: nextValue,
            label: nextOption?.label ?? "",
          },
        }),
      );

      setOpen(false);
      setSearch("");
    },
    [allowDeselect, currentValue, isControlled, onValueChange, options],
  );

  const extraSelectProps = React.useMemo(() => {
    if (!selectDataAttr || !selectDataAttr.startsWith("data-")) return {};
    return { [selectDataAttr]: "" };
  }, [selectDataAttr]);

  return (
    <div
      ref={rootRef}
      className={cn("ui-dropdown-root space-y-2", className)}
      data-dropdown={dataKey ?? name}
      data-open={open ? "true" : "false"}
    >
      {label && (
        <Label htmlFor={triggerId} className="block">
          {label}
        </Label>
      )}

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id={triggerId}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            data-active={currentValue ? "true" : "false"}
            className={cn(
              "w-full justify-between border-input bg-background px-3 text-[length:var(--text-body-sm)] font-normal text-foreground shadow-sm shadow-black/5 outline-offset-0 transition-colors hover:bg-[var(--dash-hover)] hover:text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20",
              triggerClassName,
            )}
          >
            <span
              className={cn(
                "truncate text-left",
                !selectedOption && "text-muted-foreground",
              )}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown
              size={16}
              strokeWidth={2}
              className={cn(
                "ms-2 shrink-0 text-muted-foreground/80 transition-transform duration-150",
                open && "rotate-180 text-foreground",
              )}
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          sideOffset={8}
          collisionPadding={12}
          className={cn(
            "w-[var(--radix-popper-anchor-width)] min-w-[min(calc(100vw-1.5rem),18rem)] overflow-hidden rounded-xl border-input p-0 shadow-xl shadow-black/10",
            contentClassName,
          )}
          align={align}
        >
          <Command
            filter={filterCommandItem}
            loop
            className="command-search-results [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:p-1.5 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-2"
          >
            <CommandInput
              className="text-[length:var(--text-body-sm)]"
              value={search}
              onValueChange={setSearch}
              placeholder={searchPlaceholder}
            />
            <CommandList className="max-h-[260px]">
              <CommandEmpty className="py-5 text-center text-sm text-muted-foreground">
                {emptyText}
              </CommandEmpty>
              <CommandGroup heading={header}>
                {options.map((option) => {
                  const isSelected = currentValue === option.value;
                  const keywords = [
                    option.value,
                    option.description,
                    ...(option.keywords
                      ? option.keywords.split(/\s+/).filter(Boolean)
                      : []),
                  ].filter((entry): entry is string => Boolean(entry));

                  return (
                    <CommandItem
                      key={option.value}
                      value={`${option.label} :: ${option.value}`}
                      keywords={keywords}
                      disabled={option.disabled}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span
                          className={cn(
                            "truncate text-foreground",
                            (option.description || isSelected) && "font-medium",
                          )}
                        >
                          {option.label}
                        </span>
                        {option.description && (
                          <span className="truncate text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Check
                          size={15}
                          strokeWidth={2}
                          className="ms-auto shrink-0 text-foreground"
                          aria-hidden="true"
                        />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {(id || name || selectDataAttr) && (
        <select
          ref={selectRef}
          id={id}
          name={name}
          value={currentValue}
          onChange={(event) => {
            const next = event.target.value;
            if (!isControlled) setUncontrolledValue(next);
            onValueChange?.(next);
          }}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          disabled={disabled}
          {...extraSelectProps}
        >
          {allowDeselect && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export { SelectWithSearch as Component };
export default SelectWithSearch;
