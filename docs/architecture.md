# EpiGimp Architecture

## 1. Overview

EpiGimp is a desktop raster graphics editor built with **Electron, React, TypeScript and HTML5 Canvas**.

The application is designed around a modular architecture in order to keep the codebase readable, maintainable and extensible as new editing features are introduced.

The architecture separates four main responsibilities:

- Desktop and operating-system interactions
- User interface
- Image rendering and editing logic
- Shared application resources and utilities

This separation is especially important for features such as drawing tools, layers, masks, filters and history, which will progressively increase the complexity of the application.

---

## 2. Global Architecture

EpiGimp uses Electron to provide the desktop environment and React to build the graphical interface.

The communication architecture is:

```text
┌──────────────────────────────────┐
│        Electron Main Process     │
│                                  │
│  Window management               │
│  Native desktop operations       │
│  Application lifecycle           │
└────────────────┬─────────────────┘
                 │
                 │ IPC
                 │
┌────────────────▼─────────────────┐
│           Preload Layer          │
│                                  │
│  contextBridge                   │
│  Controlled Electron APIs        │
└────────────────┬─────────────────┘
                 │
                 │ window.electronAPI
                 │
┌────────────────▼─────────────────┐
│         React Renderer           │
│                                  │
│  User interface                  │
│  Canvas workspace                │
│  Editing tools                   │
│  Layers                          │
│  Filters                         │
└──────────────────────────────────┘
```

The renderer never directly accesses Node.js or Electron APIs.

Native functionality must be exposed through the preload layer using controlled APIs.

---

## 3. Electron Architecture

Electron-related code is isolated from the React application.

```text
electron/
├── main.ts
├── preload.ts
└── package.json
```

### `main.ts`

The Electron main process is responsible for the desktop application lifecycle.

Its current responsibilities include:

- Creating the main `BrowserWindow`
- Configuring Electron security options
- Loading the React renderer
- Handling IPC requests
- Managing application startup and shutdown

The window is configured with:

```ts
contextIsolation: true
nodeIntegration: false
```

This prevents the React renderer from directly accessing Node.js APIs.

### `preload.ts`

The preload script acts as a controlled bridge between the renderer and the Electron main process.

It uses Electron's `contextBridge` to expose only explicitly authorized functionality.

The current architecture exposes a small `ping` API used to validate IPC communication.

This test confirmed the complete communication path:

```text
React
  ↓
window.electronAPI
  ↓
preload.ts
  ↓
ipcRenderer
  ↓
ipcMain
  ↓
Electron main process
```

As the application evolves, this bridge will expose real desktop operations such as file opening and saving.

---

## 4. Renderer Architecture

The renderer contains the React application and the graphics editor itself.

```text
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

Each directory has a specific responsibility.

### `components/`

Contains reusable React UI components.

Examples may include:

- Toolbars
- Sidebars
- Menus
- Buttons
- Dialogs
- Panels

Components should primarily handle presentation and user interaction.

Complex editing logic should not be implemented directly inside UI components.

### `canvas/`

Contains the Canvas workspace and rendering-related logic.

This module will progressively handle responsibilities such as:

- Canvas rendering
- Coordinate conversion
- Zoom and navigation
- Image rendering
- Layer composition
- Interaction between editing tools and the displayed document

Rendering logic should remain separated from generic UI components.

### `tools/`

Contains editing tool implementations.

Examples include:

- Brush
- Eraser
- Color picker
- Selection tools

Each tool should encapsulate its own editing behavior whenever possible.

This allows new tools to be introduced without increasing the complexity of the main Canvas component.

### `layers/`

Contains the layer system.

This module will manage concepts such as:

- Layer creation
- Layer deletion
- Layer ordering
- Visibility
- Opacity
- Active layer
- Layer composition
- Layer masks

Layer-specific logic should remain inside this domain instead of being distributed across UI components.

### `filters/`

Contains image-processing algorithms.

Examples may include:

- Grayscale
- Invert
- Brightness
- Contrast
- Blur

Filters should operate on image data independently from the React interface whenever possible.

This makes image-processing logic easier to understand, reuse and test.

### `hooks/`

Contains reusable React-specific logic through custom hooks.

Hooks should only be created when React behavior needs to be shared or isolated.

The existence of this directory does not mean that every piece of logic should become a hook.

### `types/`

Contains shared TypeScript definitions.

The current `electron.d.ts` file defines the API exposed to the renderer through:

```ts
window.electronAPI
```

Future shared types may include document, layer, tool and filter definitions.

Shared concepts should have a single TypeScript definition rather than being redefined by individual modules.

### `constants/`

Contains shared application constants.

Examples may include:

```ts
DEFAULT_ZOOM
MIN_ZOOM
MAX_ZOOM
DEFAULT_BRUSH_SIZE
```

Values used by multiple modules should be defined once and imported where required.

This avoids duplicated values and unexplained magic numbers throughout the codebase.

### `utils/`

Contains small reusable utilities that are not specific to one application domain.

Examples may include:

- Color conversions
- Generic validation
- Coordinate helpers

The `utils` directory must not become a collection of unrelated application logic.

If a helper belongs specifically to layers, tools or filters, it should remain inside that module.

### `assets/`

Contains static resources used by the application.

```text
assets/
├── icons/
└── images/
```

This may include application icons, SVG resources and other visual assets.

---

## 5. Styling Architecture

Global styling is separated into three files:

```text
styles/
├── tokens.css
├── reset.css
└── global.css
```

### `tokens.css`

Contains the shared design tokens used throughout EpiGimp.

These include:

- Colors
- Typography
- Font sizes
- Font weights
- Spacing
- Border radii
- Layout dimensions
- Z-index levels

For example:

```css
--color-bg-panel: #27272a;
--font-size-md: 1rem;
--spacing-sm: 0.5rem;
```

Components consume these variables instead of duplicating their values:

```css
background: var(--color-bg-panel);
padding: var(--spacing-sm);
```

This provides a single source of truth for the EpiGimp visual system.

### `reset.css`

Normalizes browser default styles and provides a predictable base for the interface.

It handles elements such as:

- Box sizing
- Default margins
- Form control typography
- Image behavior

It does not define the visual identity of EpiGimp.

### `global.css`

Defines application-wide visual behavior.

It consumes values from `tokens.css` for properties such as:

- Application background
- Text color
- Typography
- Global font rendering

Styles specific to individual components should remain close to those components rather than being added to `global.css`.

---

## 6. Development and Production Rendering

EpiGimp supports two renderer-loading modes.

### Development

During development, Vite provides the React application through a local development server.

```text
Electron
    ↓
