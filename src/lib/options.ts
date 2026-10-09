// Picker option data. Every option carries the concrete instruction it adds to
// the prompt; nothing here is emitted as a bare label.

import type {
  OutputHeading,
  PickerGroup,
  PickerOption,
  SectionId,
  SelectionType,
} from "./types";

type OptionSeed = Omit<
  PickerOption,
  "group" | "category" | "selectionType" | "id"
> & {
  id: string;
};

interface GroupSeed {
  id: string;
  section: SectionId;
  label: string;
  hint?: string;
  selectionType: SelectionType;
  maxSelections?: number;
  heading: OutputHeading;
  options: OptionSeed[];
}

function group(seed: GroupSeed): PickerGroup {
  return {
    ...seed,
    options: seed.options.map((o) => ({
      ...o,
      id: `${seed.id}.${o.id}`,
      group: seed.id,
      category: seed.label,
      selectionType: seed.selectionType,
    })),
  };
}

export const GROUPS: PickerGroup[] = [
  // 1. PROJECT CONTEXT
  group({
    id: "interface",
    section: "context",
    label: "Interface type",
    hint: "What kind of thing is being designed?",
    selectionType: "single",
    heading: "TASK",
    options: [
      {
        id: "dashboard",
        label: "Dashboard",
        phrase: "dashboard",
        description:
          "An overview screen people check to see how things are going.",
        instruction:
          "Lead with the few signals that drive decisions and link to detail views instead of placing every metric on one screen.",
      },
      {
        id: "admin",
        label: "Admin tool",
        phrase: "admin tool",
        description:
          "Internal screens for managing records, users, or settings.",
        instruction:
          "Optimize for fast, repeated task completion by experienced users over first-impression appeal.",
      },
      {
        id: "marketing",
        label: "Marketing website",
        phrase: "marketing website",
        description: "Pages that explain a product or company to new visitors.",
        instruction:
          "Explain what the product does and who it is for before asking visitors to act, and give every page one clear next step.",
      },
      {
        id: "landing",
        label: "Landing page",
        phrase: "landing page",
        description: "A single page built around one campaign or sign-up.",
        instruction:
          "Build the page around one conversion goal and remove navigation and links that compete with it.",
      },
      {
        id: "ecommerce",
        label: "E-commerce",
        phrase: "e-commerce experience",
        description: "Browsing, comparing, and buying products.",
        instruction:
          "Keep price, availability, and the add-to-cart action visible together, and make shipping costs clear before checkout.",
      },
      {
        id: "settings",
        label: "Settings interface",
        phrase: "settings interface",
        description: "Screens where people configure preferences or accounts.",
        instruction:
          "Group settings by the task they support, show each setting's current value, and make it clear when changes are saved.",
      },
      {
        id: "data-explorer",
        label: "Data explorer",
        phrase: "data explorer",
        description:
          "Searching, filtering, and inspecting large sets of records.",
        instruction:
          "Keep filters, the result count, and results visible together so people can see the effect of each filter immediately.",
      },
      {
        id: "onboarding",
        label: "Onboarding flow",
        phrase: "onboarding flow",
        description: "First-run steps that get a new user set up.",
        instruction:
          "Ask only for what is needed to reach first value, show progress through the steps, and let people skip optional steps.",
      },
      {
        id: "portfolio",
        label: "Portfolio",
        phrase: "portfolio",
        description: "A showcase of someone's work.",
        instruction:
          "Let the work lead: give projects the most visual weight and keep surrounding interface quiet.",
      },
      {
        id: "custom",
        label: "Custom",
        phrase: "interface",
        description: "Something else — describe it in your own words below.",
        instruction: "",
      },
    ],
  }),
  group({
    id: "kind",
    section: "context",
    label: "New or existing",
    hint: "Starting fresh, or improving something that already exists?",
    selectionType: "single",
    heading: "TASK",
    options: [
      {
        id: "new",
        label: "New design",
        phrase: "new",
        description: "There is no existing interface to work within.",
        instruction:
          "Treat this as a new design; there is no existing interface to preserve.",
      },
      {
        id: "revision",
        label: "Revise an existing interface",
        phrase: "existing",
        description:
          "Improve something that already works. Use “Preserve and scope” to protect what matters.",
        instruction:
          "Work within the existing interface: improve it incrementally and keep established patterns unless this brief asks to change them.",
      },
    ],
  }),
  group({
    id: "platform",
    section: "context",
    label: "Platform",
    selectionType: "single",
    heading: "TASK",
    options: [
      {
        id: "desktop-web",
        label: "Desktop web",
        phrase: "desktop web browsers",
        description: "Used mostly on laptops and large monitors.",
        instruction:
          "Design for desktop browsers from 1280px wide, and make sure layouts still work at 1024px.",
      },
      {
        id: "mobile-web",
        label: "Mobile web",
        phrase: "mobile web browsers",
        description: "Used mostly in a phone's browser.",
        instruction:
          "Design for phone browsers from 360px wide, with touch targets of at least 44×44px and the primary action within thumb reach.",
      },
      {
        id: "responsive-web",
        label: "Responsive web",
        phrase: "responsive web",
        description: "Must work well on phones, tablets, and desktops.",
        instruction:
          "Design for widths from 360px phones to wide desktop screens, defining how the layout changes at each breakpoint.",
      },
      {
        id: "mobile-app",
        label: "Mobile app",
        phrase: "a mobile app",
        description: "A native app on iOS or Android.",
        instruction:
          "Follow the target platform's navigation and control conventions, and respect safe areas and system gestures.",
      },
    ],
  }),

  // 2. VISUAL DIRECTION
  group({
    id: "aesthetic",
    section: "visual",
    label: "Aesthetic",
    hint: "Pick up to three. Each one becomes concrete, observable instructions you can edit.",
    selectionType: "multi",
    maxSelections: 3,
    heading: "VISUAL DIRECTION",
    options: [
      {
        id: "minimalist",
        label: "Minimalist",
        description: "Few elements, lots of restraint.",
        instruction:
          "Use restrained colors, few decorative elements, and clear hierarchy without hiding essential controls.",
      },
      {
        id: "utilitarian",
        label: "Utilitarian",
        description: "Function first; looks follow from use.",
        instruction:
          "Let function drive every visual decision: favor plain, legible controls and remove treatments that do not help a task.",
      },
      {
        id: "editorial",
        label: "Editorial",
        description: "Feels like a well-designed magazine.",
        instruction:
          "Use typographic contrast, deliberate column widths, and generous reading measure to create a clear reading order.",
      },
      {
        id: "precision",
        label: "Precision-oriented",
        description: "Exact, aligned, engineered.",
        instruction:
          "Use exact alignment, consistent spacing, clear state indicators, and restrained decoration.",
      },
      {
        id: "futuristic",
        label: "Futuristic",
        description: "Forward-looking without looking like a movie prop.",
        instruction:
          "Use geometric structure and precise accent treatments without cluttered sci-fi ornamentation.",
      },
      {
        id: "premium",
        label: "Premium",
        description: "Feels considered and high-quality.",
        instruction:
          "Prioritize deliberate typography, balanced spacing, and restrained surface treatment rather than gratuitous effects.",
      },
      {
        id: "playful",
        label: "Playful",
        description: "Friendly, lively, a bit of personality.",
        instruction:
          "Add personality through friendly copy, color, and illustration while keeping controls predictable and easy to scan.",
      },
      {
        id: "industrial",
        label: "Industrial",
        description: "Sturdy, mechanical, built to work.",
        instruction:
          "Use sturdy, high-contrast controls, visible structure such as rules and labels, and a limited, functional palette.",
      },
      {
        id: "warm",
        label: "Warm",
        description: "Approachable and human.",
        instruction:
          "Use warm neutrals, softer contrast between surfaces, and conversational copy, while keeping text contrast readable.",
      },
      {
        id: "geometric",
        label: "Geometric",
        description: "Built from clear shapes and a visible grid.",
        instruction:
          "Build compositions from simple shapes on a visible, consistent grid, and repeat proportions across components.",
      },
    ],
  }),

  // 3. LAYOUT AND DENSITY
  group({
    id: "layout",
    section: "layout",
    label: "Layout",
    hint: "Cards suit independently actionable summaries. Rows and tables suit records people compare.",
    selectionType: "multi",
    heading: "LAYOUT AND HIERARCHY",
    options: [
      {
        id: "grid",
        label: "Grid-based",
        description: "Content aligned to shared columns.",
        instruction:
          "Align content to a consistent column grid and let components span whole columns.",
      },
      {
        id: "asymmetric",
        label: "Asymmetric",
        description: "Deliberately unbalanced for emphasis.",
        instruction:
          "Use asymmetric column splits to give the most important content more space, keeping alignment to a shared grid.",
      },
      {
        id: "split-pane",
        label: "Split-pane",
        description: "Two panels side by side, like an editor and its output.",
        instruction:
          "Place the working area and its result side by side so changes are visible without switching views.",
      },
      {
        id: "sidebar",
        label: "Sidebar workspace",
        description:
          "Persistent navigation on the side, work area in the middle.",
        instruction:
          "Use a persistent side navigation for top-level areas and give the main work area most of the width.",
      },
      {
        id: "master-detail",
        label: "Master-detail",
        description:
          "A list on one side, the selected item's details on the other.",
        instruction:
          "Show a list of items alongside the selected item's detail, keeping the selection visible while viewing details.",
      },
      {
        id: "single-column",
        label: "Single-column",
        description: "One focused column, top to bottom.",
        instruction:
          "Use a single column with a comfortable maximum width so people read and act in one direction.",
      },
      {
        id: "cards",
        label: "Card-based summaries",
        description: "Self-contained cards, each with its own actions.",
        instruction:
          "Use cards only for independently actionable summaries, each with its own clear title and action.",
      },
      {
        id: "table-first",
        label: "Table or list-first",
        description: "Rows people can scan and compare.",
        instruction:
          "Present comparable records as rows or a table with aligned columns, consistent ordering, and sortable headers where useful.",
        criterion:
          "Comparable records use one consistent row or table presentation.",
      },
    ],
  }),
  group({
    id: "density",
    section: "layout",
    label: "Density",
    hint: "Combining densities is fine when you scope each one with a qualifier (e.g. “in data tables”).",
    selectionType: "multi",
    heading: "LAYOUT AND HIERARCHY",
    options: [
      {
        id: "compact",
        label: "Compact",
        description: "More information on screen at once.",
        conflictGroup: "density",
        qualifierHint: "e.g. in data tables",
        instruction:
          "Use compact density: tighter row heights and spacing so more information fits on screen, without shrinking controls below usable size.",
      },
      {
        id: "balanced",
        label: "Balanced",
        description: "A middle ground suitable for most screens.",
        conflictGroup: "density",
        qualifierHint: "e.g. on forms",
        instruction:
          "Use balanced density: moderate spacing that keeps information scannable without feeling crowded.",
      },
      {
        id: "spacious",
        label: "Spacious",
        description: "Plenty of room; fewer things per screen.",
        conflictGroup: "density",
        qualifierHint: "e.g. on the overview",
        instruction:
          "Use spacious density: generous spacing and fewer elements per view so each item gets attention.",
      },
    ],
  }),
  group({
    id: "spacing",
    section: "layout",
    label: "Spacing",
    selectionType: "multi",
    heading: "LAYOUT AND HIERARCHY",
    options: [
      {
        id: "scale",
        label: "Consistent spacing scale",
        description: "Use a small set of spacing values everywhere.",
        instruction:
          "Use a single spacing scale (for example 4, 8, 12, 16, 24, 32, 48px) and no one-off values.",
      },
      {
        id: "grouped",
        label: "Tight within groups, generous between",
        description: "Related things sit close; separate groups breathe.",
        instruction:
          "Keep spacing tight within related groups and noticeably larger between groups so structure is visible without extra borders.",
      },
      {
        id: "rhythm",
        label: "Strong vertical rhythm",
        description: "Consistent steps from top to bottom.",
        instruction:
          "Keep a consistent vertical rhythm by deriving line heights and vertical spacing from the same base unit.",
      },
      {
        id: "gutters",
        label: "Generous page gutters",
        description: "Comfortable margins at the edges of the page.",
        instruction:
          "Use generous page gutters on wide screens and at least 16px side margins on phones.",
      },
    ],
  }),

  // 4. TYPOGRAPHY AND HIERARCHY
  group({
    id: "type",
    section: "typography",
    label: "Hierarchy",
    selectionType: "multi",
    heading: "LAYOUT AND HIERARCHY",
    options: [
      {
        id: "heading-hierarchy",
        label: "Clear heading hierarchy",
        description: "Headings make the page structure obvious.",
        instruction:
          "Make heading levels visually distinct through size and weight, and never skip levels.",
      },
      {
        id: "dominant-primary",
        label: "Dominant primary action",
        description: "The main button clearly stands out.",
        instruction:
          "Give each view one primary action styled more prominently than all secondary actions.",
        criterion:
          "The primary action is clearly distinguishable from secondary actions.",
      },
      {
        id: "subdued-meta",
        label: "Subdued metadata",
        description: "Dates, IDs, and secondary details recede.",
        instruction:
          "Render metadata such as timestamps, IDs, and counts in a smaller or lower-contrast style than primary content, keeping it readable.",
      },
      {
        id: "contrast-headings",
        label: "High-contrast headings",
        description: "Headings jump out from body text.",
        instruction:
          "Give headings strong contrast with body text through weight and color so sections are easy to find while scanning.",
      },
      {
        id: "restrained-scale",
        label: "Restrained type scale",
        description: "Few font sizes, used consistently.",
        conflictGroup: "type-scale",
        qualifierHint: "e.g. inside the app",
        instruction:
          "Limit the interface to a small type scale of four to six sizes and reuse them consistently.",
      },
      {
        id: "readable-body",
        label: "Readable body text",
        description: "Comfortable size and line length for reading.",
        instruction:
          "Set body text at a comfortable size (16px or larger on web) with line lengths of roughly 60–80 characters.",
      },
      {
        id: "mono-data",
        label: "Monospaced data values",
        description: "Numbers and codes line up neatly.",
        instruction:
          "Use monospaced or tabular figures for numbers, IDs, and codes so values align in columns.",
      },
      {
        id: "expressive-display",
        label: "Expressive display typography",
        description: "Big, characterful type for headlines.",
        conflictGroup: "type-scale",
        qualifierHint: "e.g. in the hero only",
        instruction:
          "Use large, expressive display type for key headlines to establish identity, keeping body and interface text conventional.",
      },
    ],
  }),

  // 5. COLOR, SURFACES, AND SHAPE
  group({
    id: "theme",
    section: "color",
    label: "Theme",
    selectionType: "single",
    heading: "VISUAL DIRECTION",
    options: [
      {
        id: "light",
        label: "Light",
        description: "Dark text on light backgrounds.",
        instruction: "Design a light theme: dark text on light surfaces.",
      },
      {
        id: "dark",
        label: "Dark",
        description: "Light text on dark backgrounds.",
        instruction:
          "Design a dark theme: light text on dark surfaces, using lighter surface tones rather than shadows to show elevation.",
      },
      {
        id: "system",
        label: "System preference",
        description: "Follow the device's light/dark setting.",
        instruction:
          "Follow the operating system's light or dark preference, and design both palettes.",
      },
      {
        id: "both",
        label: "Support both light and dark",
        description: "Both themes, with a way to switch.",
        instruction:
          "Support both light and dark themes with a visible toggle, and check contrast in each theme.",
      },
    ],
  }),
  group({
    id: "palette",
    section: "color",
    label: "Color",
    selectionType: "multi",
    heading: "VISUAL DIRECTION",
    options: [
      {
        id: "neutral",
        label: "Neutral palette",
        description: "Mostly grays and quiet tones.",
        instruction:
          "Build the interface from a neutral palette and let content and key actions carry the color.",
      },
      {
        id: "restrained-accent",
        label: "Restrained accent usage",
        description: "One accent color, used sparingly.",
        instruction:
          "Use a single accent color, reserved for primary actions, selection, and focus.",
      },
      {
        id: "semantic",
        label: "Semantic status colors",
        description: "Consistent colors for success, warning, and error.",
        instruction:
          "Define consistent success, warning, error, and info colors, and use them only to communicate status.",
      },
      {
        id: "muted",
        label: "Muted saturation",
        description: "Softer, less intense colors.",
        instruction:
          "Use muted, lower-saturation colors for large areas so saturated color is reserved for emphasis.",
      },
      {
        id: "high-contrast-accent",
        label: "High-contrast accents",
        description: "Accents that clearly pop.",
        instruction:
          "Choose an accent that contrasts strongly with surrounding surfaces so highlighted elements are unmistakable.",
      },
    ],
  }),
  group({
    id: "surface",
    section: "color",
    label: "Surfaces",
    selectionType: "multi",
    heading: "VISUAL DIRECTION",
    options: [
      {
        id: "flat",
        label: "Flat",
        description: "No shadows or depth effects.",
        qualifierHint: "e.g. for content areas",
        instruction:
          "Keep surfaces flat: no shadows or depth effects; separate areas with spacing and color.",
      },
      {
        id: "tonal",
        label: "Tonal",
        description: "Areas separated by slightly different background shades.",
        instruction:
          "Separate areas with subtle differences in background tone instead of borders or shadows.",
      },
      {
        id: "outlined",
        label: "Subtly outlined",
        description: "Thin, quiet borders around areas.",
        instruction:
          "Define containers with thin, low-contrast borders rather than heavy shadows.",
      },
      {
        id: "layered",
        label: "Layered",
        description: "Panels visibly stacked on top of each other.",
        qualifierHint: "e.g. for menus and dialogs",
        instruction:
          "Use a clear layering model: base surface, raised panels, and overlays, each visually distinct.",
      },
      {
        id: "elevation",
        label: "Restrained elevation",
        description: "Light shadows only where something floats.",
        qualifierHint: "e.g. for overlays only",
        instruction:
          "Use soft, minimal shadows only for elements that float above the page, such as menus and dialogs.",
      },
    ],
  }),
  group({
    id: "shape",
    section: "color",
    label: "Shape",
    hint: "Mixing corner styles works when you scope them (e.g. angular containers, rounded buttons).",
    selectionType: "multi",
    heading: "VISUAL DIRECTION",
    options: [
      {
        id: "angular",
        label: "Angular",
        description: "Sharp, square corners.",
        conflictGroup: "radius",
        qualifierHint: "e.g. for containers",
        instruction: "Use square or near-square corners (0–2px radius).",
      },
      {
        id: "modest",
        label: "Modestly rounded",
        description: "Slightly softened corners.",
        conflictGroup: "radius",
        qualifierHint: "e.g. for inputs",
        instruction:
          "Use modestly rounded corners (about 4–8px radius) applied consistently.",
      },
      {
        id: "strong",
        label: "Strongly rounded",
        description: "Soft, friendly corners.",
        conflictGroup: "radius",
        qualifierHint: "e.g. for cards",
        instruction: "Use strongly rounded corners (about 12–20px radius).",
      },
      {
        id: "pill",
        label: "Pill-shaped controls",
        description: "Fully rounded buttons and tags.",
        instruction: "Use fully rounded, pill-shaped buttons, chips, and tags.",
      },
    ],
  }),

  // 6. UX AND INTERACTION
  group({
    id: "ux",
    section: "interaction",
    label: "Interaction requirements",
    selectionType: "multi",
    heading: "INTERACTION REQUIREMENTS",
    options: [
      {
        id: "task-nav",
        label: "Task-oriented navigation",
        description: "Menus named after what people want to do.",
        instruction:
          "Organize navigation around user tasks rather than internal structure, and name items after what people want to do.",
      },
      {
        id: "discoverable-primary",
        label: "Discoverable primary actions",
        description: "The main actions are easy to find.",
        instruction:
          "Place primary actions where people look first and never hide them inside overflow menus.",
      },
      {
        id: "affordances",
        label: "Clear interactive affordances",
        description: "It's obvious what can be clicked.",
        instruction:
          "Make interactive elements look interactive: buttons look like buttons, links are distinguishable from text, and draggable items show a handle.",
      },
      {
        id: "progressive",
        label: "Progressive disclosure",
        description: "Reveal advanced options only when needed.",
        instruction:
          "Show essential controls first and place advanced settings in an expandable section.",
      },
      {
        id: "fewer-choices",
        label: "Reduced competing choices",
        description: "Fewer options fighting for attention.",
        instruction:
          "Limit each view to the choices needed for its main task, and move rarely used options out of the primary flow.",
      },
      {
        id: "system-status",
        label: "Visible system status",
        description: "People always know what the system is doing.",
        instruction:
          "Show progress for any action that takes longer than about one second, and confirm when it completes or fails.",
        criterion:
          "Every action that takes time shows progress and a completion or failure message.",
      },
      {
        id: "inline-validation",
        label: "Inline validation",
        description: "Form problems shown right next to the field.",
        instruction:
          "Validate fields when they lose focus or on submit, and show each message next to its field.",
        criterion:
          "Invalid form fields show an explanatory message next to the field.",
      },
      {
        id: "destructive-confirm",
        label: "Destructive-action confirmation",
        description: "Ask before deleting or overwriting.",
        instruction:
          "Ask for confirmation before destructive actions, stating exactly what will be lost, or offer undo instead.",
        criterion:
          "Every destructive action requires confirmation or offers undo.",
      },
      {
        id: "preserve-input",
        label: "Preserve input after errors",
        description: "Never make people retype after a failure.",
        instruction:
          "Keep everything the user entered when an error occurs; never clear a form because submission failed.",
      },
      {
        id: "actionable-errors",
        label: "Actionable error messages",
        description: "Errors say what happened and what to do.",
        instruction:
          "Write error messages that state what went wrong and what the user can do next, in plain language.",
      },
      {
        id: "retry",
        label: "Retry paths",
        description: "A way to try again after a failure.",
        instruction:
          "Offer a retry action wherever an operation can fail for temporary reasons, such as network errors.",
        criterion: "Every recoverable failure offers a retry action.",
      },
      {
        id: "preserve-view",
        label: "Preserve filters and scroll position",
        description: "Coming back doesn't lose your place.",
        instruction:
          "Keep filters, sorting, and scroll position when users navigate away and return.",
      },
      {
        id: "explicit-labels",
        label: "Explicit action labels",
        description: "Buttons say exactly what they do.",
        instruction:
          "Label actions with specific verbs (“Save changes”, “Delete project”) instead of generic text like “OK” or “Submit”.",
      },
      {
        id: "microinteractions",
        label: "Purposeful microinteractions",
        description: "Small feedback animations that explain changes.",
        instruction:
          "Use brief microinteractions (under 200ms) only to confirm actions or show where something moved.",
      },
    ],
  }),
  group({
    id: "motion",
    section: "interaction",
    label: "Motion",
    hint: "Expressive and minimal motion can coexist if you scope one of them.",
    selectionType: "multi",
    heading: "INTERACTION REQUIREMENTS",
    options: [
      {
        id: "minimal",
        label: "Minimal motion",
        description: "Almost no animation.",
        conflictGroup: "motion",
        qualifierHint: "e.g. in the main workspace",
        instruction:
          "Keep motion minimal: no decorative animation, and only short fades or slides where they clarify a state change.",
      },
      {
        id: "expressive",
        label: "Expressive motion",
        description: "Rich, decorative animation as part of the personality.",
        conflictGroup: "motion",
        qualifierHint: "e.g. on the welcome screen",
        instruction:
          "Use expressive, decorative motion as part of the brand's personality, keeping it out of the way of repeated tasks.",
      },
    ],
  }),

  // 7. STATES, ACCESSIBILITY, AND RESPONSIVENESS
  group({
    id: "state",
    section: "states",
    label: "States to specify",
    selectionType: "multi",
    heading: "STATES AND ACCESSIBILITY",
    options: [
      {
        id: "default",
        label: "Default",
        description: "How things look at rest.",
        instruction: "Default: the resting appearance of each component.",
      },
      {
        id: "hover",
        label: "Hover",
        description: "When a pointer is over something.",
        instruction:
          "Hover: a subtle change that signals interactivity, never the only way to reveal information.",
      },
      {
        id: "focus",
        label: "Focus",
        description: "When the keyboard is on something.",
        instruction:
          "Focus: a clearly visible outline that does not rely on color change alone.",
      },
      {
        id: "selected",
        label: "Selected",
        description: "When something is chosen or active.",
        instruction:
          "Selected: distinguishable from hover and focus, using more than color alone.",
      },
      {
        id: "disabled",
        label: "Disabled",
        description: "When something can't be used right now.",
        instruction:
          "Disabled: visibly inactive, with an explanation nearby when the reason isn't obvious.",
      },
      {
        id: "loading",
        label: "Loading",
        description: "While waiting for data.",
        instruction:
          "Loading: show progress in place of the content without shifting the layout.",
      },
      {
        id: "empty",
        label: "Empty",
        description: "When there's nothing to show yet.",
        instruction:
          "Empty: explain why there is no content and offer the action that adds some.",
      },
      {
        id: "success",
        label: "Success",
        description: "After something worked.",
        instruction:
          "Success: confirm the completed action briefly, close to where it happened.",
      },
      {
        id: "error",
        label: "Error",
        description: "When something went wrong.",
        instruction:
          "Error: explain what failed and how to recover, next to the affected element.",
      },
    ],
  }),
  group({
    id: "a11y",
    section: "states",
    label: "Accessibility",
    hint: "Selected by default. Requesting these doesn't guarantee compliance — the result still needs testing.",
    selectionType: "multi",
    heading: "STATES AND ACCESSIBILITY",
    options: [
      {
        id: "keyboard",
        label: "Keyboard-operable controls",
        description: "Everything works without a mouse.",
        instruction:
          "Make every interactive control reachable and operable with the keyboard alone, in a logical order.",
        criterion:
          "All interactive controls can be reached and operated with the keyboard alone.",
      },
      {
        id: "focus-visible",
        label: "Visible focus indicators",
        description: "You can always see where the keyboard is.",
        instruction:
          "Show a clearly visible focus indicator on every focusable element.",
        criterion: "Every focusable element shows a visible focus indicator.",
      },
      {
        id: "labels",
        label: "Meaningful form labels",
        description: "Every field says what it's for.",
        instruction:
          "Give every form field a visible label that describes its purpose; placeholders are not labels.",
      },
      {
        id: "errors-text",
        label: "Errors in text, not color alone",
        description: "Red alone isn't enough to signal a problem.",
        instruction:
          "Communicate errors and status with text or icons in addition to color.",
        criterion: "Errors are communicated with text, not color alone.",
      },
      {
        id: "contrast",
        label: "Readable contrast",
        description: "Text is easy to read against its background.",
        instruction:
          "Keep text and essential controls at readable contrast against their backgrounds (aim for WCAG AA ratios).",
      },
      {
        id: "reduced-motion",
        label: "Reduced-motion support",
        description: "Respect people who turn animations off.",
        instruction:
          "Disable non-essential animation when the user has requested reduced motion.",
        criterion:
          "Non-essential animation is disabled when reduced motion is requested.",
      },
    ],
  }),
  group({
    id: "responsive",
    section: "states",
    label: "Responsive behavior",
    selectionType: "multi",
    heading: "RESPONSIVE BEHAVIOR",
    options: [
      {
        id: "adapt-nav",
        label: "Adapt navigation for narrow screens",
        description: "Menus change shape on small screens.",
        instruction:
          "Collapse navigation into a compact pattern on narrow screens while keeping the current location visible.",
      },
      {
        id: "prioritize-mobile",
        label: "Prioritize the primary task on mobile",
        description: "The main job comes first on a phone.",
        instruction:
          "On mobile, show the primary task first and move secondary content below it or behind a clear control.",
      },
      {
        id: "table-overflow",
        label: "Define table overflow",
        description: "Decide what wide tables do on small screens.",
        instruction:
          "Define how wide tables behave on narrow screens: horizontal scroll with a sticky first column, or a stacked row layout.",
      },
      {
        id: "no-hover-only",
        label: "Avoid hover-only functionality",
        description: "Touchscreens can't hover.",
        instruction:
          "Make everything available on hover also available by tap, focus, or a visible control.",
        criterion: "Important actions are usable without relying on hover.",
      },
      {
        id: "critical-actions",
        label: "Keep critical actions accessible",
        description: "Key buttons never disappear off-screen.",
        instruction:
          "Keep critical actions visible or one step away at every screen size.",
      },
    ],
  }),
];

