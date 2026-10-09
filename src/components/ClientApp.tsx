"use client";

import dynamic from "next/dynamic";

// The picker reads localStorage during its first render, so it renders on the
// client only. The static HTML shows this lightweight shell until it mounts.
export const ClientApp = dynamic(
  () => import("./PromptPicker").then((m) => m.PromptPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh flex-col" aria-busy="true">
        <div className="flex h-12 items-center gap-2 border-b border-line px-4">
          <span
            aria-hidden
            className="size-3.5 rotate-45 rounded-[3px] bg-accent"
          />
          <span className="text-sm font-semibold tracking-tight">
            Mango Planner
          </span>
        </div>
        <p className="sr-only">Loading Mango Planner…</p>
      </div>
    ),
  },
);
