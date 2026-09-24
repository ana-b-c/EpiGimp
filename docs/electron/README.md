# Electron Architecture

## Purpose

Electron provides the desktop environment used by EpiGimp.

The React application is responsible for the editor interface and raster
editing logic, while Electron provides access to native operating-system
features that are not directly available from a normal web application.

In the V1, Electron is mainly responsible for:

- creating the desktop application window;
- loading the React application;
- providing secure communication between React and the operating system;
- opening native file dialogs;
- reading image files selected by the user;
- opening native save dialogs;
- writing exported images to disk;
- separating privileged Node.js operations from the renderer.

The general architecture is:

    React Renderer
          |
          v
    Preload Bridge
          |
          v
    Electron IPC
          |
          v
    Main Process
          |
          v
    Operating System

---

## Related Source Files

The Electron implementation is located in:

    electron/
    ├── main.ts
    └── preload.ts

The renderer-side Electron API is described in:

    src/types/electron.d.ts

Electron also interacts with:

    src/components/MenuBar/
    src/export/exportImage.ts

and with the document import logic used by the editor.

---

# Electron Processes

Electron applications contain different execution contexts.

EpiGimp mainly uses:

    Main Process
         |
         +-- creates the application window
         +-- accesses native APIs
         +-- accesses the filesystem
         +-- handles IPC requests

    Preload Script
         |
         +-- exposes controlled APIs

    Renderer Process
         |
         +-- runs React
         +-- displays the editor
         +-- performs raster editing

These contexts have different responsibilities.

---

# Main Process

The Electron main process is implemented in:

    electron/main.ts

It is the privileged part of the desktop application.

The main process is responsible for operations such as:

- application lifecycle;
- BrowserWindow creation;
- native dialogs;
- filesystem access;
- IPC handlers.

React does not directly perform these privileged operations.

---

# Application Startup

When EpiGimp starts, Electron initializes the application and creates the
main application window.

Conceptually:

    Start EpiGimp
         |
         v
    Electron Application
         |
         v
    Create BrowserWindow
         |
         v
    Configure Preload
         |
         v
    Load React Application
         |
         v
    Editor displayed

The BrowserWindow acts as the desktop container for the React interface.

---

# BrowserWindow

The BrowserWindow contains the EpiGimp renderer.

Its configuration defines how the web application interacts with
Electron.

An important part of the configuration is the preload script.

Conceptually:

    BrowserWindow
         |
         +-- React renderer
         |
         +-- preload bridge
         |
         +-- security configuration

The native Electron menu is not used as the main EpiGimp editor menu.

EpiGimp provides its own menu interface inside the React application.

---

# Development and Production Loading

Electron needs to load the React application differently depending on the
environment.

During development, React is served by the Vite development server.

Conceptually:

    Electron
        |
        v
    Vite Development Server
        |
        v
    React Application

This allows development features such as fast rebuilding and hot reload.

In production, Electron loads the generated application files from the
build output.

Conceptually:

    Electron
        |
        v
    Production Build
        |
        v
    React Application

This allows the same Electron application to work both during development
and after the frontend has been built.

---

# Renderer Process

The renderer process contains the React application.

It is responsible for the editor itself.

This includes:

- Menu Bar;
- Toolbar;
- Tool Options;
- Canvas workspace;
- Layers Panel;
- Status Bar;
- document state;
- drawing tools;
- selections;
- filters;
- history;
- export image generation.

The renderer should not have unrestricted access to Node.js or the
operating system.

---

# Why the Renderer Is Restricted

The React interface processes application content and user interactions.

Giving it unrestricted access to:

    filesystem
    Node.js APIs
    operating-system APIs

would unnecessarily increase the privileges of the renderer.

Instead, EpiGimp exposes only the specific native operations required by
the editor.

This is done through the preload script.

---

# Preload Script

The preload script is implemented in:

    electron/preload.ts

Its purpose is to create a controlled bridge between the React renderer
and Electron.