VITE_DEV_SERVER_URL
    ↓
http://localhost:5173
    ↓
React
```

This provides development features such as Hot Module Replacement.

### Production

A production build does not depend on the Vite development server.

Vite generates the renderer into:

```text
dist/
```

Electron then loads:

```text
dist/index.html
```

directly from the filesystem.

```text
Electron
    ↓
loadFile()
    ↓
dist/index.html
    ↓
React production build
```

The renderer-loading logic is isolated in `loadRenderer()` so that window creation and environment-specific loading remain separate responsibilities.

The Vite configuration uses a relative base path to allow generated assets to work correctly when loaded through the filesystem.

---

## 7. Security

EpiGimp follows Electron security principles from the beginning of development.

### Context Isolation

Electron context isolation is enabled:

```ts
contextIsolation: true
```

The preload environment and the renderer therefore execute in isolated JavaScript contexts.

### Node Integration

Direct Node.js integration inside the renderer is disabled:

```ts
nodeIntegration: false
```

React components cannot directly access Node.js APIs.

### Controlled IPC

Desktop functionality is exposed through the preload layer rather than exposing Electron directly to the renderer.

Only explicitly defined operations should become available through `window.electronAPI`.

### Content Security Policy

The renderer defines a Content Security Policy to restrict the resources that can be loaded or executed.

Development connections to the local Vite server are explicitly allowed.

Image-related sources such as `data:` and `blob:` are supported because EpiGimp is an image-editing application.

The policy can be further restricted for packaged production releases as the project evolves.

---

## 8. Development Principles

The project follows several architectural principles.

### Single Responsibility

Functions, modules and components should have one clear responsibility.

Large functions containing unrelated operations should be separated into smaller functions with meaningful names.

For example, instead of combining pointer handling, coordinate conversion, drawing, layer modification and history management in a single function, these responsibilities should be separated.

### DRY — Don't Repeat Yourself

Shared logic and values should not be duplicated.

Common values belong in:

```text
constants/
styles/tokens.css
```

Reusable logic should be extracted when multiple parts of the application require the same behavior.

### Separation of Concerns

The following responsibilities should remain separated:

```text
UI
│
Editing logic
│
Canvas rendering
│
Image processing
│
Desktop / OS access
```

For example, a toolbar button may activate the Brush tool, but the toolbar component should not implement the brush drawing algorithm itself.

### Readability

Code should prioritize clarity over compactness.

Functions should remain reasonably short and use descriptive names.

Complex behavior should be decomposed into understandable operations.

### Reusability

Generic functionality should be designed so that it can be reused when appropriate.

However, code should only be generalized when a real reusable responsibility exists.

### Avoid Over-Modularization

Modularity should not result in unnecessary fragmentation.

Related functions can remain together when they belong to the same responsibility.

For example:

```text
utils/color.ts
```

may contain:

```text
hexToRgb()
rgbToHex()
clampColor()
```

Creating one file for every small function would reduce readability rather than improve it.

The goal is therefore:

> Separate code by responsibility, not simply by line count.

---

## 9. Architecture Evolution

The architecture is intentionally designed to evolve with the EpiGimp roadmap.

The current foundation prepares the project for upcoming modules such as:

```text
Canvas
  ↓
Drawing tools
  ↓
Selections
  ↓
Layers
  ↓
Masks
  ↓
Filters
  ↓
History
  ↓
Project persistence
```

New functionality should extend the relevant domain rather than forcing major changes to the global architecture.

Architectural decisions may evolve during development when new requirements justify them. Any significant architectural change should be reflected in this document.
