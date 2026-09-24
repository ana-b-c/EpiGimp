# Editing Tools

## Purpose

The tools system contains the interactive editing operations available in
EpiGimp.

Its role is to separate editing behavior from the React interface and from
the document rendering system.

The V1 provides the following tools:

- Brush;
- Eraser;
- Color Picker;
- Rectangle Selection;
- Crop.

The active tool is managed independently from the Canvas component so that
new tools can be added without redesigning the complete editor.

## Related Source Files

    src/tools/
    ├── brush/
    │   └── types.ts
    ├── colorPicker/
    │   └── pickCanvasColor.ts
    ├── eraser/
    │   └── types.ts
    ├── selection/
    │   ├── cropImageData.ts
    │   └── types.ts
    ├── drawStroke.ts
    ├── toolDefinitions.ts
    └── types.ts

The tools system also interacts with:

    src/hooks/useToolManager.ts
    src/hooks/useBrushOptions.ts
    src/hooks/useEraserOptions.ts
    src/hooks/useSelection.ts
    src/canvas/CanvasWorkspace/CanvasWorkspace.tsx
    src/canvas/getCanvasCoordinates.ts

---

## Tool Architecture

EpiGimp separates three different responsibilities:

    Tool definition
          |
          v
    Tool state / options
          |
          v
    Canvas interaction
          |
          v
    Raster operation

For example, selecting the Brush does not directly modify the image.

Instead:

    Toolbar
       |
       v
    Active tool = Brush
       |
       v
    Canvas receives pointer event
       |
       v
    Brush options are read
       |
       v
    drawStroke()
       |
       v
    Active layer pixels are modified

This keeps the UI independent from the raster algorithms.

---

## Tool Definitions

The available editor tools are described centrally in:

    src/tools/toolDefinitions.ts

This prevents the toolbar from defining its own independent list of tools.

Each tool definition contains the information needed by the interface to
identify and display the tool.

The active tool itself is represented by the shared tool types from:

    src/tools/types.ts

Centralizing tool definitions makes it easier to introduce additional
tools later.

---

## Active Tool

Only one editing tool is active at a time.

The active tool is managed through:

    useToolManager()

The Canvas workspace receives the current tool and decides which
interaction should occur when the user presses or moves the pointer.

The Canvas therefore does not decide which tool should be selected. It
only reacts to the tool state provided by the editor.

---

# Brush

## Purpose

The Brush modifies the pixel data of the active layer by drawing colored
strokes.

The Brush has its own options, including:

- foreground color;
- brush size.

These values are managed separately from the Canvas interaction code.

---

## Brush Options

Brush configuration is handled through:

    useBrushOptions()

The Canvas receives the current brush configuration and uses it when a
Brush interaction begins.

This means changing the Brush size or color does not require changing the
drawing algorithm itself.

---

## Brush Drawing

The Brush uses:

    drawStroke()

The drawing function receives the Canvas rendering context, the previous
pointer position, the current pointer position and the current drawing
options.

Conceptually:

    Previous point
          |
          v
    drawStroke()
          |
          v
    Current point

Using both the previous and current coordinates allows EpiGimp to create
continuous strokes instead of drawing only isolated points for each
pointer event.

---

## Brush Color

The Brush uses the current foreground color.

The foreground color can be changed through the Tool Options interface or
by using the Color Picker.

The raster drawing algorithm receives the selected color rather than
reading it directly from the UI.

This keeps color selection and raster drawing separate.

---

# Eraser

## Purpose

The Eraser uses the same general stroke system as the Brush but removes
pixel visibility instead of adding a visible color.

Its size is managed independently through:

    useEraserOptions()

---

## Shared Stroke Engine

Brush and Eraser both use:

    drawStroke()

The difference is provided through the drawing configuration.

Brush:

    erase = false

Eraser:

    erase = true

This avoids maintaining two separate stroke algorithms.

The common behavior remains:

- line interpolation;
- stroke size;
- rounded drawing;
- pointer movement handling.

Only the pixel-compositing behavior changes.

---

## Erasing and Transparency

The Eraser removes pixels through Canvas compositing rather than painting
them with a background color.

This is important because EpiGimp supports transparency.

Painting white would not actually erase the raster data and would produce
incorrect results when:

- another layer exists underneath;
- the document is exported as PNG;
- the layer is moved or its opacity changes.

The Eraser therefore produces transparent pixels instead of assuming a
specific background color.

---

# Color Picker

## Purpose

The Color Picker samples a color from the currently rendered document.

Its raster operation is implemented in:

    src/tools/colorPicker/pickCanvasColor.ts

---

## Picking a Color

When the Color Picker is active and the user clicks the Canvas:

    Pointer position
          |
          v
    Canvas coordinates
          |
          v
    pickCanvasColor()
          |
          v
    Pixel RGB value
          |
          v
    Foreground color

The selected color can then be used by the Brush.

---

## Visible Composition

The Color Picker samples the visible Canvas composition.

This is different from reading only the active layer.

For example, if several visible layers overlap, the sampled color
corresponds to the rendered result visible to the user at that position.

