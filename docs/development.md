# EpiGimp Development Guide

This document describes the development workflow, code organization and coding conventions used in EpiGimp.

For installation instructions, see [`installation.md`](./installation.md).

For a detailed explanation of the application architecture, see [`architecture.md`](./architecture.md).

---

## 1. Development Philosophy

EpiGimp is designed as a modular application.

As the project grows, features such as drawing tools, selections, layers, masks, filters and history will introduce significant complexity.

The codebase should therefore remain:

- Modular
- Readable
- Maintainable
- Reusable
- Easy to extend

The main principle is:

> Separate code by responsibility, not simply by line count.

---

## 2. Project Structure

The main source structure is:

```text
electron/
├── main.ts
├── preload.ts
└── package.json

src/
├── assets/
├── canvas/
├── components/
├── constants/
├── filters/
├── hooks/
├── layers/
├── styles/
├── tools/
├── types/
├── utils/
├── App.tsx
└── main.tsx
```

Each directory represents a specific responsibility.

New code should be placed in the module that owns its behavior rather than being placed in a generic directory by default.

For a complete explanation of each module, see [`architecture.md`](./architecture.md).

---

## 3. Separation of Responsibilities

The project separates several categories of logic:

```text
Desktop / OS
     │
     ▼
Electron
     │
     ▼
Preload / IPC
     │
     ▼
React UI
     │
     ├── Canvas rendering
     ├── Editing tools
     ├── Layers
     └── Filters
```

These responsibilities should not be unnecessarily mixed.

For example, a React toolbar button may activate a Brush tool, but the component responsible for displaying the button should not contain the complete brush drawing algorithm.

Similarly, image-processing algorithms should not depend on UI components when they can operate directly on image data.

---

## 4. Functions

Functions should have one clear responsibility.

Avoid large functions that perform multiple unrelated operations.

Instead of:

```ts
function handlePointerMove() {
  // Read mouse position
  // Convert coordinates
  // Determine active tool
  // Draw pixels
  // Update layer
  // Render canvas
  // Update history
}
```

prefer separating the responsibilities:

```ts
function handlePointerMove(event: PointerEvent) {
  const position = getCanvasPosition(event)

  if (!canUseActiveTool(position)) {
    return
  }

  executeActiveTool(position)
}
```

with dedicated functions such as:

```text
getCanvasPosition()
canUseActiveTool()
executeActiveTool()
drawBrushStroke()
updateActiveLayer()
renderCanvas()
pushHistoryEntry()
```

There is no strict maximum number of lines for a function.

A function should be split when doing so improves:

- Readability
- Responsibility separation
- Reusability
- Testability

Do not split functions artificially when the resulting code becomes harder to understand.

---

## 5. Shared Values and Constants

Values shared by several parts of the application should have a single source of truth.

Application constants belong in:

```text
src/constants/
```

For example:

```ts
export const DEFAULT_ZOOM = 100
export const MIN_ZOOM = 10
export const MAX_ZOOM = 800
```

Other modules should import these values instead of redefining them.

Avoid duplicated magic values such as:

```ts
if (zoom > 800) {
  // ...
}
```

when the value already has a defined meaning.

Prefer:

```ts
if (zoom > MAX_ZOOM) {
  // ...
}
```

This makes the code easier to understand and change.

---

## 6. Design Tokens

Shared visual values are centralized in:

```text
src/styles/tokens.css
```

This includes:

- Colors
- Typography
- Font sizes
- Font weights
- Spacing
- Border radii
- Common layout dimensions
- Z-index levels

Do not duplicate an existing design value inside component styles.

Avoid:

```css
.layers-panel {
  background: #27272a;
}
```

when the corresponding token already exists.

Prefer:

```css
.layers-panel {
  background: var(--color-bg-panel);
}
```

Changing a shared design value should therefore require changing it in only one place.

---

## 7. Component Styles

Global design values belong in `tokens.css`, but styles specific to a component should remain close to that component.

A future component may therefore use a structure such as:

```text
components/
└── Toolbar/
    ├── Toolbar.tsx
    └── Toolbar.css
```

`Toolbar.css` may define the layout and behavior specific to the toolbar while consuming shared values from `tokens.css`.

Avoid placing every component style inside `global.css`.

---

## 8. Reusable Utilities

Generic reusable helpers belong in:

```text
src/utils/
```

Related utilities should remain grouped by responsibility.

For example:

```text
utils/
└── color.ts
```

could contain:

```text
hexToRgb()
rgbToHex()
clampColor()
```

Do not create a separate file for every very small function unless there is a clear architectural reason.

Also avoid using `utils/` as a generic location for code that belongs to a specific domain.

For example:

```text
layers/calculateLayerOpacity.ts
```

is preferable to:

```text
utils/calculateLayerOpacity.ts
```

if the function is exclusively related to layers.

---

## 9. TypeScript Types

Shared TypeScript types belong in:

```text
src/types/
```

Types should be reused instead of being independently redefined in multiple modules.

