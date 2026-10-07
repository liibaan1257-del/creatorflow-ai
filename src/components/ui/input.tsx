import type { ComponentProps } from "react";
import { Field, controlClasses, fieldIds, type FieldProps } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type InputProps = Omit<ComponentProps<"input">, "id"> & FieldProps & { id?: string };

export function Input({ label, hint, error, id, name, className, required, ...props }: InputProps) {
  const inputId = id ?? name ?? label;
  const { describedBy } = fieldIds(inputId, { hint, error });

  return (
    <Field id={inputId} label={label} hint={hint} error={error} required={required}>
      <input
        id={inputId}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={controlClasses(Boolean(error), cn("h-10 px-3", className))}
        {...props}
      />
    </Field>
  );
}
