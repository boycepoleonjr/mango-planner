import type { SectionId } from "./types";

export interface SectionMeta {
  id: SectionId;
  label: string;
  summary: string;
}

export const SECTIONS: SectionMeta[] = [
  {
    id: "context",
    label: "Project context",
    summary:
      "What you're designing, who it's for, and what they need to get done.",
  },
  {
    id: "visual",
    label: "Visual direction",
    summary:
      "The overall feel, translated into instructions you can inspect and edit.",
  },
  {
    id: "layout",
    label: "Layout and density",
    summary: "How content is arranged and how much fits on screen.",
  },
  {
    id: "typography",
    label: "Typography",
    summary: "How text establishes hierarchy. Font fields are optional.",
  },
  {
    id: "color",
    label: "Color, surfaces, shape",
    summary: "Theme, palette, how areas are separated, and corner style.",
  },
  {
    id: "interaction",
    label: "UX and interaction",
    summary:
      "How the interface behaves. Each choice becomes a concrete requirement.",
  },
  {
    id: "states",
    label: "States and accessibility",
    summary:
      "Component states, accessibility needs, and small-screen behavior.",
  },
  {
    id: "avoid",
    label: "Avoid and replace",
    summary:
      "Patterns to steer away from, each paired with what to do instead.",
  },
  {
    id: "preserve",
    label: "Preserve and scope",
    summary: "What must stay the same and what is allowed to change.",
  },
  {
    id: "references",
    label: "References",
    summary: "Products or sites to learn from, in your own words.",
  },
  {
    id: "acceptance",
    label: "Acceptance criteria",
    summary: "Checkable statements for judging the result.",
  },
];

/** Revision projects move Preserve up so it isn't an afterthought. */
export function orderedSections(isRevision: boolean): SectionMeta[] {
  if (!isRevision) return SECTIONS;
  const preserve = SECTIONS.find((s) => s.id === "preserve")!;
  const rest = SECTIONS.filter((s) => s.id !== "preserve");
  return [rest[0], preserve, ...rest.slice(1)];
}

export function sectionLabel(id: SectionId): string {
  return SECTIONS.find((s) => s.id === id)?.label ?? id;
}