For example, when the layer system is introduced, a common `Layer` definition should be shared by the modules that manipulate layers.

Types that are only meaningful inside one specific module may remain local to that module.

---

## 10. React Hooks

Reusable React-specific behavior may be extracted into:

```text
src/hooks/
```

A custom hook should be introduced when it provides a meaningful React abstraction or reusable behavior.

Do not convert normal functions into hooks simply because the `hooks` directory exists.

Generic functions that do not depend on React should remain outside the hooks directory.

---

## 11. Electron Communication

The React renderer must not directly access Node.js or unrestricted Electron APIs.

Desktop operations follow this path:

```text
React
   ↓
window.electronAPI
   ↓
preload.ts
   ↓
IPC
   ↓
main.ts
```

New Electron capabilities should be explicitly exposed through the preload layer.

Avoid exposing the complete `ipcRenderer`, Node.js APIs or unrestricted Electron functionality to the renderer.

---

## 12. Development Mode

Start the complete development environment with:

```bash
npm run dev
```

This starts the React development server and Electron application.

The development renderer is loaded from:

```text
http://localhost:5173
```

The `VITE_DEV_SERVER_URL` environment variable is used by the Electron main process to determine when the development renderer should be loaded.

`cross-env` is used to define this variable in a portable way.

---

## 13. Production Build

Build the complete project with:

```bash
npm run build
```

The renderer is generated in:

```text
dist/
```

The Electron TypeScript code is generated in:

```text
dist-electron/
```

When the development server URL is not defined, Electron loads:

```text
dist/index.html
```

directly.

This ensures that the built application does not depend on the Vite development server.

---

## 14. Linux / Wayland Development Workaround

During initial development on Ubuntu with a Wayland session, Electron encountered a Chromium/GTK rendering crash.

The application successfully runs using:

```text
--ozone-platform=x11
```

The current Electron development command includes this option.

Some Chromium messages such as:

```text
GetVSyncParametersIfAvailable() failed
```

may still appear.

During initial testing, these messages did not prevent the application from rendering or functioning correctly.

This is considered an environment-specific development workaround rather than an EpiGimp application requirement.

---

## 15. ESLint

Run static code analysis with:

```bash
npm run lint
```

ESLint is responsible for detecting configured code-quality and TypeScript/React issues.

Generated directories such as:

```text
dist/
dist-electron/
```

are excluded from linting.

New code should pass ESLint before being considered complete.

---

## 16. Prettier

Check project formatting with:

```bash
npm run format:check
```

Apply formatting automatically with:

```bash
npm run format
```

Prettier is responsible for formatting, while ESLint remains responsible for code analysis.

This keeps the responsibilities of the two tools separate.

The current formatting conventions include:

```text
Semicolons:       No
Quotes:           Single
Trailing commas:  Enabled
Print width:      100
Indentation:      2 spaces
```

---

## 17. Before Completing a Development Task

Before considering an implementation task complete, run:

```bash
npm run lint
npm run format:check
npm run build
```

The expected result is:

```text
ESLint        ✓
Formatting    ✓
TypeScript    ✓
React build   ✓
Electron build ✓
```

For changes affecting runtime behavior, also launch the application and manually verify the affected functionality.

---

## 18. Git Workflow

Development work should be divided into focused changes.

Starting from feature development after the initial project foundation, work should be performed on dedicated branches rather than directly on the main branch.

A typical workflow is:

```text
main
  │
  ▼
develop
  │
  ├── feature/canvas-workspace
  ├── feature/drawing-tools
  ├── feature/layers
  └── feature/filters
```

Feature branches should contain changes related to one clear task or issue.

Commits should also remain focused and use descriptive messages.

Examples:

```text
feat: add canvas workspace
feat: implement brush tool
fix: correct canvas coordinate conversion
refactor: separate layer rendering logic
docs: document layer architecture
chore: configure development tooling
```

The exact branching workflow may evolve during the project, but changes should remain traceable to the corresponding GitHub Project issue.

---

## 19. Documentation

Documentation is maintained throughout development rather than being written only at the end of the project.

Update documentation when a change affects:

- Installation
- Architecture
- Development workflow
- Important technical decisions
- Commands or dependencies

The documentation currently includes:

```text
docs/
├── architecture.md
├── development.md
└── installation.md
```

The root `README.md` provides the main project overview and links to the detailed documentation.

---

## 20. Core Development Rules

When adding new code to EpiGimp, keep the following rules in mind:

1. Give each function and module a clear responsibility.
2. Prefer small and readable functions over large multi-purpose functions.
3. Reuse shared logic instead of duplicating it.
4. Centralize shared constants and design values.
5. Keep UI logic separate from image-processing and editing logic.
6. Keep Electron/OS access behind the preload bridge.
7. Avoid unexplained magic values.
8. Avoid unnecessary abstraction and over-modularization.
9. Keep naming explicit and consistent.
10. Update documentation when architectural decisions change.

The objective is not to create the largest possible number of files or abstractions.

The objective is to keep EpiGimp understandable as its functionality grows.
