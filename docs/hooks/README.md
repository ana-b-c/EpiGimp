# React Hooks and Editor State

## Purpose

EpiGimp uses custom React hooks to separate editor state and reusable
interaction logic from the visual components.

Instead of storing every behavior directly inside `App.tsx`,
`CanvasWorkspace` or the different panels, hooks are responsible for
specific parts of the editor state.

The V1 uses hooks for responsibilities such as:

- active tool management;
- Brush options;
- Eraser options;
- rectangle selection;
- document history;
- Undo and Redo;
- keyboard shortcuts.

The general architecture is:

    React Components
          |
          v
    Custom Hooks
          |
          v
    Editor State / Actions
          |
          v
    Raster and Document Logic

This keeps visual components focused mainly on rendering and user
interaction.

---

## Related Source Files

The custom hooks are located in:

    src/hooks/

The hooks interact with several parts of the application:

    src/App.tsx
    src/canvas/
    src/tools/
    src/layers/
    src/filters/
    src/export/
    src/components/

Each hook has a specific responsibility instead of managing the entire
editor.

---

# Why Custom Hooks Are Used

A raster editor contains several independent states.

For example:

    Current tool
    Brush size
    Brush color
    Eraser size
    Selection
    Document history
    Keyboard actions

Putting all of these responsibilities directly inside one component would
make that component difficult to understand and maintain.

EpiGimp therefore separates them into dedicated hooks.

Conceptually:

    App
     |
     +-- Tool state
     |
     +-- Brush state
     |
     +-- Eraser state
     |
     +-- Selection state
     |
     +-- History state
     |
     +-- Keyboard shortcuts

Each hook manages one specific editor concern.

---

# Tool Manager

## Purpose

The tool manager controls which editing tool is currently active.

The editor needs a single source of truth for the selected tool because
several components depend on it.

For example:

    Toolbar
        -> displays the selected tool

    Tool Options
        -> displays options for the selected tool

    CanvasWorkspace
        -> determines pointer behavior

The tool manager connects these components through shared state.

---

## Active Tool Flow

The general flow is:

    User clicks tool
          |
          v
    Tool Manager
          |
          v
    Active Tool changes
          |
          +----------------+
          |                |
          v                v
       Toolbar        CanvasWorkspace
          |                |
          v                v
    Update visual     Change interaction
       state             behavior

The Toolbar does not directly tell the Canvas to start drawing.

Instead, it changes the active tool state.

The Canvas reacts to that state when the next pointer interaction occurs.

---

# Brush Options

## Purpose

Brush configuration is stored independently from the Brush drawing
algorithm.

The Brush options include the values needed to configure Brush behavior,
such as:

    Brush size
    Foreground color

The exact raster drawing remains the responsibility of the tools system.

---

## Brush State Flow

Conceptually:

    Tool Options
         |
         v
    Brush Hook
         |
         v
    Brush Configuration
         |
         v
    CanvasWorkspace
         |
         v
    drawStroke()

This means the interface can change the Brush configuration without
directly manipulating raster pixels.

---

# Eraser Options

## Purpose

The Eraser has its own configuration state.

In particular, the editor can manage the Eraser size independently from
the Brush.

Conceptually:

    Tool Options
         |
         v
    Eraser Hook
         |
         v
    Eraser Configuration
         |
         v
    CanvasWorkspace
         |
         v
    drawStroke()

Brush and Eraser can reuse the same stroke engine while maintaining
different option states.

---

# Selection State

## Purpose

Rectangle selection needs state that persists between pointer events.

A selection begins during one pointer event, changes during movement and
remains available after the pointer is released.

The selection hook centralizes this state.

---

## Selection Lifecycle

The selection lifecycle can be represented as:

    No Selection
         |
         | Pointer Down
         v
    Selection Start
         |
         | Pointer Move
         v
    Selection Updated
         |
         | Pointer Up
         v
    Final Selection

