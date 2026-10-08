"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Bookmark, Moon, RotateCcw, Sun } from "lucide-react";
import { createDefaultConfig, hasUserChanges, uid } from "@/lib/config";
import {
  applyResolution,
  detectConflicts,
  type Resolution,
} from "@/lib/conflicts";
import { getGroup, getOption } from "@/lib/options";
import { applyPreset } from "@/lib/presets";
import { orderedSections } from "@/lib/sections";
import {
  browserStore,
  loadConfig,
  loadUserPresets,
  saveConfig,
  saveUserPresets,
  THEME_KEY,
  type KeyValueStore,
} from "@/lib/storage";
import type { Config, Mode, Preset, SectionId } from "@/lib/types";
import {
  EditorContext,
  type EditorApi,
  type FocusRequest,
  type ToastTone,
} from "./editor-context";
import { PresetsDialog } from "./PresetsDialog";
import { PreviewPane } from "./PreviewPane";
import { RevisionEditor } from "./RevisionEditor";
import { ConfirmDialog, cx, Segmented, Button } from "./ui";
import { SectionNav, Workspace } from "./Workspace";

type View = "configure" | "preview";
type Theme = "dark" | "light";

const isDesktop = () => window.matchMedia("(min-width: 1024px)").matches;

type Toast = { id: number; message: string; tone: ToastTone };

/** Read persisted state synchronously. Safe because this component renders client-only. */
function boot() {
  const store = browserStore();
  const c = store
    ? loadConfig(store)
    : { value: createDefaultConfig(), recovered: false };
  const p = store ? loadUserPresets(store) : { value: [], recovered: false };
  let notice: Toast | null = null;
  if (c.recovered) {
    notice = {
      id: 0,
      tone: "info",
      message:
        "Your saved configuration couldn’t be read, so this is a fresh start.",
    };
  } else if (p.recovered) {
    notice = {
      id: 0,
      tone: "info",
      message: "Some saved presets couldn’t be read and were skipped.",
    };
  } else if (!store) {
    notice = {
      id: 0,
      tone: "error",
      message:
        "This browser isn’t allowing local storage, so changes won’t survive a refresh.",
    };
  }
  return { store, config: c.value, presets: p.value, notice };
}