export const OPTIONS: PickerOption[] = GROUPS.flatMap((g) => g.options);

const OPTION_INDEX = new Map(OPTIONS.map((o, i) => [o.id, i]));
const OPTION_BY_ID = new Map(OPTIONS.map((o) => [o.id, o]));
const GROUP_BY_ID = new Map(GROUPS.map((g) => [g.id, g]));

export function getOption(id: string): PickerOption | undefined {
  return OPTION_BY_ID.get(id);
}

export function getGroup(id: string): PickerGroup | undefined {
  return GROUP_BY_ID.get(id);
}

export function groupsForSection(section: SectionId): PickerGroup[] {
  return GROUPS.filter((g) => g.section === section);
}

/** Stable sort key so output follows definition order, not click order. */
export function optionOrder(id: string): number {
  return OPTION_INDEX.get(id) ?? Number.MAX_SAFE_INTEGER;
}

/** Built-in avoid → use pairs. `suggestedBy` lists options that make a pair relevant. */
export const BUILT_IN_PAIRS: {
  id: string;
  avoid: string;
  use: string;
  suggestedBy: string[];
}[] = [
  {
    id: "focal",
    avoid: "competing focal points",
    use: "one primary focal point per section",
    suggestedBy: ["type.dominant-primary", "aesthetic.minimalist"],
  },
  {
    id: "clutter",
    avoid: "decorative clutter",
    use: "visual treatments only when they support hierarchy, meaning, or identity",
    suggestedBy: [
      "aesthetic.minimalist",
      "aesthetic.utilitarian",
      "aesthetic.precision",
    ],
  },
  {
    id: "cards",
    avoid: "overusing cards",
    use: "rows for comparable records and cards for independent summaries",
    suggestedBy: ["layout.table-first", "layout.cards"],
  },
  {
    id: "whitespace",
    avoid: "excessive whitespace",
    use: "useful information density while maintaining readability",
    suggestedBy: ["density.compact", "interface.dashboard", "interface.admin"],
  },
  {
    id: "cramped",
    avoid: "cramped layouts",
    use: "clear separation between related groups and controls that remain easy to use",
    suggestedBy: ["density.compact", "density.spacious"],
  },
  {
    id: "icon-only",
    avoid: "ambiguous icon-only actions",
    use: "explicit labels for important actions",
    suggestedBy: ["ux.explicit-labels", "ux.affordances"],
  },
  {
    id: "animation",
    avoid: "gratuitous animation",
    use: "motion that clarifies state changes",
    suggestedBy: [
      "motion.minimal",
      "ux.microinteractions",
      "a11y.reduced-motion",
    ],
  },
  {
    id: "repeated-sections",
    avoid: "generic repeated sections",
    use: "compositions that vary according to content and purpose",
    suggestedBy: [
      "interface.marketing",
      "interface.landing",
      "aesthetic.editorial",
    ],
  },
  {
    id: "contrast",
    avoid: "weak contrast",
    use: "text and controls that are clearly distinguishable from their backgrounds",
    suggestedBy: ["a11y.contrast", "theme.dark"],
  },
  {
    id: "glow",
    avoid: "ornamental glow",
    use: "accent effects reserved for meaningful states",
    suggestedBy: ["aesthetic.futuristic", "theme.dark"],
  },
  {
    id: "gradients",
    avoid: "excessive gradients",
    use: "restrained tonal surfaces",
    suggestedBy: ["surface.tonal", "aesthetic.premium", "aesthetic.futuristic"],
  },
];

export const ESSENTIAL_A11Y = [
  "a11y.keyboard",
  "a11y.focus-visible",
  "a11y.labels",
  "a11y.errors-text",
  "a11y.contrast",
  "a11y.reduced-motion",
];
