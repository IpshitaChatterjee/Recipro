"use client";

import { LayoutGrid, BookOpen } from "lucide-react";
import { Tabs as TabsRoot, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type TabKey = "week" | "recipes";

const TABS: { key: TabKey; label: string; Icon: typeof LayoutGrid }[] = [
  { key: "week", label: "Meal plan", Icon: LayoutGrid },
  { key: "recipes", label: "Recipes", Icon: BookOpen },
];

export function Tabs({ active, onChange }: { active: TabKey; onChange: (tab: TabKey) => void }) {
  return (
    <TabsRoot value={active} onValueChange={(value) => onChange(value as TabKey)}>
      <TabsList>
        {TABS.map(({ key, label, Icon }) => (
          <TabsTrigger key={key} value={key}>
            <Icon />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </TabsRoot>
  );
}
