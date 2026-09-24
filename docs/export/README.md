# Image Export

## Purpose

The export system converts the current EpiGimp raster document into a
standard image file that can be saved on the user's computer.

The V1 supports:

- PNG export;
- JPEG export;
- native operating-system save dialogs.

The export system reuses the same layer-composition logic as the editor so
that the exported image matches the visible document.

The general workflow is:

    RasterDocument
          |
          v
    Layer Composition
          |
          v
    Off-screen Canvas
          |
          v
    Image Encoding
          |
          v
    Blob
          |
          v
    Binary Data
          |
          v
    Electron IPC
          |
          v
    Native Save Dialog
          |
          v
    Image File

---

## Related Source Files

The main export logic is located in:

    src/export/exportImage.ts

The export system also interacts with:

    src/layers/compositeLayers.ts
    src/components/MenuBar/
    electron/preload.ts
    electron/main.ts
    src/types/electron.d.ts

The responsibilities are separated between the React renderer and the
Electron main process.

---

# Export Architecture

Exporting an image requires both raster-processing logic and access to the
operating system.

The renderer process is responsible for:

- creating the final image composition;
- encoding the image;
- converting the result into transferable binary data.

The Electron main process is responsible for:

- opening the native Save dialog;
- receiving the binary image data;
- writing the file to disk.

Conceptually:

    React Renderer
         |
         | Build image
         v
    Encoded binary data
         |
         | IPC
         v
    Electron Main Process
         |
         | Native filesystem access
         v
    Saved image file

This separation respects the Electron security architecture used by
EpiGimp.

---

# Creating the Export Composition

Before an image can be exported, all visible layers must be combined.

The export system creates an off-screen HTML Canvas.

Conceptually:

    RasterDocument
          |
          v
    createCompositionCanvas()
          |
          v
    Off-screen Canvas

The Canvas dimensions match the intrinsic document dimensions.

For a document of:

    1920 x 1080

the export Canvas is also:

    1920 x 1080

The current editor zoom does not affect export resolution.

---

# Export Resolution

Export always uses the intrinsic raster document dimensions.

For example, if the document is:

    800 x 600

and the editor is currently displaying it at:

    200% zoom

the exported image is still:

    800 x 600

Zoom is only a visual editor property.

Conceptually:

    Document resolution
          |
          +----> 800 x 600
          |
    Editor zoom
          |
          +----> 200%

    Export result
          |
          +----> 800 x 600

This prevents editor navigation settings from changing the actual image
resolution.

---

# Reusing Layer Composition

The export system uses the existing:

    compositeLayers()

function.

This is the same layer-composition logic used to render the document in
the editor.

Conceptually:

                        +--> Editor Canvas
                        |
    Document Layers ---> compositeLayers()
                        |
                        +--> Export Canvas

This shared implementation prevents the editor and exported file from
using different rendering rules.

---

# Layer Order

Export respects the current layer order.

Layers are composed using the same ordering rules as the editor.

Changing the position of a layer therefore changes both:

- the visible editor result;
- the exported image.

The export system does not flatten or reorder layers independently before
composition.

---

# Hidden Layers

Hidden layers are excluded from the exported composition.

For example:

    Layer 3    visible
    Layer 2    hidden
    Layer 1    visible

The exported result contains:

    Layer 3
       +
    Layer 1

`Layer 2` remains stored in the EpiGimp document but does not participate
in the export.

This matches what the user sees in the editor.

---

# Layer Opacity

Export respects layer opacity.

For example:

    Layer A
    opacity = 100%

    Layer B
    opacity = 50%

The final exported composition uses those same opacity values.

Opacity is applied during composition rather than permanently modifying
the source layer raster.

---

# Layer Masks

Enabled layer masks are also respected during export.

The composition process applies the mask before drawing the layer into the
final export Canvas.

Conceptually:

    Layer ImageData
          |
          +
       Layer Mask
          |
          v
    Masked Layer
          |
          +
       Layer Opacity
          |
          v
    Export Composition

A disabled mask does not affect the exported layer.

This ensures that mask behavior remains consistent between editing and
export.

---

# PNG Export

## Purpose

PNG export is used when the document should preserve transparency.

The PNG format supports an alpha channel.

This means transparent areas created by:

- erased pixels;
- transparent imported images;
- layer masks;
- partially transparent raster data;

can remain transparent in the exported image.

---

## PNG Workflow

The PNG export workflow is:

    RasterDocument
          |
          v
    createCompositionCanvas()
          |
          v
    Transparent composition
          |
          v
    Encode as image/png
          |
          v
    Blob
          |
          v
    Binary data
          |
          v
    Save as .png

No background is added before PNG encoding.

---

## PNG Transparency

Consider a document containing a visible object surrounded by transparent
pixels.

The composition may conceptually contain:

    Transparent | Visible | Transparent

PNG preserves those transparent regions.

This makes PNG appropriate when the image needs to be reused over another
background.

---

# JPEG Export

## Purpose

JPEG export produces a standard JPEG image.

Unlike PNG, JPEG does not support transparency.

Transparent areas therefore need to be converted into a visible
background before the image is encoded.