This behavior makes the Color Picker consistent with what is displayed in
the editor.

---

# Rectangle Selection

## Purpose

The Rectangle Selection tool defines a rectangular region of the raster
document.

Selection state is managed independently through:

    useSelection()

The selection data itself is defined in:

    src/tools/selection/types.ts

---

## Selection Coordinates

A selection stores document-space values:

    x
    y
    width
    height

These values use the intrinsic raster coordinate system.

They are not stored using the visually zoomed Canvas dimensions.

This is important because a selection must represent the same pixels
regardless of the current zoom level.

---

## Creating a Selection

When the pointer is pressed with the Rectangle Selection tool active,
EpiGimp stores the initial document coordinate.

While the pointer moves, the selection rectangle is calculated from:

    Start position
          +
    Current position
          |
          v
    Rectangle

The implementation allows the user to drag in different directions.

Conceptually:

    x = minimum horizontal coordinate
    y = minimum vertical coordinate

    width  = horizontal distance
    height = vertical distance

The resulting rectangle always uses positive dimensions.

---

## Selection Display

The selection is displayed visually above the Canvas.

The stored selection remains in document coordinates, while the visual
overlay uses the current zoom scale.

For example:

    Document selection width = 100 pixels

At 50% zoom:

    Displayed selection width = 50 pixels

At 200% zoom:

    Displayed selection width = 200 pixels

The selected raster area remains exactly 100 pixels wide.

---

# Crop

## Purpose

Crop creates a new raster region based on the current rectangular
selection.

The pixel operation is implemented in:

    src/tools/selection/cropImageData.ts

---

## Crop Operation

The crop helper receives:

- source `ImageData`;
- the current rectangular selection.

It returns new raster data containing only the selected region.

Conceptually:

    Original ImageData
           +
    Rectangle Selection
           |
           v
    cropImageData()
           |
           v
    Cropped ImageData

The operation changes the raster dimensions according to the selected
region.

---

## Crop and Layers

Cropping is a document-level operation.

The same selection dimensions must therefore be applied consistently to
the layer stack rather than cropping only what is visually displayed.

Masks also need to remain aligned with their associated layer after a
crop.

This ensures that the layer structure remains coherent after the document
dimensions change.

---

## Crop and Selection

After a crop operation, the old selection no longer represents valid
coordinates in the new document.

The editor therefore clears the selection after applying the crop.

This prevents later operations from using coordinates belonging to the
previous document dimensions.

---

# Coordinate Handling

Editing tools operate in raster document coordinates.

Browser pointer coordinates are converted through:

    getCanvasCoordinates()

This is required because the displayed Canvas can be zoomed.

The tools therefore receive coordinates corresponding to the real raster
pixels rather than the CSS display size.

The relationship is:

    Browser pointer
          |
          v
    Canvas display coordinates
          |
          v
    getCanvasCoordinates()
          |
          v
    Raster document coordinates
          |
          v
    Editing tool

This shared coordinate system keeps Brush, Eraser, Color Picker and
Selection behavior consistent at every zoom level.

---

# History Integration

Editing tools do not directly own the Undo/Redo history.

Before a destructive editing operation begins, the editor stores the
current document state.

The operation can then modify the active layer or document.

Conceptually:

    Current document
          |
          v
    Save history state
          |
          v
    Apply tool operation
          |
          v
    Updated document

This allows drawing and crop operations to be reverted through the shared
history system.

---

# Separation of Responsibilities

The tools architecture follows this separation:

    Toolbar
        -> lets the user choose a tool

    useToolManager
        -> stores the active tool

    Tool option hooks
        -> store tool-specific configuration

    CanvasWorkspace
        -> handles pointer interaction

    getCanvasCoordinates
        -> converts display coordinates

    drawStroke
        -> performs Brush / Eraser raster drawing

    pickCanvasColor
        -> reads a rendered pixel color

    cropImageData
        -> extracts a raster region

    useSelection
        -> stores selection state

This separation allows editing algorithms to remain independent from the
React interface.

---

# Adding a New Tool

A future editing tool should follow the existing architecture instead of
placing all of its logic directly inside the Toolbar.

A typical integration would be:

    1. Define the tool.
    2. Add its shared type if necessary.
    3. Add tool-specific options or state.
    4. Implement the raster operation in the tools domain.
    5. Connect pointer interaction in CanvasWorkspace.
    6. Add the tool to the Toolbar.
    7. Integrate the operation with history when necessary.

This keeps new tools consistent with the existing Brush, Eraser, Color
Picker and Selection architecture.

---

# Current V1 Limitations

The V1 tools system focuses on the original project scope.

It does not currently provide:

- freehand or polygonal selections;
- magic-wand selection;
- selection feathering;
- selection movement;
- selection resizing handles;
- text tools;
- shape tools;
- clone/healing tools;
- advanced brush presets;
- pressure-sensitive drawing;
- transform handles.

These capabilities can be introduced as future tools while keeping the
same separation between tool state, Canvas interaction and raster
algorithms.