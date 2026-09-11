"use client";

/**
 * A Kanban-style board for the week: one column per day, each split into
 * three meal-slot sections (breakfast/lunch/dinner), each holding a stack of
 * recipe cards. Columns scroll horizontally on narrow screens rather than
 * reflowing, so every day stays a fixed, easy-to-scan width. Cards can be
 * dragged between (and reordered within) slots and days, and clicking one
 * opens that recipe in the same edit drawer as the Recipes tab. Days that
 * have already passed are greyed out and read-only, and the board
 * auto-scrolls to today's column when it's part of the selected week.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRecipro } from "@/lib/recipro-context";
import { addDays, isPastDate, mondayFromWeekId, startOfToday } from "@/lib/dates";
import { DAYS, MEAL_SLOTS, type Assignment, type Day, type MealSlot, type Recipe } from "@/lib/types";

const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

/** Droppable ids for a slot look like `day:Mon:lunch`, distinct from any assignment id. */
const slotDroppableId = (day: Day, slot: MealSlot) => `day:${day}:${slot}`;
function parseSlotDroppableId(id: string): { day: Day; slot: MealSlot } | null {
  const [prefix, day, slot] = id.split(":");
  if (prefix !== "day") return null;
  return { day: day as Day, slot: slot as MealSlot };
}

function MealCardBody({ recipe }: { recipe: Recipe }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="font-heading text-sm font-medium text-foreground">{recipe.name}</div>
      <Badge variant="outline" className="w-fit">
        {recipe.cookTimeMin} min
      </Badge>
    </div>
  );
}

function MealCard({
  day,
  slot,
  assignment,
  recipe,
  isPast,
  onOpen,
}: {
  day: Day;
  slot: MealSlot;
  assignment: Assignment;
  recipe: Recipe;
  isPast: boolean;
  onOpen: (recipe: Recipe) => void;
}) {
  const { removeMeal } = useRecipro();
  // Not `disabled: isPast` here — that would mark the whole card
  // aria-disabled, blocking the click-to-view we still want on past meals.
  // Withholding `listeners` below is what actually prevents dragging it.
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: assignment.id,
    data: { day, slot },
  });

  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      size="sm"
      aria-label={`Open ${recipe.name}`}
      className={`cursor-pointer gap-1.5 px-3 ${isPast ? "" : "touch-none"} ${isDragging ? "opacity-40" : ""}`}
      onClick={() => onOpen(recipe)}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        onOpen(recipe);
      }}
      {...attributes}
      {...(isPast ? {} : listeners)}
    >
      <div className="flex items-start justify-between gap-2">
        <MealCardBody recipe={recipe} />
        <Button
          variant="ghost"
          size="icon-sm"
          className="-mt-1 -mr-1 shrink-0"
          aria-label={`Remove ${recipe.name} from ${day}`}
          disabled={isPast}
          // Dragging and opening are bound to the whole card; stop the click
          // (and the pointerdown that would start a drag) from reaching them
          // so removing doesn't also open the recipe or fight a drag.
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            removeMeal(day, assignment.id);
          }}
        >
          <X />
        </Button>
      </div>
    </Card>
  );
}