EpiGimp uses a white background.

---

# JPEG Composition

The JPEG workflow first creates the normal transparent document
composition.

Conceptually:

    RasterDocument
          |
          v
    compositeLayers()
          |
          v
    Transparent Composition

A second Canvas is then created.

That Canvas is filled with white before the transparent composition is
drawn over it.

Conceptually:

    White Background
          +
    Transparent Composition
          |
          v
    Final JPEG Canvas

The resulting Canvas can then safely be encoded as JPEG.

---

# Why JPEG Uses a Second Canvas

The white background must be applied after the normal document composition
has been generated.

The composition function manages the destination Canvas itself.

If a Canvas were filled with white before calling the normal composition
logic, that background could be cleared during composition.

The safe workflow is therefore:

    Step 1
    Create transparent composition

    Step 2
    Create JPEG Canvas

    Step 3
    Fill JPEG Canvas with white

    Step 4
    Draw transparent composition over white

    Step 5
    Encode JPEG

This guarantees that transparent document regions become white in the
final JPEG.

---

# JPEG Quality

The V1 JPEG export uses an encoding quality of:

    0.92

This value provides a high-quality result while still using JPEG
compression.

The quality setting only applies to JPEG.

PNG uses its own lossless encoding behavior.

---

# Canvas to Blob

Once the final export Canvas is ready, it must be encoded into the
selected image format.

The Canvas is converted into a `Blob`.

Conceptually:

    HTML Canvas
         |
         v
    Image Encoder
         |
         v
    Blob

The MIME type depends on the requested format.

For PNG:

    image/png

For JPEG:

    image/jpeg

The Blob contains the encoded image rather than the raw `ImageData`
pixels.

---

# Blob to Binary Data

The encoded Blob must be transferred from the renderer process to the
Electron main process.

The export system converts the Blob into binary data.

Conceptually:

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

The resulting data can then be sent through the Electron IPC bridge.

This keeps filesystem access outside the renderer process.

---

# Renderer to Electron Communication

The renderer cannot directly use unrestricted Node.js filesystem APIs.

Instead, the export system communicates through the secure Electron
preload bridge.

Conceptually:

    exportImage.ts
         |
         v
    window.electron
         |
         v
    preload.ts
         |
         v
    IPC
         |
         v
    main.ts

The preload layer exposes only the operation required by the renderer.

---

# Preload API

The preload bridge exposes the image-saving operation.

Conceptually, the renderer provides:

    data
    format

where format is:

    png

or:

    jpeg

The preload script forwards the request to the Electron main process.

This avoids exposing the complete Node.js filesystem API to the React
application.

---

# Context Isolation

EpiGimp uses Electron context isolation.

This means the web application and privileged Electron APIs are separated.

The architecture is:

    React / Browser Context
             |
             v
    Controlled Preload API
             |
             v
    Electron Main Process
             |
             v
    Operating System

This is safer than enabling direct Node.js access inside the renderer.

The export system follows the same security architecture used by the rest
of the application.

---

# TypeScript Electron API Definition

The custom Electron API exposed through the preload script is declared in:

    src/types/electron.d.ts

This allows TypeScript to understand operations exposed on the browser
window.

Without the declaration, TypeScript would not know about the custom
Electron API.

The type definition therefore connects:

    preload implementation
            +
    renderer TypeScript types

and keeps the IPC interface explicit.

---

# Native Save Dialog

The actual Save dialog is opened by the Electron main process.

The dialog allows the user to choose:

- the destination directory;
- the file name.

The suggested extension depends on the selected export format.

PNG uses:

    .png

JPEG uses:

    .jpg

The dialog also provides the corresponding file filters.

---

# Default Export Names

The V1 proposes default export names based on the requested format.

Conceptually:

    PNG
        -> epigimp-export.png

    JPEG
        -> epigimp-export.jpg

The user can change the file name before saving.

---

# Canceling the Save Dialog

The user can cancel the native Save dialog.

Canceling is not considered an application error.

Conceptually:

    Export requested
          |
          v
    Save Dialog
       /     \
      /       \
    Save      Cancel
     |          |
     v          v
    Write      Stop
    File       Operation

No image file is written when the user cancels the dialog.

---

# Writing the File

After the user chooses a destination, the Electron main process receives
the encoded binary data.

The data is converted into a Node.js `Buffer`.

Conceptually:

    number[]
        |
        v
    Buffer
        |
        v
    writeFile()
        |
        v
    Image on disk

Filesystem access therefore remains entirely inside the Electron main
process.

---

# PNG Complete Flow

The complete PNG export flow is:

    User
      |
      v
    Export PNG
      |
      v
    exportPng()
      |
      v
    createCompositionCanvas()
      |
      v
    compositeLayers()
      |
      v
    Transparent Canvas
      |
      v
    PNG Blob
      |
      v
    Binary Data
      |
      v
    Preload API
      |
      v
    Electron IPC
      |
      v
    Native Save Dialog
      |
      v
    writeFile()
      |
      v
    .png File

---

# JPEG Complete Flow

