import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { THEMES, type ThemeId, type ThemeSave } from "../lib/theme";

const SAVE_NOTE: Record<ThemeSave, { text: string; tone: string }> = {
  device: { text: "saved on this device — add Supabase keys to sync", tone: "text-faint" },
  saving: { text: "saving to Supabase…", tone: "text-warn" },
  cloud: { text: "saved to Supabase", tone: "text-live" },
  error: { text: "not saved to Supabase — run the settings migration", tone: "text-danger" },
};

type Props = {
  theme: ThemeId;
  save: ThemeSave;
  onChange: (next: ThemeId) => void;
};

export default function ThemePicker({ theme, save, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];
  const note = SAVE_NOTE[save];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative self-stretch">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="theme-menu"
        title={`Theme: ${current.name}`}
        className="flex h-full min-h-8 items-center rounded-md border border-line bg-panel px-2.5 transition-colors hover:border-accent"
      >
        <span aria-hidden className="grid grid-cols-2 gap-0.5">
          <span className="h-1.5 w-1.5 bg-accent" />
          <span className="h-1.5 w-1.5 bg-ok" />
          <span className="h-1.5 w-1.5 bg-live" />
          <span className="h-1.5 w-1.5 bg-danger" />
        </span>
        <span className="sr-only">Theme: {current.name}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="theme-menu"
            role="group"
            aria-label="Theme"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="absolute right-0 top-full z-50 mt-2 flex w-72 max-w-[calc(100vw-2rem)] origin-top-right flex-col gap-1 rounded-xl border border-line bg-ink p-2 shadow-2xl"
          >
            {THEMES.map((t) => {
              const on = t.id === theme;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange(t.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors ${
                    on ? "border-accent bg-panel-2" : "border-transparent hover:bg-panel-2"
                  }`}
                >
                  {/* Scoped data-theme: this swatch renders in the theme it previews. */}
                  <span
                    data-theme={t.id}
                    aria-hidden
                    className="flex h-11 w-16 shrink-0 items-end gap-1 overflow-hidden rounded-md border border-line bg-ink p-1.5"
                  >
                    <span
                      className="text-base leading-none text-fg"
                      style={{ fontFamily: "var(--font-display)", fontWeight: "var(--display-weight)" }}
                    >
                      Aa
                    </span>
                    <span className="ml-auto flex h-full items-end gap-0.5">
                      <span className="h-full w-1.5 bg-accent" />
                      <span className="h-3/4 w-1.5 bg-ok" />
                      <span className="h-1/2 w-1.5 bg-live" />
                      <span className="h-1/4 w-1.5 bg-danger" />
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-sm font-semibold text-fg">{t.name}</span>
                    <span className="tracked mt-0.5 block text-[9px] text-faint">{t.note}</span>
                  </span>
                  {on && <span className="tracked text-[9px] text-accent">on</span>}
                </button>
              );
            })}
            <p role="status" className={`tracked border-t border-line-soft px-2 pb-1 pt-3 text-[9px] ${note.tone}`}>
              {note.text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
