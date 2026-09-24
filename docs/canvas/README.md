# Canvas System

## Purpose

The canvas system is the central raster workspace of EpiGimp.

It is responsible for:

- displaying the current raster document;
- rendering the layer composition;
- handling visual zoom;
- converting pointer coordinates to document coordinates;
- providing drawing previews;
- handling rectangle selection interactions;
- connecting canvas interactions with editing tools.

## Related Source Files

    src/canvas/
    ├── CanvasWorkspace/
    │   ├── CanvasWorkspace.tsx
    │   └── CanvasWorkspace.css
    └── getCanvasCoordinates.ts

The canvas system also interacts with:

    src/layers/compositeLayers.ts
    src/tools/drawStroke.ts
    src/tools/colorPicker/pickCanvasColor.ts
    src/tools/selection/types.ts

---

## CanvasWorkspace

`CanvasWorkspace` is the main component responsible for displaying and
interacting with the raster document.

It receives the current document and editing state from the editor and
connects pointer events with the appropriate tool behavior.

The component handles:

- document rendering;
- brush drawing;
- erasing;
- color picking;
- rectangle selection;
- temporary drawing previews;
- zoom display.

---

## Document Rendering

The visible document is generated from the document layer stack.

Rendering uses:

    compositeLayers(
      context,
      document.layers,
      document.width,
      document.height,
    )

This means the canvas does not render only the active layer.

Instead, `compositeLayers()` produces the final visible composition from
all layers while respecting their visibility, opacity and masks.

When the document changes, the canvas is automatically rendered again.

---

## Canvas Resolution

The HTML canvas always keeps the real raster document resolution.

For example, an `800 x 600` document creates a canvas with:

    width  = 800
    height = 600

Zoom does not modify these values.

This is important because changing the intrinsic canvas size would also
change the raster resolution and could recreate or clear its pixel data.

---

## Zoom

Zoom only changes the displayed CSS size of the canvas.

The scale is calculated with:

    const zoomScale = zoom / 100

The displayed size becomes:

    displayed width  = document width  x zoom scale
    displayed height = document height x zoom scale

For an `800 x 600` document:

    50% zoom  -> displayed as 400 x 300
    100% zoom -> displayed as 800 x 600
    200% zoom -> displayed as 1600 x 1200

The underlying raster remains `800 x 600` in every case.

This separates:

    Raster resolution
            !=
    Display size

---

## Pointer Coordinate Conversion

Because the displayed canvas can be zoomed, browser pointer coordinates
cannot be used directly as raster coordinates.

`getCanvasCoordinates()` converts the pointer position from the displayed
canvas space into the intrinsic raster space.

The conversion is:

    document X =
    (pointer X - canvas left) x intrinsic width / displayed width

    document Y =
    (pointer Y - canvas top) x intrinsic height / displayed height

This allows editing tools to operate on the correct pixels regardless of
the current zoom level.

For example, clicking at the center of an `800 x 600` document displayed
at 200% still produces approximately:

    x = 400
    y = 300

instead of coordinates based on the enlarged CSS dimensions.

---

## Active Layer Editing

Brush and eraser operations modify only the active layer.

Before drawing begins, `CanvasWorkspace` retrieves the layer whose ID
matches:

    document.activeLayerId

If no active layer exists, the drawing operation is ignored.

The other layers remain unchanged.

---

## Temporary Editing Canvas

Drawing is not performed directly on the final composition canvas.

When a brush or eraser operation starts, EpiGimp creates a temporary
off-screen canvas containing the active layer's current `ImageData`.

The workflow is:

    Active Layer ImageData
            |
            v
    Temporary Editing Canvas
            |
            v
    Brush / Eraser strokes
            |
            v
    Temporary ImageData
            |
            v
    Document preview
            |
            v
    Pointer released
            |
            v
    Updated active layer ImageData

This separation is important because the visible canvas represents the
complete layer composition, while drawing must modify only one layer.

---

## Real-Time Drawing Preview

While the pointer moves, the temporary editing canvas is updated with the
current stroke.

Its `ImageData` is then temporarily substituted for the active layer
during rendering.

The other layers continue to use their normal raster data.

This provides a real-time preview of the final composition without
committing every pointer movement directly to the document state.

When the pointer is released, the final `ImageData` is sent back to the
document state.

---

## Brush and Eraser

Both Brush and Eraser use the shared `drawStroke()` function.

`CanvasWorkspace` determines which configuration should be sent to the
drawing system.

For Brush:

    size  = brush size
    color = foreground color
    erase = false

For Eraser:

    size  = eraser size
    erase = true

The actual stroke algorithm remains outside the Canvas component.

This keeps interaction handling separate from raster drawing logic.

---

## Color Picker

When the Color Picker is active, a pointer press does not start an editing
operation.

Instead, the current rendered canvas pixel is read through:

    pickCanvasColor()

If a valid color is found, it becomes the new foreground color.

Because the picker reads the rendered canvas, it samples the visible
document composition at that position.

---

## Rectangle Selection

Rectangle selection uses pointer capture so the selection can continue
while the pointer is being dragged.

When selection starts, EpiGimp stores the initial document coordinate.

During pointer movement, it calculates a rectangle between the initial
point and the current point.

The selection contains:

    x
    y
    width
    height

`Math.min()` and `Math.abs()` allow selections to be created in any drag
direction.

The selection itself is displayed as an HTML overlay positioned above the
canvas.

Its visual position and size are multiplied by the current zoom scale.

The stored selection coordinates remain in intrinsic document space.

---

## Pointer Interaction Flow

The canvas chooses behavior according to the active tool.

    Pointer Down
         |
         +-- Color Picker
         |      |
         |      +-- Read visible pixel color
         |
         +-- Rectangle Select
         |      |
         |      +-- Start selection
         |
         +-- Brush
         |      |
         |      +-- Start temporary editing canvas
         |
         +-- Eraser
                |
                +-- Start temporary editing canvas

During pointer movement:

    Selection
        |
        +-- Update selection rectangle

    Brush / Eraser
        |
        +-- Draw stroke
        |
        +-- Update temporary composition preview

When the pointer interaction ends:

    Selection
        |
        +-- Finish interaction

    Brush / Eraser
        |
        +-- Extract final ImageData
        |
        +-- Update active layer

---

## History Integration

`CanvasWorkspace` does not directly manage Undo/Redo history.

Instead, it calls:

    onEditStart()

before a brush or eraser editing operation begins.

The parent editor is responsible for registering the current document
state in history.

This keeps history management separate from canvas interaction logic.

---

## Separation of Responsibilities

The canvas architecture intentionally separates several responsibilities:

    CanvasWorkspace
        -> pointer interaction and display

    getCanvasCoordinates
        -> coordinate conversion

    drawStroke
        -> raster drawing

    pickCanvasColor
        -> color sampling

    compositeLayers
        -> layer rendering

    Editor state / hooks
        -> document and history state

This prevents `CanvasWorkspace` from containing every image-processing
algorithm used by EpiGimp.

---

## Current V1 Limitations

The V1 canvas system focuses on the original project requirements.

It does not currently provide:

- canvas rotation;
- arbitrary image transformations;
- advanced selection shapes;
- selection movement or resizing handles;
- advanced GPU rendering;
- dedicated performance optimizations for very large documents.

These features can be introduced later without changing the basic
separation between raster resolution, display zoom and editing logic.