# EpiGimp Architecture

## Overview

EpiGimp is a desktop raster graphics editor built with:

- Electron;
- React;
- TypeScript;
- HTML5 Canvas.

The application follows a modular architecture where user interface,
editor state, raster processing and operating-system interactions are
separated into dedicated domains.

The main objective of this architecture is to keep the codebase readable,
maintainable and easy to extend.

---

# Global Architecture

The application can be represented as:

    +--------------------------------------------------+
    |                  React Renderer                  |
    |                                                  |
    |  Components                                      |
    |      |                                           |
    |      v                                           |
    |  Hooks / Editor State                            |
    |      |                                           |
    |      +-----------------------------+             |
    |      |             |               |             |
    |      v             v               v             |
    |    Tools         Layers          Filters          |
    |      |             |               |             |
    |      +-------------+---------------+             |
    |                    |                             |
    |                    v                             |
    |             RasterDocument                      |
    |                    |                             |
    |                    v                             |
    |              Canvas Rendering                    |
    |                    |                             |
    |                    v                             |
    |                  Export                          |
    +--------------------+-----------------------------+
                         |
                         | Native operations
                         v
    +--------------------------------------------------+
    |                  Preload                         |
    |            Controlled Electron API               |
    +--------------------+-----------------------------+
                         |
                         | IPC
                         v
    +--------------------------------------------------+
    |             Electron Main Process                |
    |                                                  |
    |       Window / Dialogs / Filesystem              |
    +--------------------+-----------------------------+
                         |
                         v
    +--------------------------------------------------+
    |               Operating System                   |
    +--------------------------------------------------+

---

# Project Structure

The main source structure is:

    EpiGimp/
    ├── electron/
    │   ├── main.ts
    │   └── preload.ts
    │
    ├── src/
    │   ├── components/
    │   ├── canvas/
    │   ├── tools/
    │   ├── layers/
    │   ├── filters/
    │   ├── hooks/
    │   ├── types/
    │   ├── constants/
    │   ├── export/
    │   ├── utils/
    │   ├── styles/
    │   ├── assets/
    │   ├── App.tsx
    │   └── main.tsx
    │
    ├── docs/
    └── public/

Each directory has a specific responsibility.

---

# Components

The `components/` directory contains the React user interface.

The main editor interface contains elements such as:

    MenuBar
    Toolbar
    ToolOptions
    CanvasWorkspace
    LayersPanel
    StatusBar

Components are primarily responsible for:

- displaying application state;
- receiving user interactions;
- triggering editor actions.

Image-processing algorithms should not be implemented directly inside UI
components when they can be separated into their corresponding domain.

---

# Canvas

The `canvas/` domain manages the central raster workspace.

It is responsible for:

- displaying the raster document;
- rendering the layer composition;
- handling visual zoom;
- converting pointer coordinates;
- providing editing previews;
- connecting pointer interactions with tools.

The intrinsic raster resolution is kept separate from the visual zoom.

Detailed documentation:

[Canvas System](canvas/README.md)

---

# Tools

The `tools/` domain contains interactive editing operations.

The V1 includes:

- Brush;
- Eraser;
- Color Picker;
- Rectangle Selection;
- Crop.

Tool algorithms are separated from the React interface.

For example, Brush and Eraser share raster stroke infrastructure while
keeping their own configuration.

Detailed documentation:

[Editing Tools](tools/README.md)

---

# Layers and Masks

The `layers/` domain manages the multi-layer raster document.

Each layer owns:

- independent `ImageData`;
- visibility;
- opacity;
- an optional mask.

The layer system also handles:

- layer creation;
- layer composition;
- masks;
- layer duplication;
- ordering;
- active-layer editing.

Masks and opacity are applied non-destructively during composition.

Detailed documentation:

[Layers and Masks](layers/README.md)

---

# Filters

The `filters/` domain contains reusable raster image-processing
algorithms.

The V1 provides:

- Grayscale;
- Invert;
- Brightness;
- Contrast;
- Blur.

Filters operate on the active layer's `ImageData`.

Pixel-processing logic is kept independent from React components and the
Layers Panel.

Detailed documentation:

[Filters and Pixel Processing](filters/README.md)

---

# Export

The `export/` domain converts the current raster document into standard
image formats.

The V1 supports:

    PNG
    JPEG

Export reuses the same layer-composition logic as the editor.

PNG preserves transparency.

JPEG uses a white background because the format does not support
transparency.

The renderer creates and encodes the image, while Electron handles the
native Save dialog and filesystem access.

Detailed documentation:

[Image Export](export/README.md)

---

# Hooks and Editor State

The `hooks/` domain separates reusable React state and interaction logic
from visual components.

Hooks manage responsibilities such as:

- active tool;
- Brush options;
- Eraser options;
- rectangle selection;
- Undo/Redo history;
- keyboard shortcuts.