Conceptually:

    React
      |
      X  No unrestricted Node.js access
      |
    Preload
      |
      v
    Electron IPC
      |
      v
    Main Process

The preload script exposes only selected application operations.

---

# Context Isolation

EpiGimp enables:

    contextIsolation

Context isolation separates the JavaScript context used by the webpage
from the privileged Electron preload context.

Conceptually:

    Renderer Context
          |
          | controlled API only
          v
    Preload Context
          |
          v
    Electron APIs

This prevents the React application from directly accessing everything
available to the preload script.

---

# Controlled API Exposure

The preload script exposes a small API to the renderer.

The goal is not to expose Electron itself.

Instead of:

    React
      |
      v
    Complete Electron API

EpiGimp uses:

    React
      |
      v
    EpiGimp-specific API
      |
      v
    Preload
      |
      v
    Electron

This limits the operations available to the renderer.

---

# IPC

IPC means:

    Inter-Process Communication

Electron uses IPC to communicate between the renderer-side bridge and the
main process.

The general flow is:

    Renderer
       |
       | request
       v
    Preload
       |
       | IPC
       v
    Main Process
       |
       | operation
       v
    Operating System

A result can then travel back in the opposite direction.

---

# Request / Response Flow

A typical native operation follows:

    React requests operation
              |
              v
    Preload sends IPC request
              |
              v
    Main process receives request
              |
              v
    Native operation is executed
              |
              v
    Main process returns result
              |
              v
    Preload returns result
              |
              v
    React continues operation

This allows asynchronous native operations without giving the renderer
direct operating-system access.

---

# Opening Images

EpiGimp uses Electron to open image files through a native file dialog.

The V1 supports importing:

    PNG
    JPEG

The workflow is:

    User
      |
      v
    File -> Open
      |
      v
    React action
      |
      v
    Preload API
      |
      v
    IPC
      |
      v
    Main Process
      |
      v
    Native Open Dialog
      |
      v
    Selected Image
      |
      v
    Image data returned to renderer

The renderer can then create the corresponding raster document.

---

# Native Open Dialog

The native dialog allows the operating system to provide the file
selection interface.

This is preferable to implementing a custom filesystem browser inside
React.

The user can select a supported raster image using the normal desktop
interface.

If the dialog is cancelled, no document is created.

Cancellation is considered a normal user action rather than an
application error.

---

# Reading Imported Files

After the user selects an image, the privileged Electron side can access
the selected file.

The image content is then transferred back through the controlled Electron
bridge.

The renderer uses that data to create the raster document while
preserving the imported image dimensions.

For PNG images, transparency can also be preserved.

---

# Invalid Image Handling

Opening a file does not guarantee that its content represents a valid
image.

The import workflow therefore needs to handle cases such as:

    corrupted image
    unsupported image data
    invalid file content

An invalid import should not crash the entire Electron application.

Instead, the editor can reject the import and display an appropriate
error state.

---

# Saving Exported Images

The same Electron architecture is used when saving exported images.

The renderer first creates the final encoded image.

Electron then handles the filesystem operation.

Conceptually:

    RasterDocument
          |
          v
    Export System
          |
          v
    Encoded Image
          |
          v
    Preload API
          |
          v
    IPC
          |
          v
    Main Process
          |
          v
    Save Dialog
          |
          v
    Filesystem

---

# Save Image IPC

The renderer sends the main process:

    image data
    image format

The format can be:

    png

or:

    jpeg

The main process then determines the appropriate save dialog configuration
and writes the resulting file.

---

# Binary Data Transfer

The browser-side export system creates encoded image data.

Before sending it to Electron, the binary data is prepared in a form that
can be transferred through the bridge.

Conceptually:

    Canvas
      |
      v
    Blob
      |
      v
    ArrayBuffer
      |
      v
    Uint8Array
      |
      v
    number[]
      |
      v
    IPC

The Electron main process reconstructs binary file data from the received
values.

---

# Writing Files

The main process uses Node.js filesystem functionality to write the
exported image.

Conceptually:

    Received number[]
          |
          v
    Buffer
          |
          v
    writeFile()
          |
          v
    File on disk

