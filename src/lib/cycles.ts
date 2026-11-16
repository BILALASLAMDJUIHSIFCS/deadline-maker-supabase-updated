// Daily work is counted in cycles instead of hours: 30 minutes = 1 cycle, and
// the goal is 33 cycles (16h 30m) a day.

import { dayKey, type Task } from "./storage";

export const CYCLE_MINUTES = 30;
export const DAILY_TARGET_CYCLES = 33;
export const DAILY_TARGET_MINUTES = CYCLE_MINUTES * DAILY_TARGET_CYCLES;

// A deadline is worth the time it was set for, however early it was finished.
const plannedMinutes = (t: Task) => Math.max(0, Math.round((t.deadline - t.createdAt) / 60_000));

export type DaySummary = {
  doneMinutes: number;
  missedMinutes: number;
  fullCycles: number; // whole cycles completed
  bankedMinutes: number; // minutes already counted toward the next cycle
  leftMinutes: number; // still needed to reach the daily goal
};

// Totals for one calendar day (YYYY-MM-DD). A deadline counts on the day it was
// completed or missed, so the counter resets at local midnight.
export function summarizeDay(tasks: Task[], day: string): DaySummary {
  let doneMinutes = 0;
  let missedMinutes = 0;
  for (const t of tasks) {
    if (t.status === "active") continue;
    if (dayKey(t.resolvedAt ?? t.deadline) !== day) continue;
    if (t.status === "done") doneMinutes += plannedMinutes(t);
    else missedMinutes += plannedMinutes(t);
  }
  return {
    doneMinutes,
    missedMinutes,
    fullCycles: Math.floor(doneMinutes / CYCLE_MINUTES),
    bankedMinutes: doneMinutes % CYCLE_MINUTES,
    leftMinutes: Math.max(0, DAILY_TARGET_MINUTES - doneMinutes),
  };
}

export type CycleCell = { done: number; missed: number }; // each 0..1 of the cell

// One cell per cycle in the daily goal. Completed time fills from the first
// cell; missed time is laid out right after it.
export function cycleCells(doneMinutes: number, missedMinutes: number): CycleCell[] {
  return Array.from({ length: DAILY_TARGET_CYCLES }, (_, i) => {
    const start = i * CYCLE_MINUTES;
    const filled = (upTo: number) => Math.max(0, Math.min(1, (upTo - start) / CYCLE_MINUTES));
    const done = filled(doneMinutes);
    return { done, missed: filled(doneMinutes + missedMinutes) - done };
  });
}

// Minutes as cycles with at most one decimal: 50 → "1.7", 60 → "2".
export function fmtCycles(minutes: number): string {
  return String(Math.round((minutes / CYCLE_MINUTES) * 10) / 10);
}

export function fmtHM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}
