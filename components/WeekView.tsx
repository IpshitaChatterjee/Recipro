"use client";

/**
 * A Kanban-style board for the week: one column per day, each holding a
 * stack of recipe cards. Columns scroll horizontally on narrow screens
 * rather than reflowing, so every day stays a fixed, easy-to-scan width.
 * Cards can be dragged between (and reordered within) days. Days that have
 * already passed are greyed out and read-only, and the board auto-scrolls
 * to today's column when it's part of the selected week.
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRecipro } from "@/lib/recipro-context";
import { addDays, isPastDate, mondayFromWeekId, startOfToday } from "@/lib/dates";
import { DAYS, type Assignment, type Day, type Recipe } from "@/lib/types";

/** Droppable ids for a day column look like `day:Mon`, distinct from any assignment id. */
const dayDroppableId = (day: Day) => `day:${day}`;
const isDayDroppableId = (id: string): id is `day:${Day}` => id.startsWith("day:");

function MealCardBody({ recipe }: { recipe: Recipe }) {
  return (
    <>
      <div className="font-heading text-sm font-medium text-foreground">{recipe.name}</div>
      <Badge variant="outline" className="w-fit">
        {recipe.cookTimeMin} min IP
      </Badge>
    </>
  );
}

function MealCard({
  day,
  assignment,
  recipe,
  isPast,
}: {
  day: Day;
  assignment: Assignment;
  recipe: Recipe;
  isPast: boolean;
}) {
  const { removeMeal } = useRecipro();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: assignment.id,
    data: { day },
    disabled: isPast,
  });

  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      size="sm"
      className={`gap-1.5 px-3 ${isPast ? "" : "touch-none"} ${isDragging ? "opacity-40" : ""}`}
      {...(isPast ? {} : attributes)}
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
          // Dragging is bound to the whole card; stop the click reaching the
          // drag handlers so removing doesn't also start (or fight) a drag.
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => removeMeal(day, assignment.id)}
        >
          <X />
        </Button>
      </div>
    </Card>
  );
}

interface DayColumnProps {
  day: Day;
  date: Date;
  isToday: boolean;
  isPast: boolean;
  registerNode: (day: Day, node: HTMLDivElement | null) => void;
}

function DayColumn({ day, date, isToday, isPast, registerNode }: DayColumnProps) {
  const { days, recipes, findRecipe, addMeal } = useRecipro();
  const assignments = days[day];
  const { setNodeRef, isOver } = useDroppable({ id: dayDroppableId(day), disabled: isPast });

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        registerNode(day, node);
      }}
      className={`flex w-64 shrink-0 flex-col gap-3 rounded-2xl p-3 transition-colors ${
        isPast ? "bg-muted/25 opacity-60" : isOver ? "bg-primary/10 ring-2 ring-primary/30" : "bg-muted/50"
      } ${isToday && !isPast ? "ring-1 ring-primary/40" : ""}`}
    >
      <div className="flex items-baseline gap-1 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <span>{date.getDate()}</span>
        <span>{day}</span>
      </div>

      <SortableContext items={assignments.map((a) => a.id)} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-2 flex-col gap-2">
          {assignments.map((assignment) => {
            const recipe = findRecipe(assignment.recipeId);
            return recipe ? (
              <MealCard key={assignment.id} day={day} assignment={assignment} recipe={recipe} isPast={isPast} />
            ) : null;
          })}
        </div>
      </SortableContext>

      <Select
        items={recipes.map((r) => ({ value: r.id, label: r.name }))}
        value=""
        disabled={isPast}
        onValueChange={(recipeId) => recipeId && addMeal(day, recipeId)}
      >
        <SelectTrigger aria-label={`Add a meal for ${day}`} className="w-full bg-background">
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

export function WeekView() {
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
    const fromDay = active.data.current?.day as Day | undefined;
    if (!fromDay || pastDays[fromDay]) return;

    if (isDayDroppableId(overId)) {
      const toDay = overId.slice(4) as Day;
      if (pastDays[toDay]) return;
      moveMeal(fromDay, activeId, toDay, Infinity);
      return;
    }

    const toDay = (over.data.current?.day as Day | undefined) ?? fromDay;
    if (pastDays[toDay]) return;
    const toIndex = days[toDay].findIndex((a) => a.id === overId);
    if (fromDay === toDay && toIndex === days[fromDay].findIndex((a) => a.id === activeId)) return;
    moveMeal(fromDay, activeId, toDay, toIndex === -1 ? Infinity : toIndex);
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
      <div className="flex gap-3 overflow-x-auto pb-2">
        {DAYS.map((day) => (
          <DayColumn
            key={day}
            day={day}
            date={dates[day]}
            isToday={day === todayDay}
            isPast={pastDays[day]}
            registerNode={registerNode}
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