function MealSlotContent({
  day,
  slot,
  isPast,
  onOpenRecipe,
}: {
  day: Day;
  slot: MealSlot;
  isPast: boolean;
  onOpenRecipe: (recipe: Recipe) => void;
}) {
  const { days, recipes, findRecipe, addMeal } = useRecipro();
  const assignments = days[day].filter((a) => a.mealSlot === slot);
  const { setNodeRef, isOver } = useDroppable({ id: slotDroppableId(day, slot), disabled: isPast });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2 rounded-lg p-1 transition-colors ${
        isOver && !isPast ? "bg-primary/10 ring-1 ring-primary/30" : ""
      }`}
    >
      <SortableContext items={assignments.map((a) => a.id)} strategy={verticalListSortingStrategy}>
        {/* min-h-52 keeps an open slot a consistent height — room for ~3 cards even when it has fewer. */}
        <div className="flex min-h-52 flex-col gap-2">
          {assignments.map((assignment) => {
            const recipe = findRecipe(assignment.recipeId);
            return recipe ? (
              <MealCard
                key={assignment.id}
                day={day}
                slot={slot}
                assignment={assignment}
                recipe={recipe}
                isPast={isPast}
                onOpen={onOpenRecipe}
              />
            ) : null;
          })}
        </div>
      </SortableContext>

      <Select
        items={recipes.map((r) => ({ value: r.id, label: r.name }))}
        value=""
        disabled={isPast}
        onValueChange={(recipeId) => recipeId && addMeal(day, recipeId, slot)}
      >
        <SelectTrigger aria-label={`Add a ${slot} for ${day}`} className="w-full bg-background">
          <SelectValue placeholder="Add a meal…" />
        </SelectTrigger>
        <SelectContent>
          {recipes.map((recipe) => (
            <SelectItem key={recipe.id} value={recipe.id}>
              {recipe.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface DayColumnProps {
  day: Day;
  date: Date;
  isToday: boolean;
  isPast: boolean;
  /** True while any card anywhere on the board is being dragged — forces every
      section open so a drop target is never hidden behind a collapsed accordion. */
  forceOpenAll: boolean;
  registerNode: (day: Day, node: HTMLDivElement | null) => void;
  onOpenRecipe: (recipe: Recipe) => void;
}

function DayColumn({ day, date, isToday, isPast, forceOpenAll, registerNode, onOpenRecipe }: DayColumnProps) {
  const { days } = useRecipro();

  // Sections with a meal already planned start open; empty ones start
  // collapsed, except dinner (the app's original, most-used slot).
  const [openSlots, setOpenSlots] = useState<MealSlot[]>(() =>
    MEAL_SLOTS.filter((slot) => slot === "dinner" || days[day].some((a) => a.mealSlot === slot))
  );

  return (
    <div
      ref={(node) => registerNode(day, node)}
      className={`flex w-64 shrink-0 flex-col gap-2 rounded-2xl p-3 transition-colors ${
        isPast ? "bg-muted/25 opacity-60" : "bg-muted/50"
      } ${isToday && !isPast ? "ring-1 ring-primary/40" : ""}`}
    >
      <div className="flex items-baseline gap-1 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <span>{date.getDate()}</span>
        <span>{day}</span>
      </div>

      <Accordion
        multiple
        value={forceOpenAll ? [...MEAL_SLOTS] : openSlots}
        onValueChange={(value) => setOpenSlots(value as MealSlot[])}
        className="w-full flex-col gap-1 rounded-none border-none bg-transparent"
      >
        {MEAL_SLOTS.map((slot) => {
          const count = days[day].filter((a) => a.mealSlot === slot).length;
          return (
            <AccordionItem key={slot} value={slot} className="border-none data-open:bg-transparent">
              <AccordionTrigger className="gap-2 p-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase hover:no-underline">
                <span className="flex items-center gap-1.5">
                  {MEAL_SLOT_LABELS[slot]}
                  {count > 0 && (
                    <Badge variant="secondary" className="h-4 min-w-4 justify-center px-1 text-[10px] normal-case">
                      {count}
                    </Badge>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-0.5 pb-2">
                <MealSlotContent day={day} slot={slot} isPast={isPast} onOpenRecipe={onOpenRecipe} />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

export function WeekView({ onOpenRecipe }: { onOpenRecipe: (recipe: Recipe) => void }) {
  const { days, findRecipe, moveMeal, selectedWeekId } = useRecipro();
  const [activeId, setActiveId] = useState<string | null>(null);
  const columnNodes = useRef<Partial<Record<Day, HTMLDivElement>>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // This week's actual calendar dates, and which column (if any) is today —
  // recomputed only when the selected week changes, not on every render.
  const { dates, pastDays, todayDay } = useMemo(() => {
    const monday = mondayFromWeekId(selectedWeekId);
    const today = startOfToday();
    const dates = {} as Record<Day, Date>;
    const pastDays = {} as Record<Day, boolean>;

    DAYS.forEach((day, index) => {
      const date = addDays(monday, index);
      dates[day] = date;
      pastDays[day] = isPastDate(date);
    });

    const todayDay = DAYS.find((day) => dates[day].getTime() === today.getTime()) ?? null;

    return { dates, pastDays, todayDay };
  }, [selectedWeekId]);

  // Auto-scroll to today's column when it's part of the selected week.
  useEffect(() => {
    if (!todayDay) return;
    columnNodes.current[todayDay]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedWeekId, todayDay]);

  function registerNode(day: Day, node: HTMLDivElement | null) {
    if (node) columnNodes.current[day] = node;
  }

  /** Find which day currently holds an assignment id, and the assignment itself. */
  function locate(id: string): { day: Day; assignment: Assignment } | null {
    for (const day of DAYS) {
      const assignment = days[day].find((a) => a.id === id);
      if (assignment) return { day, assignment };
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const from = active.data.current as { day?: Day; slot?: MealSlot } | undefined;
    const fromDay = from?.day;
    const fromSlot = from?.slot;
    if (!fromDay || !fromSlot || pastDays[fromDay]) return;

    const overSlot = parseSlotDroppableId(overId);
    if (overSlot) {
      // Dropped on empty space within a slot section.
      if (pastDays[overSlot.day]) return;
      moveMeal(fromDay, activeId, overSlot.day, overSlot.slot, Infinity);
      return;
    }

    // Dropped on another card — resolve its day/slot from its sortable data.
    const to = over.data.current as { day?: Day; slot?: MealSlot } | undefined;
    const toDay = to?.day ?? fromDay;
    const toSlot = to?.slot ?? fromSlot;
    if (pastDays[toDay]) return;

    const toIndex = days[toDay].filter((a) => a.mealSlot === toSlot).findIndex((a) => a.id === overId);
    if (fromDay === toDay && fromSlot === toSlot && toIndex === days[fromDay].filter((a) => a.mealSlot === fromSlot).findIndex((a) => a.id === activeId)) {
      return;
    }
    moveMeal(fromDay, activeId, toDay, toSlot, toIndex === -1 ? Infinity : toIndex);
  }

  const active = activeId ? locate(activeId) : null;
  const activeRecipe = active ? findRecipe(active.assignment.recipeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      {/*
        pt-1 matters, not just cosmetic: with only overflow-x set, the CSS
        overflow spec forces overflow-y to "auto" too, which otherwise clips
        the top pixel of every card's ring/border against this container.
      */}
      <div className="flex gap-3 overflow-x-auto pt-1 pb-2">
        {DAYS.map((day) => (
          <DayColumn
            key={day}
            day={day}
            date={dates[day]}
            isToday={day === todayDay}
            isPast={pastDays[day]}
            forceOpenAll={activeId !== null}
            registerNode={registerNode}
            onOpenRecipe={onOpenRecipe}
          />
        ))}
      </div>
      <DragOverlay>
        {activeRecipe ? (
          <Card size="sm" className="w-64 gap-1.5 px-3 shadow-lg">
            <MealCardBody recipe={activeRecipe} />
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