The resulting selection can then be used by other editor operations.

For example:

    Selection
        |
        +--> Crop
        |
        +--> Layer Mask operation

This is why selection state should not exist only as a temporary local
variable inside the Canvas component.

---

# Selection Data

The selection uses document coordinates.

Conceptually:

    Selection
       |
       +-- x
       +-- y
       +-- width
       +-- height

These coordinates correspond to the intrinsic raster document.

They are independent from the current visual zoom.

The Canvas can therefore display the selection at different zoom levels
without modifying the selected raster area.

---

# Shared Selection State

Selection is used by more than one part of the application.

For example:

    CanvasWorkspace
         |
         | creates
         v
      Selection
         |
         +----------------+
         |                |
         v                v
       Crop           Layer Mask

Keeping selection state outside the individual operation allows the same
selection to be reused consistently.

---

# Document History

## Purpose

The history system provides Undo and Redo functionality.

Raster editing operations modify document state, but users need to be able
to return to previous states.

The history system therefore stores snapshots of the raster document.

Conceptually:

    Past
      |
      v
    Current Document
      |
      v
    Future

Undo moves toward a previous state.

Redo restores a state that was previously undone.

---

# History Structure

The history can be understood as three logical parts:

    Past States
         |
         v
    Current State
         |
         v
    Future States

For example:

    State A
      |
      v
    State B
      |
      v
    State C   <- current

After Undo:

    State A
      |
      v
    State B   <- current
      |
      v
    State C   <- available for Redo

This model allows the editor to move backward and forward through recent
document changes.

---

# Saving History Before Editing

For destructive editing operations, the previous state must be preserved
before the operation changes the document.

Conceptually:

    Current Document
          |
          v
    Save Snapshot
          |
          v
    Perform Edit
          |
          v
    New Current Document

This is used for operations such as:

- drawing;
- erasing;
- filters;
- crop;
- layer modifications;
- mask modifications.

---

# Drawing and History

Brush and Eraser generate many pointer-move events during a single stroke.

A stroke may conceptually contain:

    Pointer Down
         |
         v
    Move
         |
         v
    Move
         |
         v
    Move
         |
         v
    Pointer Up

These events represent one logical user action.

History should therefore preserve the document before the stroke rather
than treating every individual pointer movement as a separate user edit.

This keeps Undo behavior understandable.

One Undo should revert the logical editing action instead of moving
through every tiny pointer movement.

---

# ImageData and History

Raster documents contain `ImageData`.

`ImageData` contains mutable pixel information.

Because of this, history snapshots must not accidentally share the same
mutable raster buffers as the current document.

This would be unsafe:

    History State
          |
          +------> ImageData <------ Current State

If the current image were modified, the history snapshot could also
change.

Instead, independent raster data is required:

    History State
          |
          +------> ImageData A

    Current State
          |
          +------> ImageData B

The same principle applies to layer masks.

---

# Layer Masks in History

A layer can contain its own mask `ImageData`.

History therefore needs to preserve both:

    Layer ImageData
           +
    Mask ImageData

Conceptually:

    Document Snapshot
          |
          v
        Layer
        /   \
       /     \
    Pixels   Mask Pixels

Both raster buffers need to represent the historical state correctly.

Otherwise Undo could restore the layer pixels but keep an incorrect mask.

---

# Undo

Undo restores the previous document state.

Conceptually:

    Current State
         |
         | Undo
         v
    Previous State

At the same time, the state being left must remain available for Redo.

The editor can therefore reverse an accidental or unwanted operation.

---

# Redo

Redo restores a state that was previously reverted through Undo.

Conceptually:

    Previous State
         |
         | Redo
         v
    Later State

Undo and Redo therefore operate together rather than as independent
features.

---

# New Edits After Undo

A normal history model must distinguish between Redo history and a new
editing branch.

Conceptually:

    A -> B -> C