This prevents the main React components from becoming responsible for all
editor state.

Detailed documentation:

[React Hooks and Editor State](hooks/README.md)

---

# Electron

The `electron/` directory contains the desktop infrastructure.

The architecture separates:

    Renderer
        |
        v
    Preload
        |
        v
    Main Process
        |
        v
    Operating System

The renderer handles the editor and raster processing.

The main process handles privileged native operations such as:

- file dialogs;
- filesystem access;
- application window management.

The preload script provides a controlled API between both environments.

Detailed documentation:

[Electron Architecture](electron/README.md)

---

# Raster Document

The central editor data structure is the raster document.

Conceptually:

    RasterDocument
        |
        +-- id
        +-- name
        +-- width
        +-- height
        +-- activeLayerId
        |
        +-- layers
              |
              +-- Layer
              |     |
              |     +-- ImageData
              |     +-- visibility
              |     +-- opacity
              |     +-- optional mask
              |
              +-- Layer
              |
              +-- ...

The document is the source of truth for the raster image being edited.

---

# Rendering Pipeline

The visible editor image is produced from the layer stack.

The rendering pipeline is:

    RasterDocument
          |
          v
    Layer Stack
          |
          v
    Visibility
          |
          v
    Masks
          |
          v
    Opacity
          |
          v
    compositeLayers()
          |
          v
    Canvas

The same composition logic is reused for export.

---

# Editing Pipeline

A typical editing operation follows:

    User Interaction
          |
          v
    React Component
          |
          v
    Editor Action / Hook
          |
          v
    Tool or Filter
          |
          v
    Active Layer ImageData
          |
          v
    Updated RasterDocument
          |
          v
    Layer Composition
          |
          v
    Canvas Re-render

This keeps user interaction separate from low-level raster processing.

---

# History

Destructive document changes integrate with the Undo/Redo history system.

Before a logical editing operation changes the document, the previous
state can be preserved.

Conceptually:

    Previous Document
          |
          v
    History Snapshot
          |
          v
    Editing Operation
          |
          v
    Updated Document

Because `ImageData` contains mutable raster information, independent
copies are required where historical states must remain unchanged.

---

# Native Operations

Operations requiring operating-system access follow a different path.

For example, image export uses:

    React
      |
      v
    Export Image
      |
      v
    Preload API
      |
      v
    Electron IPC
      |
      v
    Main Process
      |
      v
    Save Dialog
      |
      v
    Filesystem

This prevents raster-processing modules from directly depending on
operating-system APIs.

---

# Design Principles

## Modular Responsibilities

Each domain has a clear purpose.

Raster processing, UI state and operating-system operations are kept
separate.

## Small Functions

Functions should focus on one clear responsibility whenever possible.

Large functions containing unrelated behaviors are avoided.

## Explicit Naming

Functions, variables and types use descriptive names so their purpose can
be understood without relying on implementation details.

## Shared Logic

Common behavior is centralized when several features require the same
operation.

Examples include:

    compositeLayers()
    drawStroke()
    shared pixel processing
    coordinate conversion

## Independent Raster Data

Layers own independent `ImageData`.

Deep copies are used where mutable raster data must not be shared, such as
layer duplication and history snapshots.

## Non-Destructive Rendering Properties

Layer opacity and masks affect rendering without permanently modifying the
original raster pixels.

## UI / Logic Separation

React components trigger actions but image-processing algorithms remain in
their corresponding domains.

## Secure Electron Boundary

The renderer does not receive unrestricted Node.js access.

Native functionality is exposed through the preload bridge and explicit
IPC operations.

---

# Detailed Technical Documentation

The V1 architecture is documented by domain:

| Domain | Documentation |
| --- | --- |
| Canvas | [Canvas System](canvas/README.md) |
| Tools | [Editing Tools](tools/README.md) |
| Layers | [Layers and Masks](layers/README.md) |
| Filters | [Filters and Pixel Processing](filters/README.md) |
| Export | [Image Export](export/README.md) |
| Hooks | [React Hooks and Editor State](hooks/README.md) |
| Electron | [Electron Architecture](electron/README.md) |

These documents describe the internal behavior, design decisions and
interactions of each major subsystem.

---

# V1 Architecture Summary

The EpiGimp V1 architecture can be summarized as:

    UI
     |
     v
    Hooks / State
     |
     +--------------------+
     |         |          |
     v         v          v
    Tools    Filters    Layers
     |         |          |
     +---------+----------+
               |
               v
        RasterDocument
               |
               v
        Layer Composition
               |
         +-----+-----+
         |           |
         v           v
       Canvas      Export
                     |
                     v
                  Preload
                     |
                     v
                    IPC
                     |
                     v
              Electron Main
                     |
                     v
              Operating System

This structure provides the foundation for the V1 editor while leaving
room for future features such as advanced selections, transformations,
project persistence, autosave and recovery.
