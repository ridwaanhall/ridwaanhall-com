"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { CalendarIcon, ChevronIcon } from "@/components/admin/admin-icons";
import { useEscape } from "@/lib/utils/use-modal";
import { useHydrated, useOutsidePointer, usePopoverPosition } from "@/lib/utils/use-popover";
import { cn } from "@/lib/utils/cn";

/**
 * A date field with a calendar this site draws.
 *
 * Two kinds arrive here and they are not the same problem:
 *
 *   - **`date`** was an `<input type="date">`, so it had a picker -- the
 *     operating system's, in the OS's colours, and on Firefox/Linux a rather
 *     different one from Chrome/Windows. The value was never in doubt; the
 *     panel was.
 *   - **`datetime`** had *no picker at all*. It fell through the type ladder in
 *     `field.tsx` to `type="text"`, so all nine of them were a box you typed an
 *     ISO 8601 timestamp into by hand and hoped. That is the bigger fix.
 *
 * The native input stays and is still what posts, for the reasons written up on
 * `AdminSelect`: the form saves without JavaScript, and a real control is what
 * a browser can restore and autofill.
 *
 * ## Time zones
 *
 * The column is `timestamptz`. It arrives as a UTC ISO string and
 * `parseFormValues` puts it back through `new Date(text).toISOString()`, which
 * reads a bare `YYYY-MM-DDTHH:mm` as **local** time -- so the round trip is
 * correct as long as what is displayed is local too. `toLocalInput` below is
 * that conversion, and it is deliberately not `toISOString().slice(0, 16)`,
 * which is the same string in the *wrong* zone and silently shifts every
 * timestamp by the reader's offset on the first save that touches the record.
 */

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** `YYYY-MM-DD` in local time. */
function toDateInput(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** `YYYY-MM-DDTHH:mm` in local time -- what `datetime-local` accepts. */
function toLocalInput(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${toDateInput(date)}T${hours}:${minutes}`;
}

/**
 * The stored value as the native input wants it.
 *
 * A `date` column arrives as `YYYY-MM-DD` already and must be left alone:
 * putting it through `new Date()` reads it as UTC midnight, which is the
 * *previous day* for anyone west of Greenwich.
 */
export function toInputValue(stored: string, withTime: boolean): string {
  if (!stored) return "";
  if (!withTime) return stored.slice(0, 10);
  const parsed = new Date(stored);
  return Number.isNaN(parsed.getTime()) ? "" : toLocalInput(parsed);
}

/** The calendar's own idea of a day, free of any time or zone. */
function parseDay(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function AdminDatePicker({
  id,
  name,
  value,
  onValueChange,
  withTime,
  required,
  describedBy,
  invalid,
  className,
}: {
  id?: string;
  name: string;
  /** `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm`, already local. */
  value: string;
  onValueChange: (next: string) => void;
  withTime: boolean;
  required?: boolean;
  describedBy?: string;
  invalid?: boolean;
  className?: string;
}) {
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => parseDay(value), [value]);
  const [month, setMonth] = useState(() => startOfMonth(selected ?? new Date()));

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEscape(open, close);
  useOutsidePointer(open, () => setOpen(false), triggerRef, panelRef);
  const placement = usePopoverPosition(open, triggerRef, panelRef);

  /*
   * Open on the stored month, not on whatever month was last browsed to.
   * Adjusted during render rather than in an effect, as `search-modal.tsx`
   * does -- a `setState` in an effect body is a cascading render.
   */
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) setMonth(startOfMonth(selected ?? new Date()));
  }

  const time = withTime ? (value.slice(11, 16) || "00:00") : "";

  const pickDay = (day: Date) => {
    onValueChange(withTime ? `${toDateInput(day)}T${time}` : toDateInput(day));
    if (!withTime) close();
  };

  const setTime = (next: string) => {
    const day = selected ?? new Date();
    onValueChange(`${toDateInput(day)}T${next}`);
  };

  return (
    <>
      <input
        id={hydrated ? undefined : id}
        name={name}
        type={withTime ? "datetime-local" : "date"}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        hidden={hydrated}
        required={required}
        aria-describedby={describedBy || undefined}
        aria-invalid={invalid ? true : undefined}
        className={className}
      />

      {hydrated && (
        <button
          ref={triggerRef}
          id={id}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-describedby={describedBy || undefined}
          onClick={() => setOpen((current) => !current)}
          className={cn("flex items-center justify-between gap-2 text-left", className)}
        >
          <span className={cn("truncate", !value && "text-zinc-500")}>
            {value ? readable(value, withTime) : withTime ? "No date or time" : "No date"}
          </span>
          <CalendarIcon height={14} width={14} className="shrink-0 text-zinc-500" />
        </button>
      )}

      {hydrated &&
        open &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Choose a date"
            className="admin-popover fixed z-50 w-[17.5rem] p-2"
            style={{
              top: placement?.top ?? -9999,
              left: placement?.left ?? -9999,
              visibility: placement ? "visible" : "hidden",
            }}
          >
            <div className="mb-1 flex items-center justify-between px-1">
              <MonthButton label="Previous month" onClick={() => setMonth(addMonths(month, -1))}>
                <ChevronIcon className="rotate-180" />
              </MonthButton>
              <span className="text-xs font-medium text-zinc-200">
                {MONTHS[month.getMonth()]} {month.getFullYear()}
              </span>
              <MonthButton label="Next month" onClick={() => setMonth(addMonths(month, 1))}>
                <ChevronIcon />
              </MonthButton>
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="py-1 text-center text-[0.625rem] font-medium tracking-wide text-zinc-500 uppercase"
                >
                  {day}
                </div>
              ))}
              {monthGrid(month).map((day) => (
                <DayCell
                  key={day.toISOString()}
                  day={day}
                  inMonth={day.getMonth() === month.getMonth()}
                  isToday={sameDay(day, new Date())}
                  isSelected={selected !== null && sameDay(day, selected)}
                  onPick={() => pickDay(day)}
                />
              ))}
            </div>

            {withTime && (
              <div className="mt-2 flex items-center gap-2 border-t border-zinc-800 pt-2">
                <label htmlFor={`${id}-time`} className="w-fit text-xs text-zinc-400">
                  Time
                </label>
                {/*
                  A native time input, and deliberately so. Its picker is a pair
                  of spin fields rather than a panel, so there is no OS surface
                  to replace -- and the alternative, two number boxes, loses the
                  locale's 12/24-hour convention for nothing.
                */}
                <input
                  id={`${id}-time`}
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value || "00:00")}
                  className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
                />
                <button
                  type="button"
                  onClick={close}
                  className="ml-auto rounded-md border border-zinc-800 px-2 py-1 text-xs text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
                >
                  Done
                </button>
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

function MonthButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
    >
      {children}
    </button>
  );
}

function DayCell({
  day,
  inMonth,
  isToday,
  isSelected,
  onPick,
}: {
  day: Date;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      aria-current={isToday ? "date" : undefined}
      onClick={onPick}
      className={cn(
        "admin-option rounded-md py-1 text-center text-xs",
        isSelected && "admin-day-selected",
        !inMonth && "text-zinc-600",
        isToday && !isSelected && "admin-day-today",
        isSelected && "bg-indigo-500 text-white hover:bg-indigo-500",
      )}
    >
      {day.getDate()}
    </button>
  );
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, by: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + by, 1);
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Six weeks, always.
 *
 * A grid that is five rows one month and six the next changes the panel's
 * height as the arrows are pressed, which moves the buttons out from under the
 * pointer. Weeks start on Monday, which is what the site's own dates assume.
 */
function monthGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
  return Array.from(
    { length: 42 },
    (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index),
  );
}

/** What the trigger shows: the stored value, in the reader's own format. */
function readable(value: string, withTime: boolean): string {
  const day = parseDay(value);
  if (!day) return value;
  const date = day.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return withTime ? `${date}, ${value.slice(11, 16)}` : date;
}