This operation remains outside the React renderer.

---

# Native Save Dialog

Before writing the image, Electron opens the native Save dialog.

The user can choose:

- destination directory;
- file name.

The dialog configuration depends on the export format.

For PNG:

    Default name:
    epigimp-export.png

For JPEG:

    Default name:
    epigimp-export.jpg

The user can modify these names before saving.

---

# Save Cancellation

The user may close or cancel the Save dialog.

In this situation:

    Save Dialog
        |
        v
      Cancel
        |
        v
    No file written

The document remains unchanged.

The cancellation does not require an Undo operation because export does
not modify the raster document.

---

# TypeScript Renderer API

The API exposed by the preload script must also be known by TypeScript.

This is handled in:

    src/types/electron.d.ts

The declaration describes the custom API available through the browser
window.

Conceptually:

    preload.ts
        |
        | Runtime implementation
        v
    window Electron API


    electron.d.ts
        |
        | TypeScript description
        v
    window Electron API

The implementation and declaration therefore describe the same bridge
from two different perspectives.

---

# Why electron.d.ts Is Important

Without the custom type declaration, TypeScript would only know the normal
browser `window` interface.

It would not know about EpiGimp-specific Electron functions.

The declaration allows code such as native file operations to remain
type-checked.

This helps detect incorrect parameters or missing API functions during
development.

---

# Security Boundary

One of the most important architectural decisions in the Electron part of
EpiGimp is the boundary between the renderer and the operating system.

The intended structure is:

    +---------------------------+
    |      React Renderer       |
    |                           |
    | UI / Canvas / Tools       |
    | Layers / Filters / State  |
    +-------------+-------------+
                  |
                  | Controlled API
                  v
    +---------------------------+
    |      Preload Script       |
    |                           |
    | Limited Electron bridge   |
    +-------------+-------------+
                  |
                  | IPC
                  v
    +---------------------------+
    |    Electron Main Process  |
    |                           |
    | Dialogs / Filesystem      |
    +-------------+-------------+
                  |
                  v
    +---------------------------+
    |     Operating System      |
    +---------------------------+

The renderer does not need unrestricted operating-system privileges.

---

# Content Security Policy

The application also defines a Content Security Policy.

The V1 configuration controls which resources the renderer can load.

The policy allows the resources required by EpiGimp while restricting
unnecessary external sources.

The application needs support for resources such as:

    local application files
    data images
    blob images

During development, communication with the Vite development server is
also required.

The Content Security Policy complements the Electron process separation.

---

# Development Environment

The Electron development environment combines:

    Vite
    React
    TypeScript
    Electron

The development workflow needs both the frontend development server and
the Electron desktop process.

Conceptually:

    npm development command
          |
          +--------------------+
          |                    |
          v                    v
    Vite Dev Server       Electron
          |                    |
          +---------+----------+
                    |
                    v
              EpiGimp Window

This allows the React frontend to be developed while running inside its
actual desktop environment.

---

# Linux Development

The V1 has been developed and tested on Ubuntu/Linux.

In the current development environment, Electron is launched using:

    --ozone-platform=x11

This ensures the Electron development window works correctly with the
current Linux graphical environment.

This is a development/runtime compatibility setting and does not change
the raster architecture of EpiGimp.

---

# Electron and React Separation

Electron and React have different responsibilities.

React handles:

    UI
    Editor state
    Canvas
    Tools
    Layers
    Masks
    Filters
    History
    Image composition

Electron handles:

    Desktop window
    Native dialogs
    File access
    File writing
    IPC
    Application lifecycle

The separation can be summarized as:

    React
      -> What should the editor do?

    Electron
      -> What native operating-system operation is required?

---

# Electron and Export Separation

The export system is intentionally split between the renderer and main
process.

The renderer performs image-specific work:

    Layers
      |
      v
    Composition
      |
      v
    PNG / JPEG Encoding

Electron performs operating-system work:

    Encoded Image
         |
         v
    Save Dialog
         |
         v
    Filesystem