export function PromptPicker() {
  const [initial] = useState(boot);
  const [config, setConfig] = useState<Config>(initial.config);
  const [userPresets, setUserPresets] = useState<Preset[]>(initial.presets);
  const [active, setActive] = useState<SectionId>("context");
  const [view, setView] = useState<View>("configure");
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "light" ? "light" : "dark",
  );
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);
  const [toast, setToast] = useState<Toast | null>(initial.notice);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pendingPreset, setPendingPreset] = useState<Preset | null>(null);

  const storeRef = useRef<KeyValueStore | null>(initial.store);
  const centerRef = useRef<HTMLDivElement>(null);
  const scrollMemory = useRef<Record<View, number>>({
    configure: 0,
    preview: 0,
  });

  const notify = useCallback((message: string, tone: ToastTone = "success") => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  // Persist on every change. A failed write (quota, revoked permission) is reported once.
  const saveFailed = useRef(false);
  useEffect(() => {
    const store = storeRef.current;
    if (!store || saveFailed.current) return;
    if (!saveConfig(store, config)) {
      saveFailed.current = true;
      queueMicrotask(() =>
        notify(
          "Couldn’t save to browser storage, so recent changes may not survive a refresh.",
          "error",
        ),
      );
    }
  }, [config, notify]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(
      () => setToast(null),
      toast.tone === "error" ? 6000 : 2600,
    );
    return () => clearTimeout(t);
  }, [toast]);

  const conflicts = useMemo(() => detectConflicts(config), [config]);
  const isRevisionProject = config.selected.includes("kind.revision");
  const sections = useMemo(
    () => orderedSections(isRevisionProject),
    [isRevisionProject],
  );

  const update = useCallback((fn: (c: Config) => Config) => setConfig(fn), []);

  const scrollToTop = useCallback(() => {
    requestAnimationFrame(() => {
      if (isDesktop()) centerRef.current?.scrollTo({ top: 0 });
      else window.scrollTo({ top: 0 });
    });
  }, []);

  // Each mobile view keeps its own scroll position; restore it after the switch renders.
  const viewRef = useRef<View>(view);
  const switchView = useCallback((next: View) => {
    if (next === viewRef.current) return;
    scrollMemory.current[viewRef.current] = window.scrollY;
    setView(next);
  }, []);
  useLayoutEffect(() => {
    if (viewRef.current === view) return;
    viewRef.current = view;
    if (!isDesktop()) window.scrollTo({ top: scrollMemory.current[view] });
  }, [view]);

  const goToSection = useCallback(
    (id: SectionId, opts: { scroll?: boolean } = {}) => {
      setConfig((c) => (c.mode === "brief" ? c : { ...c, mode: "brief" }));
      setActive(id);
      switchView("configure");
      if (opts.scroll !== false) scrollToTop();
    },
    [scrollToTop, switchView],
  );

  const resolve = useCallback(
    (r: Resolution) => {
      if (r.type === "scopeOption") {
        const section =
          getGroup(getOption(r.optionId)?.group ?? "")?.section ?? "context";
        goToSection(section, { scroll: false });
        setFocusRequest({ kind: "qualifier", optionId: r.optionId });
        return;
      }
      if (r.type === "scopePair") {
        goToSection("avoid", { scroll: false });
        setFocusRequest({ kind: "pairScope", pairId: r.pairId });
        return;
      }
      setConfig((c) => applyResolution(c, r));
      notify("Conflict resolved");
    },
    [goToSection, notify],
  );

  const clearFocusRequest = useCallback(() => setFocusRequest(null), []);

  const api: EditorApi = useMemo(
    () => ({
      config,
      update,
      conflicts,
      resolve,
      goToSection,
      focusRequest,
      clearFocusRequest,
      notify,
    }),
    [
      config,
      update,
      conflicts,
      resolve,
      goToSection,
      focusRequest,
      clearFocusRequest,
      notify,
    ],
  );

  function persistPresets(next: Preset[]) {
    setUserPresets(next);
    const ok = storeRef.current
      ? saveUserPresets(storeRef.current, next)
      : false;
    return ok;
  }

  function loadPresetNow(preset: Preset) {
    setConfig((c) => applyPreset(preset, c));
    setPendingPreset(null);
    setPresetsOpen(false);
    setActive("context");
    scrollToTop();
    notify(`Loaded “${preset.name}”. Every choice is still editable.`);
  }

  function requestPreset(preset: Preset) {
    if (hasUserChanges(config)) setPendingPreset(preset);
    else loadPresetNow(preset);
  }

  function savePreset(name: string) {
    const existing = userPresets.find(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    );
    const preset: Preset = {
      id: existing?.id ?? uid("preset"),
      name,
      description: "",
      builtIn: false,
      config: structuredClone(config),
    };
    const next = existing
      ? userPresets.map((p) => (p.id === existing.id ? preset : p))
      : [...userPresets, preset];
    if (persistPresets(next)) notify(`Saved preset “${name}”`);
    else
      notify(
        `Saved “${name}” for this session only — browser storage is unavailable.`,
        "error",
      );
  }

  function setMode(mode: Mode) {
    setConfig((c) => ({ ...c, mode }));
    scrollToTop();
  }

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // theme still applies for this visit
    }
  }

  const modeControl = (short: boolean) => (
    <Segmented<Mode>
      label="Mode"
      value={config.mode}
      onChange={setMode}
      className={short ? "w-full" : undefined}
      options={[
        { value: "brief", label: short ? "Brief" : "Design brief" },
        { value: "revision", label: short ? "Revision" : "Targeted revision" },
      ]}
    />
  );

  const isBrief = config.mode === "brief";

  return (
    <EditorContext.Provider value={api}>
      <div className="lg:flex lg:h-dvh lg:flex-col lg:overflow-clip">
        <header className="sticky top-0 z-30 border-b border-line bg-bg">
          <div className="flex h-12 items-center gap-3 px-4">
            <div className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className="size-3.5 shrink-0 rotate-45 rounded-[3px] bg-accent"
              />
              <h1 className="truncate text-sm font-semibold tracking-tight">
                Mango Planner
              </h1>
              <span className="hidden text-[13px] text-faint xl:inline">
                UI/UX prompt picker
              </span>
            </div>
            <div className="ml-4 hidden lg:block">{modeControl(false)}</div>
            <div className="ml-auto flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPresetsOpen(true)}
              >
                <Bookmark size={14} aria-hidden /> Presets
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmReset(true)}
              >
                <RotateCcw size={14} aria-hidden /> Reset
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleTheme}
                aria-label={
                  theme === "dark"
                    ? "Switch to light theme"
                    : "Switch to dark theme"
                }
                title={
                  theme === "dark"
                    ? "Switch to light theme"
                    : "Switch to dark theme"
                }
              >
                {theme === "dark" ? (
                  <Sun size={14} aria-hidden />
                ) : (
                  <Moon size={14} aria-hidden />
                )}
                <span className="hidden md:inline">
                  {theme === "dark" ? "Light" : "Dark"}
                </span>
              </Button>
            </div>
          </div>
          <div className="flex gap-2 px-4 pb-2 lg:hidden">
            <div className="flex flex-1">{modeControl(true)}</div>
            <Segmented<View>
              label="View"
              value={view}
              onChange={switchView}
              className="flex-1"
              options={[
                { value: "configure", label: "Configure" },
                { value: "preview", label: "Preview" },
              ]}
            />
          </div>
        </header>

        <main
          className={cx(
            "lg:grid lg:min-h-0 lg:flex-1",
            isBrief
              ? "lg:grid-cols-[13.5rem_minmax(0,1fr)_minmax(22rem,27rem)] xl:grid-cols-[15rem_minmax(0,1fr)_minmax(24rem,32rem)]"
              : "lg:grid-cols-[minmax(0,1fr)_minmax(22rem,27rem)] xl:grid-cols-[minmax(0,1fr)_minmax(24rem,32rem)]",
          )}
        >
          {isBrief && (
            <div className="scroll-quiet relative hidden overflow-y-auto border-r border-line lg:block">
              <SectionNav
                sections={sections}
                active={active}
                onSelect={(id) => goToSection(id)}
              />
            </div>
          )}
          <div
            ref={centerRef}
            className={cx(
              "scroll-quiet relative lg:overflow-y-auto",
              view === "preview" && "max-lg:hidden",
            )}
          >
            {isBrief ? (
              <Workspace
                sections={sections}
                active={active}
                onSelect={(id) => goToSection(id)}
              />
            ) : (
              <RevisionEditor />
            )}
          </div>
          <aside
            aria-label="Prompt preview"
            className={cx(
              "scroll-quiet relative border-line bg-panel lg:overflow-y-auto lg:border-l",
              view === "configure" && "max-lg:hidden",
              "max-lg:min-h-[calc(100dvh-95px)]",
            )}
          >
            <PreviewPane onBrowsePresets={() => setPresetsOpen(true)} />
          </aside>
        </main>
      </div>

      <PresetsDialog
        open={presetsOpen}
        onClose={() => setPresetsOpen(false)}
        userPresets={userPresets}
        onLoad={requestPreset}
        onSave={savePreset}
        onDelete={(id) => {
          const name = userPresets.find((p) => p.id === id)?.name;
          persistPresets(userPresets.filter((p) => p.id !== id));
          notify(`Deleted preset “${name}”`);
        }}
      />
      <ConfirmDialog
        open={pendingPreset !== null}
        title={`Replace your current configuration?`}
        body={
          <>
            Loading &ldquo;{pendingPreset?.name}&rdquo; replaces your current
            selections and text. Save them as a preset first if you want to keep
            them.
          </>
        }
        confirmLabel="Replace configuration"
        onConfirm={() => pendingPreset && loadPresetNow(pendingPreset)}
        onCancel={() => setPendingPreset(null)}
      />
      <ConfirmDialog
        open={confirmReset}
        title="Reset the configuration?"
        body="This clears every selection, field, and custom instruction in both modes. Your saved presets are kept."
        confirmLabel="Reset everything"
        danger
        onConfirm={() => {
          setConfig(createDefaultConfig());
          setConfirmReset(false);
          setActive("context");
          scrollToTop();
          notify("Configuration reset");
        }}
        onCancel={() => setConfirmReset(false)}
      />

      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
      >
        {toast && (
          <p
            key={toast.id}
            className={cx(
              "pointer-events-auto max-w-md rounded-md border bg-raised px-3.5 py-2 text-[13px] text-fg shadow-[0_6px_24px_rgb(0_0_0/0.25)]",
              toast.tone === "error"
                ? "border-warn-line"
                : toast.tone === "info"
                  ? "border-line-strong"
                  : "border-accent-line",
            )}
          >
            <span
              aria-hidden
              className={cx(
                "mr-2 inline-block size-1.5 -translate-y-px rounded-full align-middle",
                toast.tone === "error"
                  ? "bg-warn"
                  : toast.tone === "info"
                    ? "bg-muted"
                    : "bg-ok",
              )}
            />
            {toast.message}
          </p>
        )}
      </div>
    </EditorContext.Provider>
  );
}
