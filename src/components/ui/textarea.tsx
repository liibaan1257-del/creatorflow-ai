import type { ComponentProps } from "react";
import { Field, controlClasses, fieldIds, type FieldProps } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type TextareaProps = Omit<ComponentProps<"textarea">, "id"> & FieldProps & { id?: string };

export function Textarea({
  label,
  hint,
  error,
  id,
  name,
  className,
  required,
  rows = 4,
  ...props
}: TextareaProps) {
  const textareaId = id ?? name ?? label;
  const { describedBy } = fieldIds(textareaId, { hint, error });

  return (
    <Field id={textareaId} label={label} hint={hint} error={error} required={required}>
      <textarea
        id={textareaId}
        name={name}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={controlClasses(Boolean(error), cn("min-h-24 resize-y px-3 py-2 leading-relaxed", className))}
        {...props}
      />
    </Field>
  );
}
