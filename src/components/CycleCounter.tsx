import { useMemo } from "react";
import CornerGlow from "./CornerGlow";
import { dayKey, type Task } from "../lib/storage";
import {
  CYCLE_MINUTES,
  DAILY_TARGET_CYCLES,
  DAILY_TARGET_MINUTES,
  cycleCells,
  fmtCycles,
  fmtHM,
  summarizeDay,
} from "../lib/cycles";

// Today's work measured in 30-minute cycles: completed deadlines bank their
// time toward the daily goal, missed ones are tallied as lost time.
export default function CycleCounter({ tasks, now }: { tasks: Task[]; now: number }) {
  const today = dayKey(now);
  const day = useMemo(() => summarizeDay(tasks, today), [tasks, today]);
  const cells = useMemo(
    () => cycleCells(day.doneMinutes, day.missedMinutes),
    [day.doneMinutes, day.missedMinutes]
  );
  const goalHit = day.fullCycles >= DAILY_TARGET_CYCLES;

  return (
    <section
      aria-label="Daily cycle counter"
      className="panel relative isolate mt-6 overflow-hidden rounded-2xl border border-line bg-panel"
    >
      <CornerGlow />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line-soft px-5 py-3">
        <span className="tracked text-[10px] text-accent">[ cycle counter ]</span>
        <span className="ml-auto tracked text-[10px] text-faint">
          1 cycle = {CYCLE_MINUTES}m · goal {DAILY_TARGET_CYCLES} a day
        </span>
      </div>

      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`display text-6xl leading-none tabular-nums ${goalHit ? "text-ok" : "text-fg"}`}
              >
                {day.fullCycles}
              </span>
              <span className="display text-2xl text-muted tabular-nums">/{DAILY_TARGET_CYCLES}</span>
            </div>
            <div className="tracked mt-2 text-[10px] text-faint">cycles completed today</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm text-fg tabular-nums">
              {fmtHM(day.doneMinutes)} <span className="text-faint">of {fmtHM(DAILY_TARGET_MINUTES)}</span>
            </div>
            <div className={`tracked mt-1.5 text-[10px] ${goalHit ? "text-ok" : "text-muted"}`}>
              {goalHit ? "daily goal reached" : `${fmtCycles(day.leftMinutes)} cycles to go`}
            </div>
          </div>
        </div>

        <div
          role="img"
          aria-label={`${fmtCycles(day.doneMinutes)} of ${DAILY_TARGET_CYCLES} cycles completed, ${fmtCycles(
            day.missedMinutes
          )} missed`}
          className="mt-6 grid grid-cols-11 gap-1 sm:grid-cols-33 sm:gap-[3px]"
        >
          {cells.map((cell, i) => (
            <div key={i} className="flex h-6 flex-col-reverse overflow-hidden rounded-[2px] bg-track sm:h-10">
              <div
                className="w-full shrink-0 bg-ok transition-[height] duration-500"
                style={{ height: `${cell.done * 100}%` }}
              />
              <div
                className="w-full shrink-0 bg-danger transition-[height] duration-500"
                style={{ height: `${cell.missed * 100}%` }}
              />
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 tracked text-[9px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[2px] bg-ok" /> completed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[2px] bg-danger" /> missed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[2px] bg-track" /> still to do
          </span>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <CycleStat
            value={`${day.bankedMinutes}m`}
            label="in this cycle"
            detail={`${CYCLE_MINUTES - day.bankedMinutes}m to next`}
            color="text-fg"
          />
          <CycleStat
            value={fmtCycles(day.missedMinutes)}
            label="cycles missed"
            detail={`${fmtHM(day.missedMinutes)} lost`}
            color={day.missedMinutes > 0 ? "text-danger" : "text-fg"}
          />
          <CycleStat
            value={fmtCycles(day.leftMinutes)}
            label="cycles left"
            detail={`${fmtHM(day.leftMinutes)} of work`}
            color="text-fg"
          />
        </div>
      </div>
    </section>
  );
}

function CycleStat({
  value,
  label,
  detail,
  color,
}: {
  value: string;
  label: string;
  detail: string;
  color: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-line-soft bg-panel-2 px-3 py-3">
      <div className={`display text-3xl leading-none tabular-nums ${color}`}>{value}</div>
      <div className="tracked mt-1.5 text-[8px] text-faint">{label}</div>
      <div className="mt-1 font-mono text-[11px] text-muted tabular-nums">{detail}</div>
    </div>
  );
}
