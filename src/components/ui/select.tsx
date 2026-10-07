import type { ComponentProps } from "react";
import { Field, controlClasses, fieldIds, type FieldProps } from "@/components/ui/field";
import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string; disabled?: boolean };

type SelectProps = Omit<ComponentProps<"select">, "id" | "children"> &
  FieldProps & {
    id?: string;
    options: readonly SelectOption[];
    /** Optional first, empty option (e.g. "Choose a tone…"). */
    placeholder?: string;
  };

/**
 * Native <select> with custom styling: keyboard, screen-reader and mobile
 * pickers work out of the box, with no extra JavaScript.
 */
export function Select({
  label,
  hint,
  error,
  id,
  name,
  className,
  required,
  options,
  placeholder,
  ...props
}: SelectProps) {
  const selectId = id ?? name ?? label;
  const { describedBy } = fieldIds(selectId, { hint, error });

  return (
    <Field id={selectId} label={label} hint={hint} error={error} required={required}>
      <div className="relative">
        <select
          id={selectId}
          name={name}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={controlClasses(Boolean(error), cn("h-10 cursor-pointer appearance-none pr-9 pl-3", className))}
          {...props}
        >
          {placeholder !== undefined ? (
            <option value="" disabled={required}>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </Field>
  );
}
