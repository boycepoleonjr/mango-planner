"use client";

import { createContext, useContext } from "react";
import type { Conflict, Resolution } from "@/lib/conflicts";
import type { Config, SectionId } from "@/lib/types";

export type FocusRequest =
  | { kind: "qualifier"; optionId: string }
  | { kind: "pairScope"; pairId: string };

export type ToastTone = "success" | "error" | "info";

export interface EditorApi {
  config: Config;
  update: (fn: (c: Config) => Config) => void;
  conflicts: Conflict[];
  resolve: (r: Resolution) => void;
  goToSection: (id: SectionId) => void;
  focusRequest: FocusRequest | null;
  clearFocusRequest: () => void;
  notify: (message: string, tone?: ToastTone) => void;
}

export const EditorContext = createContext<EditorApi | null>(null);

export function useEditor(): EditorApi {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used inside EditorContext");
  return ctx;
}
