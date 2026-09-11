"use client";

/** A checklist row: shadcn Checkbox + label, with an optional strike-through and sub-line. */

import { Checkbox } from "@/components/ui/checkbox";

export function ChecklistRow({
  checked,
  onChange,
  label,
  subText,
  strike = false,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  subText?: string;
  strike?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 py-1.5">
      <Checkbox checked={checked} onCheckedChange={onChange} className="mt-0.5" />
      <span className="flex flex-col">
        <span className={`text-sm ${strike && checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
          {label}
        </span>
        {subText && <span className="text-xs text-muted-foreground">{subText}</span>}
      </span>
    </label>
  );
}