Undo:

    A -> B
         |
         +--> C available for Redo

If the user performs a new edit from B:

    A -> B -> D

the previous future state C no longer represents the current editing
branch.

This prevents Redo from applying an unrelated old document state after a
new edit.

---

# History and UI

The history system provides actions that can be triggered from different
interfaces.

For example:

    Edit Menu
        |
        +--> Undo
        |
        +--> Redo

and:

    Keyboard
        |
        +--> Ctrl + Z
        |
        +--> Ctrl + Shift + Z

Both interfaces trigger the same underlying history behavior.

The history logic therefore remains independent from the interface used
to activate it.

---

# Keyboard Shortcuts

## Purpose

Keyboard shortcuts provide faster access to common editor actions.

The V1 centralizes this behavior in a dedicated keyboard-shortcut hook.

The shortcuts include:

    Ctrl + N
        -> New Document

    Ctrl + O
        -> Open Image

    Ctrl + Z
        -> Undo

    Ctrl + Shift + Z
        -> Redo

    Ctrl + Shift + P
        -> Export PNG

    Ctrl + Shift + J
        -> Export JPEG

The Meta modifier can also be recognized for platforms where it is used
instead of Ctrl.

---

# Keyboard Event Flow

The keyboard shortcut system listens for keyboard events and maps them to
editor actions.

Conceptually:

    Keyboard Event
          |
          v
    Shortcut Hook
          |
          v
    Match Shortcut
          |
          v
    Editor Action

For example:

    Ctrl + Z
        |
        v
    Shortcut Hook
        |
        v
    Undo Action
        |
        v
    History System

The keyboard hook does not implement Undo itself.

It only connects the shortcut to the existing action.

---

# Reusing Existing Actions

Keyboard shortcuts should reuse the same operations as the graphical
interface.

For example:

                     +--> File Menu
                     |
    New Document <---+
                     |
                     +--> Ctrl + N

The same applies to:

    Open
    Undo
    Redo
    Export PNG
    Export JPEG

This prevents separate implementations for menu actions and keyboard
actions.

---

# Editable Fields

Keyboard shortcuts must not interfere with normal text editing.

For example, while renaming a layer or entering a document dimension, the
user may need standard keyboard behavior.

The shortcut system therefore ignores shortcut handling when the event
comes from editable elements such as:

    input
    textarea
    select
    contenteditable

This prevents editor shortcuts from unexpectedly replacing normal form
interaction.

---

# Shortcut Listener Lifecycle

The keyboard shortcut hook installs a keyboard event listener when the
hook is active.

React's effect lifecycle is used to manage the listener.

Conceptually:

    Hook mounted
         |
         v
    Add keyboard listener

    Hook updated
         |
         v
    Update listener when required

    Hook unmounted
         |
         v
    Remove keyboard listener

Cleaning up event listeners prevents multiple listeners from accumulating
during the application lifecycle.

---

# Actions Passed to the Shortcut Hook

The shortcut hook receives the actions it needs from the editor.

Conceptually:

    Editor
      |
      +-- New
      +-- Open
      +-- Undo
      +-- Redo
      +-- Export PNG
      +-- Export JPEG
              |
              v
    useKeyboardShortcuts()

The hook therefore does not need to own document creation, file opening,
history or export logic.

Its responsibility is only keyboard mapping.

---

# Hook Composition

The hooks are designed to cooperate rather than forming one large editor
hook.

Conceptually:

                     +--> Tool Manager
                     |
                     +--> Brush Options
                     |
    App / Editor -----+--> Eraser Options
                     |
                     +--> Selection
                     |
                     +--> History
                     |
                     +--> Keyboard Shortcuts

The editor combines these independent pieces of state and passes the
required values and actions to child components.

---

# State Flow Through Components

The general React state flow follows:

    Custom Hook
         |
         v
    App / Editor
         |
         v
    Component Props
         |
         v
    UI Component