The main process does not need to understand layers, masks or filters.

The renderer does not need unrestricted filesystem access.

---

# Electron and Image Import Separation

The same principle applies to image import.

Electron handles:

    File selection
    File access

The renderer handles:

    Raster document creation
    Layers
    Canvas rendering
    Editing

This prevents operating-system code from becoming mixed with editor
domain logic.

---

# Error Boundaries

The architecture also helps identify where an error occurs.

For example:

    File dialog problem
        -> Electron main process

    IPC problem
        -> Preload / Electron communication

    Invalid image
        -> Import / raster decoding

    Rendering problem
        -> React / Canvas

    Export encoding problem
        -> Renderer export system

    File writing problem
        -> Electron main process

Clear boundaries make debugging easier.

---

# Separation of Responsibilities

The Electron architecture can be summarized as:

    main.ts
        -> application lifecycle
        -> BrowserWindow
        -> native dialogs
        -> filesystem operations
        -> IPC handlers

    preload.ts
        -> controlled renderer API
        -> IPC communication

    electron.d.ts
        -> TypeScript definition of the exposed API

    React renderer
        -> editor UI
        -> raster processing
        -> document state

    exportImage.ts
        -> image composition and encoding

This prevents desktop infrastructure from becoming mixed with image
editing logic.

---

# Design Decisions

## Context Isolation

The renderer and preload contexts are separated.

This limits direct access to privileged APIs.

## Controlled Preload API

Only operations required by EpiGimp are exposed.

The complete Electron or Node.js API is not made available to React.

## Native Dialogs in Main Process

Open and Save operations are handled through Electron rather than custom
React filesystem interfaces.

## Filesystem Access in Main Process

Reading and writing native files remains on the privileged Electron side.

## IPC for Communication

The renderer requests native operations through explicit IPC channels.

## TypeScript API Declaration

The exposed preload interface is represented in `electron.d.ts` so the
renderer remains type-safe.

## Editor Logic Stays in Renderer

Layers, filters, tools and image processing are not moved into Electron
simply because the application is a desktop application.

These decisions maintain a clear security and architectural boundary.

---

# Complete V1 Desktop Flow

The complete EpiGimp architecture can be represented as:

    +--------------------------------------------------+
    |                  React Renderer                  |
    |                                                  |
    |  MenuBar    Toolbar       LayersPanel            |
    |     |          |               |                 |
    |     +----------+---------------+                 |
    |                |                                 |
    |                v                                 |
    |          Editor State                            |
    |                |                                 |
    |      +---------+---------+                       |
    |      |         |         |                       |
    |      v         v         v                       |
    |    Tools     Layers    Filters                    |
    |      |         |         |                       |
    |      +---------+---------+                       |
    |                |                                 |
    |                v                                 |
    |         RasterDocument                           |
    |                |                                 |
    |                v                                 |
    |        Canvas Composition                        |
    +----------------+---------------------------------+
                     |
                     | Native operation required
                     v
    +--------------------------------------------------+
    |                  Preload                         |
    |                                                  |
    |          Controlled Electron API                 |
    +----------------+---------------------------------+
                     |
                     | IPC
                     v
    +--------------------------------------------------+
    |             Electron Main Process                |
    |                                                  |
    |   BrowserWindow    Dialogs    Filesystem         |
    +----------------+---------------------------------+
                     |
                     v
    +--------------------------------------------------+
    |               Operating System                   |
    +--------------------------------------------------+

This separation is the foundation of the EpiGimp V1 desktop
architecture.

---

# Current V1 Limitations

The V1 Electron integration provides the native functionality required by
the current editor.

It does not currently provide:

- `.epigimp` project persistence;
- autosave;
- crash recovery;
- recent-file history;
- unsaved-document protection;
- multiple application windows;
- multiple opened documents;
- drag-and-drop file opening;
- packaged installers;
- automatic updates;
- operating-system file associations.

These features can be introduced later while preserving the current
Renderer -> Preload -> Main Process separation.