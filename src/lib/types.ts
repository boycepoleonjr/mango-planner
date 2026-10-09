// Shared types for option data, configuration state, and generated output.

export type SectionId =
  | "context"
  | "visual"
  | "layout"
  | "typography"
  | "color"
  | "interaction"
  | "states"
  | "avoid"
  | "preserve"
  | "references"
  | "acceptance";

export type SelectionType = "single" | "multi";

/** Heading in the generated prompt that an option's instruction lands under. */
export type OutputHeading =
  | "TASK"
  | "USER AND GOAL"
  | "VISUAL DIRECTION"
  | "LAYOUT AND HIERARCHY"
  | "INTERACTION REQUIREMENTS"
  | "STATES AND ACCESSIBILITY"
  | "RESPONSIVE BEHAVIOR"
  | "AVOID AND REPLACE"
  | "PRESERVE AND SCOPE"
  | "REFERENCES"
  | "ACCEPTANCE CRITERIA";

export interface PickerOption {
  /** Globally unique, e.g. "density.compact". */
  id: string;
  /** Picker group this option belongs to. */
  group: string;
  /** Category shown to the user (usually the group label). */
  category: string;
  label: string;
  /** Plain-language explanation for people who don't know the term. */
  description: string;
  /** Concrete instruction this option contributes to the prompt. */
  instruction: string;
  selectionType: SelectionType;
  /**
   * Options sharing a conflictGroup contradict each other when two or more are
   * selected without a qualifier scoping them to different areas.
   */
  conflictGroup?: string;
  /** Placeholder hint for the optional qualifier field. */
  qualifierHint?: string;
  /** Verifiable acceptance criterion derived from this option, if any. */
  criterion?: string;
  /** Short noun phrase used inside composed sentences (e.g. TASK). */
  phrase?: string;
}

export interface PickerGroup {
  id: string;
  section: SectionId;
  label: string;
  hint?: string;
  selectionType: SelectionType;
  maxSelections?: number;
  heading: OutputHeading;
  options: PickerOption[];
}

export interface OptionEdit {
  /** Optional scope or nuance appended to the instruction. */
  qualifier?: string;
  /** User rewrite of the default instruction. */
  instruction?: string;
}

export interface AvoidPair {
  id: string;
  avoid: string;
  use: string;
  /** Optional scope, e.g. "in data tables". Keeps the rule from being universal. */
  scope: string;
  enabled: boolean;
  builtIn: boolean;
}

export interface Reference {
  id: string;
  name: string;
  borrow: string;
  avoid: string;
}

export interface PreserveFields {
  functionality: string;
  components: string;
  routes: string;
  copy: string;
  mayChange: string;
  mustNotChange: string;
}

export interface ContextFields {
  projectName: string;
  customInterfaceType: string;
  targetUser: string;
  primaryGoal: string;
  primaryAction: string;
  constraints: string;
}

export interface DetailFields {
  headingFont: string;
  bodyFont: string;
  typographyNotes: string;
  accentColor: string;
  brandColors: string;
  radius: string;
}

export interface CriterionOverride {
  enabled: boolean;
  text?: string;
}

export interface RevisionItem {
  id: string;
  element: string;
  problem: string;
  change: string;
  preserve: string;
}

export type Mode = "brief" | "revision";
export type OutputLength = "concise" | "detailed";

export interface Config {
  version: 1;
  mode: Mode;
  outputLength: OutputLength;
  context: ContextFields;
  details: DetailFields;
  /** Selected option ids. Output order follows option definition order, not this order. */
  selected: string[];
  edits: Record<string, OptionEdit>;
  custom: Partial<Record<SectionId, string[]>>;
  avoidPairs: AvoidPair[];
  preserve: PreserveFields;
  references: Reference[];
  criteria: {
    overrides: Record<string, CriterionOverride>;
    custom: string[];
  };
  revision: RevisionItem[];
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  builtIn: boolean;
  config: Config;
}
