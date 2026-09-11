"use client";

import { useMemo } from "react";
import { LogoMark } from "@/components/Icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { buildWeekOptions } from "@/lib/dates";
import { useRecipro } from "@/lib/recipro-context";

export function Header() {
  const { selectedWeekId, selectWeek } = useRecipro();
  const options = useMemo(() => buildWeekOptions(), []);

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 py-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <LogoMark size={20} />
        </div>
        <div>
          <h1 className="font-heading text-lg font-semibold text-foreground">Recipro</h1>
          <p className="text-sm text-muted-foreground">Weekly Instant Pot planning &mdash; pantry, recipes, prep</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="weekSelect" className="text-muted-foreground">
          Week
        </Label>
        <Select
          items={options.map((o) => ({ value: o.id, label: o.label }))}
          value={selectedWeekId}
          onValueChange={(value) => value && selectWeek(value)}
        >
          <SelectTrigger id="weekSelect" className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </header>
  );
}