User actions can travel in the opposite direction through callbacks:

    UI Component
         |
         v
    Callback
         |
         v
    Hook Action
         |
         v
    Updated State
         |
         v
    React Re-render

This follows React's normal one-way data flow.

---

# Hooks and CanvasWorkspace

`CanvasWorkspace` consumes several values managed outside the Canvas
itself.

For example:

    Active Tool
    Brush Options
    Eraser Options
    Selection

The Canvas uses those values to determine how pointer interactions should
behave.

This keeps the Canvas from becoming the permanent owner of every editor
setting.

---

# Hooks and ToolOptions

`ToolOptions` displays configuration corresponding to the current editing
tool.

Conceptually:

    Active Tool
         |
         v
    ToolOptions
       /     \
      /       \
    Brush     Eraser
    options   options

The actual values are managed by the corresponding state logic rather
than being isolated inside the visual control.

---

# Hooks and MenuBar

The Menu Bar receives actions from the editor.

For example:

    File
      |
      +-- New
      +-- Open
      +-- Export

    Edit
      |
      +-- Undo
      +-- Redo

    Filters
      |
      +-- Filter actions

The Menu Bar does not need to own the document or history implementation.

It triggers actions provided by the editor.

---

# Hooks and LayersPanel

Layer operations modify the raster document rather than only changing
visual component state.

The Layers Panel therefore communicates document changes back to the
editor.

This keeps the document as the source of truth for:

- layer order;
- active layer;
- visibility;
- opacity;
- masks;
- raster data.

---

# Benefits of the Hook Architecture

## Smaller Components

Components do not need to contain every state-management implementation.

## Reusable Logic

Stateful behavior can be reused without copying implementation code.

## Clear Responsibilities

Each hook focuses on a specific concern.

## Easier Debugging

A problem with keyboard shortcuts, selection or history can be
investigated in its corresponding system instead of searching through one
very large component.

## Easier Extension

Future features can introduce dedicated hooks when they require
independent reusable state.

---

# Separation of Responsibilities

The V1 hook architecture can be summarized as:

    Tool Manager
        -> active editing tool

    Brush Options
        -> Brush configuration

    Eraser Options
        -> Eraser configuration

    Selection
        -> rectangle selection state

    History
        -> document snapshots and Undo/Redo

    Keyboard Shortcuts
        -> keyboard event to editor-action mapping

    App / Editor
        -> combines the different systems

    Components
        -> display state and send user actions

    Raster modules
        -> perform image-processing operations

This prevents state management and raster algorithms from becoming
tightly coupled to the UI.

---

# Design Decisions

## One Responsibility per Hook

Editor concerns are separated instead of creating one large hook that
manages the complete application.

## Keep Raster Algorithms Outside Hooks

Hooks manage state and interaction logic.

Pixel-processing algorithms remain in their corresponding domains such as:

    tools/
    filters/
    layers/

## Store Selection in Document Coordinates

Selection remains independent from visual zoom.

## Save History Around Logical Operations

History represents meaningful user edits instead of every low-level
pointer event.

## Deep-Copy Mutable Raster State

Historical `ImageData` and mask data must remain independent from the
current document.

## Reuse Actions for Keyboard and UI

Keyboard shortcuts trigger the same operations used by menus and other
controls.

## Protect Editable Inputs

Editor shortcuts should not replace normal text-editing behavior.

These decisions keep state predictable while allowing the interface to
grow.

---

# Current V1 Limitations

The V1 state and hook architecture supports the current EpiGimp feature
set.

It does not currently provide:

- a visible History panel;
- named history operations;
- persistent history after application restart;
- configurable keyboard shortcuts;
- keyboard shortcut preferences;
- advanced selection state;
- transform state;
- autosave state;
- document recovery state;
- multiple opened documents;
- project persistence through `.epigimp` files.

These capabilities can be introduced later while preserving the current
separation between editor state, UI components and raster-processing
logic.