The complete JPEG export flow is:

    User
      |
      v
    Export JPEG
      |
      v
    exportJpeg()
      |
      v
    createCompositionCanvas()
      |
      v
    Transparent Composition
      |
      v
    Create JPEG Canvas
      |
      v
    Fill White Background
      |
      v
    Draw Composition
      |
      v
    JPEG Blob
      |
      v
    Binary Data
      |
      v
    Preload API
      |
      v
    Electron IPC
      |
      v
    Native Save Dialog
      |
      v
    writeFile()
      |
      v
    .jpg File

---

# Menu Integration

Export actions are available from the File menu.

The user can select:

    Export PNG

or:

    Export JPEG

The Menu Bar does not implement the image encoding or filesystem logic.

It only triggers the corresponding export action.

This maintains the separation between UI and export infrastructure.

---

# Keyboard Shortcuts

The V1 also provides keyboard shortcuts for export.

PNG:

    Ctrl + Shift + P

JPEG:

    Ctrl + Shift + J

On systems using the Meta modifier, the shortcut system can also recognize
the corresponding platform modifier.

Keyboard handling remains separate from the export implementation.

Both menu actions and keyboard shortcuts ultimately trigger the same
export behavior.

---

# Export Availability

Export requires an opened raster document.

When no document exists, the export actions should not attempt to generate
an image.

The UI therefore uses document availability to determine whether export
actions can be used.

This prevents the export implementation from being called without raster
content.

---

# Error Separation

The export architecture separates possible errors by responsibility.

For example:

    Composition error
        -> renderer / raster processing

    Encoding error
        -> renderer / Canvas encoding

    IPC error
        -> Electron communication

    Save error
        -> main process / filesystem

Keeping these responsibilities separated makes failures easier to locate
and debug.

---

# Export and Editor State

Export does not modify the raster document.

Conceptually:

    RasterDocument
          |
          +------> Editor
          |
          +------> Export

Export reads the current document state and produces a new external image
file.

It does not:

- flatten the document permanently;
- remove layers;
- modify masks;
- change opacity;
- change visibility;
- change document dimensions;
- modify history.

Export is therefore an output operation rather than an editing operation.

---

# Export and Zoom

Editor zoom has no effect on export.

For example:

    Document
        1200 x 800

    Editor zoom
        50%

    Displayed size
        600 x 400

    Exported image
        1200 x 800

This distinction ensures that zoom remains a navigation feature rather
than an image transformation.

---

# Export and Selection

The current rectangle selection is not automatically used as the export
region.

Export operates on the complete raster document.

If the user wants to export only a selected region in the V1 workflow,
the document must first be cropped using the selection.

The resulting document can then be exported normally.

---

# Export and History

Export does not create an Undo/Redo history entry because it does not
modify the document.

The operation:

    Document
       |
       v
    Export
       |
       v
    External File

leaves the editor state unchanged.

This differs from operations such as:

- drawing;
- cropping;
- filtering;
- layer modifications;

which change the document and therefore interact with history.

---

# Security Design

The export system follows an important Electron security principle:

    Renderer
        -> image processing

    Preload
        -> controlled API bridge

    Main Process
        -> filesystem access

The renderer is not given unrestricted access to Node.js.

Instead, only the required save operation is exposed through the preload
bridge.

This works together with the application's existing:

    contextIsolation

configuration.

---

# Separation of Responsibilities

The export architecture can be summarized as:

    MenuBar
        -> exposes export actions

    useKeyboardShortcuts
        -> provides export shortcuts

    exportImage.ts
        -> creates and encodes the final image

    compositeLayers
        -> produces the visible layer composition

    preload.ts
        -> exposes controlled IPC communication

    electron.d.ts
        -> describes the preload API to TypeScript

    main.ts
        -> opens the native dialog and writes the file

This keeps image processing, user interaction and operating-system access
separate.

---

# Design Decisions

## Reuse Existing Layer Composition

Export uses the same `compositeLayers()` implementation as the editor.

This reduces duplicated rendering logic and helps ensure visual
consistency.

## Preserve Intrinsic Resolution

Export uses document dimensions rather than the current editor zoom.

## Preserve PNG Transparency

PNG is encoded directly from the transparent document composition.

## Use White Background for JPEG

Because JPEG does not support transparency, the transparent composition is
drawn over a white background before encoding.

## Use a Second Canvas for JPEG

The white background is applied after normal composition so it cannot be
removed by the composition process.

## Keep Filesystem Access in Electron Main

The renderer creates the image but does not directly write arbitrary
files.

## Use the Preload Bridge

Only the required save operation is exposed to the renderer.

These decisions keep export consistent with both the raster architecture
and Electron security model.

---

# Current V1 Limitations

The V1 export system supports the essential raster export workflow.

It does not currently provide:

- custom JPEG quality controls;
- export scaling;
- custom export dimensions;
- WebP export;
- TIFF export;
- BMP export;
- export-selected-area directly;
- metadata configuration;
- color-profile configuration;
- batch export;
- export presets;
- advanced export preview.

The native `.epigimp` project format is also separate from standard image
export and can be introduced as a future document-persistence feature.