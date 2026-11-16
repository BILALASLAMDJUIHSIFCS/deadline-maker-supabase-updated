// Theme choice. Same local-first model as the rest of the app: localStorage so
// the right theme paints instantly (index.html applies it before React loads),
// and the Supabase `settings` table as the durable copy shared across devices.

import { useEffect, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "./supabase";
import { tracked } from "./sync";

// The palette of each theme lives in src/index.css under [data-theme="<id>"].
export const THEMES = [
  { id: "ember", name: "Ember", note: "Black, dot-matrix, orange" },
  { id: "glacier", name: "Glacier", note: "Bright, soft, cobalt" },
  { id: "tide", name: "Tide", note: "Deep-sea glass, aqua" },
  { id: "riot", name: "Riot", note: "Lemon, black outlines" },
  { id: "atelier", name: "Atelier", note: "Forest, brass, serif" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

// "device" → Supabase not configured, the choice lives only in this browser
// "saving" → a request to Supabase is in flight
// "cloud"  → the choice is stored in Supabase
// "error"  → Supabase rejected the request; the choice is kept locally
export type ThemeSave = "device" | "saving" | "cloud" | "error";

type Stored = { theme: ThemeId; updatedAt: number };

const KEY = "deadline-maker:theme:v1"; // also read by the inline script in index.html
const TABLE = "settings";
const ROW_KEY = "theme";
const DEFAULT: Stored = { theme: "ember", updatedAt: 0 };

const isThemeId = (v: unknown): v is ThemeId => THEMES.some((t) => t.id === v);

function loadLocal(): Stored {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (parsed && isThemeId(parsed.theme)) {
      return { theme: parsed.theme, updatedAt: Number(parsed.updatedAt) || 0 };
    }
  } catch {
    /* storage unavailable or corrupt — fall back to the default */
  }
  return DEFAULT;
}

function saveLocal(stored: Stored): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    /* storage unavailable — the theme still applies for this session */
  }
}

// `undefined` → the request failed; `null` → no theme has been saved yet.
async function fetchRemote(): Promise<Stored | null | undefined> {
  const client = supabase;
  if (!client) return undefined;
  const result = await tracked("fetch theme", async () => {
    const { data, error } = await client
      .from(TABLE)
      .select("value, updated_at")
      .eq("key", ROW_KEY)
      .maybeSingle();
    if (error) throw error;
    return { row: data };
  });
  if (!result) return undefined;
  const { row } = result;
  if (!row || !isThemeId(row.value)) return null;
  return { theme: row.value, updatedAt: Number(row.updated_at) || 0 };
}

async function pushRemote(stored: Stored): Promise<boolean> {
  const client = supabase;
  if (!client) return false;
  const ok = await tracked("save theme", async () => {
    const { error } = await client
      .from(TABLE)
      .upsert({ key: ROW_KEY, value: stored.theme, updated_at: stored.updatedAt }, { onConflict: "key" });
    if (error) throw error;
    return true;
  });
  return ok === true;
}

export function useTheme(): { theme: ThemeId; setTheme: (next: ThemeId) => void; save: ThemeSave } {
  const [theme, setThemeState] = useState<ThemeId>(() => loadLocal().theme);
  const [save, setSave] = useState<ThemeSave>(isSupabaseConfigured ? "saving" : "device");
  // Counts explicit picks, so a slower, older request can't overwrite a newer one.
  const picks = useRef(0);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // On load and whenever the tab regains focus, reconcile with Supabase: the
  // most recently chosen theme wins, and a local-only choice is uploaded.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    async function reconcile() {
      const startedAt = picks.current;
      const stale = () => cancelled || picks.current !== startedAt;

      const remote = await fetchRemote();
      if (stale()) return;
      if (remote === undefined) {
        setSave("error");
        return;
      }
      const local = loadLocal();
      if (remote && remote.updatedAt >= local.updatedAt) {
        saveLocal(remote);
        setThemeState(remote.theme);
        setSave("cloud");
        return;
      }
      const ok = await pushRemote(local);
      if (!stale()) setSave(ok ? "cloud" : "error");
    }

    const onWake = () => {
      if (document.visibilityState === "visible") void reconcile();
    };
    void reconcile();
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
    };
  }, []);

  function setTheme(next: ThemeId) {
    const stored: Stored = { theme: next, updatedAt: Date.now() };
    saveLocal(stored);
    setThemeState(next);
    if (!isSupabaseConfigured) return;
    const pick = ++picks.current;
    setSave("saving");
    void pushRemote(stored).then((ok) => {
      if (picks.current === pick) setSave(ok ? "cloud" : "error");
    });
  }

  return { theme, setTheme, save };
}
