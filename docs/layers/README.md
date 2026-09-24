# Layers and Masks

## Purpose

The layer system allows an EpiGimp raster document to contain multiple
independent images that are combined to produce the final visible result.

Each layer owns its own raster data and rendering properties.

The layer system is responsible for:

- storing independent raster layers;
- selecting an active layer;
- controlling layer visibility;
- controlling layer opacity;
- changing the layer order;
- duplicating layers;
- deleting layers;
- renaming layers;
- managing non-destructive masks;
- composing visible layers for rendering and export.

## Related Source Files

    src/layers/
    ├── compositeLayers.ts
    ├── createLayer.ts
    ├── createLayerMask.ts
    ├── maskSelection.ts
    └── types.ts

The layer system also interacts with:

    src/types/RasterDocument.ts
    src/components/LayersPanel/
    src/canvas/CanvasWorkspace/
    src/hooks/
    src/export/exportImage.ts

---

# Raster Document and Layers

A raster document contains a collection of layers.

Conceptually:

    RasterDocument
        |
        +-- width
        +-- height
        +-- activeLayerId
        |
        +-- layers
              |
              +-- Layer 1
              +-- Layer 2
              +-- Layer 3
              +-- ...

The document also stores the ID of the layer currently selected for
editing.

This makes the active layer part of the document state rather than a
property of the Layers Panel interface.

---

# Layer Structure

A layer is represented by the `Layer` interface.

Each layer contains:

    id
    name
    imageData
    visible
    opacity
    mask

The structure is conceptually:

    Layer
      |
      +-- id
      +-- name
      +-- imageData
      +-- visible
      +-- opacity
      |
      +-- mask (optional)
            |
            +-- imageData
            +-- enabled

---

## Layer ID

Each layer has a unique identifier.

The ID allows EpiGimp to reference a specific layer independently from its
position in the layer array.

This is especially important for the active layer.

Instead of storing:

    active layer index = 2

the document stores:

    activeLayerId = unique layer identifier

The layer can therefore remain identifiable even if the layer order
changes.

---

## Layer Name

Each layer has a user-visible name.

The name can be modified from the Layers Panel without affecting the
layer ID or raster data.

This separates:

    User-visible identity
            !=
    Internal identity

---

## Layer ImageData

Each layer owns an independent `ImageData`.

The `ImageData` contains the raster pixels of that layer.

This means drawing on one layer does not directly modify another layer.

Conceptually:

    Layer A
      |
      +-- ImageData A

    Layer B
      |
      +-- ImageData B

    Layer C
      |
      +-- ImageData C

The final visible image is created later by composing these independent
raster sources.

---

# Active Layer

Only one layer is active at a time.

The active layer is identified through:

    document.activeLayerId

Editing operations use this value to determine which layer should be
modified.

For example:

    Brush
      |
      v
    Active Layer
      |
      v
    Active Layer ImageData

The same principle applies to:

- Eraser;
- filters;
- layer-specific editing operations.

Other layers remain unchanged.

---

# Creating Layers

New layers are created through the layer creation logic.

A new layer receives:

- a unique ID;
- a name;
- raster data matching the document dimensions;
- default visibility;
- default opacity.

The layer dimensions must match the raster document dimensions.

For a document of:

    800 x 600

each layer also owns raster data of:

    800 x 600

This allows layers to be composed directly without requiring independent
coordinate systems.

---

# Layer Visibility

Each layer contains:

    visible: boolean

A visible layer participates in the final composition.

A hidden layer remains in the document but is ignored during rendering.

Conceptually:

    Layer A - visible
          |
          +------+
                 |
    Layer B - hidden
                 |
          X      |
                 |
    Layer C - visible
          |      |
          +------+
                 |
                 v
         Final Composition

Hiding a layer therefore does not delete or modify its pixels.

Changing visibility is non-destructive.

---

# Layer Opacity

Each layer contains an opacity value.

Opacity controls how strongly the layer contributes to the final
composition.

Conceptually:

    100% opacity
        -> fully visible

    50% opacity
        -> partially transparent

    0% opacity
        -> fully transparent

The raster pixels stored inside `imageData` do not need to be permanently
modified when the user changes layer opacity.

Opacity is applied during composition.

This makes opacity changes non-destructive.

---

# Layer Order

Layers are stored in an ordered collection.

The order determines how they are composed.

Conceptually:

    Top layer
        |
        v
    Middle layer
        |
        v
    Bottom layer

Changing the order changes the final visible result without changing the
pixel data stored inside each layer.

The Layers Panel provides controls for moving layers through the stack.

---

# Layer Composition

The final visible document is generated by:

    compositeLayers()

The composition system receives:

- a destination rendering context;
- the layer collection;
- the document width;
- the document height.

Conceptually:

    Layer Stack
        |
        v
    Check visibility
        |
        v
    Apply mask when enabled
        |
        v
    Apply opacity
        |
        v
    Draw layer
        |
        v
    Next layer
        |
        v
    Final Composition

---

## Hidden Layers

Before rendering a layer, the composition system checks its visibility.

If:

    visible = false

the layer is skipped.

Its raster data remains stored in the document.

This same behavior is important during image export so the exported image
matches what the user sees in the editor.

---

## Opacity During Composition

Layer opacity is applied while rendering the layer into the final
composition.

The original `ImageData` remains unchanged.

This means repeatedly changing opacity does not progressively alter the
source pixels.

The operation remains reversible and non-destructive.

---

# Layer Masks

A layer can optionally contain a mask.

The mask is represented by:

    LayerMask

with:

    imageData
    enabled

Conceptually:

    Layer
      |
      +-- Original ImageData
      |
      +-- Mask
            |
            +-- Mask ImageData
            +-- Enabled state

The mask controls which parts of the associated layer remain visible
during composition.

---

# Non-Destructive Masking

Masks do not permanently erase the original layer pixels.

Instead, the mask modifies the layer result during rendering.

Conceptually:

    Original Layer Pixels
             +
          Mask Data
             |
             v
    Temporary Rendered Layer
             |
             v
       Final Composition

The original layer `ImageData` remains available.

This is why the masking system is considered non-destructive.

---

# Creating a Mask

A new layer mask is created through:

    createLayerMask()

The mask dimensions match the layer and document dimensions.

A newly created mask starts as a white mask.

Conceptually:

    White mask
        |
        v
    Entire layer visible

This means adding a mask does not immediately change the appearance of the
layer.

The user can then modify regions of the mask.

---

# Mask Values

The mask controls layer alpha.

Conceptually:

    White mask pixel
        -> layer remains visible

    Black mask pixel
        -> layer becomes transparent

Intermediate values can conceptually represent partial visibility.

The layer's original RGB pixel values remain unchanged.

---

# Applying a Selection to a Mask

EpiGimp can use the current rectangle selection to modify a mask.

The mask-selection operation is handled through:

    maskSelection.ts

The selected mask region is modified independently from the layer raster
data.

Conceptually:

    Rectangle Selection
            +
       Layer Mask
            |
            v
    Modify selected mask region
            |
            v
    Layer visibility changes

The underlying layer pixels remain unchanged.

---

# Enabling and Disabling Masks

A mask contains:

    enabled: boolean

When the mask is enabled:

    Layer
      +
    Mask
      |
      v
    Masked rendering

When the mask is disabled:

    Layer
      |
      v
    Normal rendering

The mask data is not deleted when it is disabled.

This allows the user to temporarily compare the layer with and without
the mask.

---

# Removing a Mask

Removing a mask deletes the mask association from the layer.

It does not remove the original layer pixels.

Conceptually:

    Before

    Layer
      |
      +-- ImageData
      +-- Mask


    After

    Layer
      |
      +-- ImageData

The layer therefore returns to its normal unmasked rendering.

---

# Mask Rendering

Masks are applied during layer composition.

The original layer `ImageData` must not be modified directly.

A temporary rendering copy is used instead.

Conceptually:

    Original Layer ImageData
             |
             v
       Temporary Copy
             |
             +
          Mask Data
             |
             v
    Modify temporary alpha
             |
             v
       Apply opacity
             |
             v
      Draw composition

This prevents rendering from destroying the source raster.

---

# Masks and Opacity

Layer masks and layer opacity are independent properties.

A layer can therefore have:

    Mask
      +
    Opacity
      |
      v
    Final layer contribution

The mask determines pixel-level visibility.

Opacity determines the transparency of the resulting layer as a whole.

Both are applied during composition without permanently modifying the
source layer pixels.

---

# Duplicating Layers

EpiGimp supports layer duplication.

A duplicated layer must become independent from its source layer.

It is not sufficient to copy only the JavaScript object reference.

For example, this would be incorrect:

    Duplicate Layer
          |
          +----> Same ImageData <---- Original Layer

Editing the duplicate could then accidentally modify the original.

Instead, the raster data is deep-copied.

The expected result is:

    Original Layer
          |
          +----> ImageData A


    Duplicate Layer
          |
          +----> ImageData B

where `ImageData A` and `ImageData B` initially contain the same pixel
values but are different objects in memory.

---

# Duplicating Masks

The same rule applies to masks.

If a layer contains a mask, its mask raster data must also be deep-copied.

Conceptually:

    Original Layer
       |
       +-- ImageData A
       |
       +-- Mask
             |
             +-- Mask ImageData A


    Duplicate Layer
       |
       +-- ImageData B
       |
       +-- Mask
             |
             +-- Mask ImageData B

The duplicated layer and mask can therefore be edited independently.

---

# Deleting Layers

Deleting a layer removes it from the document layer collection.

The editor must also maintain a valid active layer.

This means layer deletion is not only a visual operation in the Layers
Panel.

It modifies the raster document structure itself.

The document should never reference an `activeLayerId` that no longer
exists.

---

# Renaming Layers

Renaming changes only the user-visible layer name.

It does not modify:

- the layer ID;
- the layer pixels;
- the mask;
- visibility;
- opacity;
- layer order.

This keeps display information separate from raster information.

---

# Layers Panel

The Layers Panel provides the user interface for interacting with the
layer system.

It allows the user to:

- select a layer;
- add a layer;
- rename a layer;
- duplicate a layer;
- delete a layer;
- show or hide a layer;
- change opacity;
- move layers;
- add a mask;
- enable or disable a mask;
- remove a mask;
- apply the current selection to a mask.

The panel itself does not perform the final layer composition.

Rendering remains the responsibility of the layer rendering system.

---

# Layers and Drawing Tools

Drawing tools modify only the active layer.

The interaction is:

    Brush / Eraser
          |
          v
    Find activeLayerId
          |
          v
    Retrieve active layer
          |
          v
    Modify its ImageData
          |
          v
    Recompose all visible layers

This allows the user to edit one raster layer while still seeing the
complete document.

---

# Layers and Filters

Filters also operate on the active layer.

For example:

    Active Layer
         |
         v
    Grayscale Filter
         |
         v
    New Layer ImageData
         |
         v
    Recompose Document

Other layers are not modified.

Masks remain independent from the filtered raster data.

---

# Layers and Crop

Crop is a document-level operation.

Because all layers share the same document dimensions, cropping the
document must preserve alignment between:

- all layer ImageData;
- layer masks;
- the new document dimensions.

Conceptually:

    Original Document
      800 x 600

         |
         | Crop selection
         v

    Cropped Document
      400 x 300

         |
         +-- Layer A: 400 x 300
         +-- Layer B: 400 x 300
         +-- Layer C: 400 x 300
         +-- Masks:   400 x 300

This keeps every raster source aligned after the crop.

---

# Layers and Export

Image export uses the same layer-composition logic as the editor.

Conceptually:

    Document Layers
          |
          v
    compositeLayers()
          |
          v
    Final Composition
          |
          +-- PNG
          |
          +-- JPEG

This is important because the exported result should match the image
displayed in EpiGimp.

Therefore export respects:

- layer order;
- visibility;
- opacity;
- masks.

Hidden layers are not exported.

---

# PNG and Transparency

PNG export preserves transparency.

If the composed document contains transparent pixels, those pixels remain
transparent in the exported PNG.

This includes transparency produced by:

- erased pixels;
- transparent layers;
- masks;
- opacity.

---

# JPEG and Transparency

JPEG does not support transparency.

For JPEG export, EpiGimp first creates the normal transparent layer
composition.

That result is then drawn onto a white background before JPEG encoding.

Conceptually:

    Layers
       |
       v
    Transparent Composition
       |
       +
    White Background
       |
       v
    JPEG Composition

This avoids transparent pixels becoming black during JPEG encoding.

---

# Layers and History

Layer operations are integrated with the shared Undo/Redo system.

Operations that change the document structure or raster data must be
recoverable.

Examples include:

- adding a layer;
- deleting a layer;
- duplicating a layer;
- changing layer data;
- modifying masks;
- applying filters;
- cropping.

Because `ImageData` is mutable, history snapshots must preserve
independent raster data.

A history entry must not accidentally share mutable pixel arrays with the
current document.

---

# Deep Copy and Mutable Raster Data

`ImageData` contains mutable pixel information.

This makes deep copying important in several parts of the layer system.

Conceptually, this is unsafe:

    History State
         |
         +------> ImageData <------ Current State

because changing the current pixels could also affect the supposedly old
history state.

The intended structure is:

    History State
         |
         +------> ImageData A


    Current State
         |
         +------> ImageData B

The same principle applies to layer duplication and mask duplication.

---

# Layer Composition as Shared Infrastructure

`compositeLayers()` is an important shared part of EpiGimp.

It is reused whenever the application needs the visible document result.

Conceptually:

                       +--> Editor Canvas
                       |
    Document Layers --> compositeLayers()
                       |
                       +--> Image Export

Using the same composition rules prevents the editor and export systems
from producing different visual results.

---

# Separation of Responsibilities

The layer architecture separates responsibilities as follows:

    Layer types
        -> define layer and mask data

    createLayer
        -> create independent raster layers

    createLayerMask
        -> create mask raster data

    maskSelection
        -> modify masks using selections

    compositeLayers
        -> produce the visible document composition

    LayersPanel
        -> provide layer controls to the user

    CanvasWorkspace
        -> display the resulting composition

    Editor state / hooks
        -> manage document modifications and history

    Export system
        -> reuse composition for PNG/JPEG generation

This prevents the Layers Panel or Canvas component from owning the entire
layer implementation.

---

# Design Decisions

## Independent ImageData per Layer

Each layer owns its own raster data.

This allows editing operations to target one layer without modifying the
others.

## Active Layer by ID

The active layer is referenced using a unique ID instead of relying only
on its position in the layer stack.

This remains stable when layers are reordered.

## Non-Destructive Opacity

Opacity is applied during rendering instead of permanently modifying the
source pixels.

## Non-Destructive Masks

Masks affect the rendered alpha while preserving the original layer
ImageData.

## Shared Composition

The editor and export system reuse the same layer composition logic.

## Deep Copies

Duplicated layers, masks and history states must own independent mutable
raster data.

These decisions make the layer system easier to extend while protecting
the original raster information from unintended modifications.

---

# Current V1 Limitations

The V1 layer system implements the core requirements of EpiGimp but does
not currently provide:

- layer groups;
- blend modes;
- adjustment layers;
- vector layers;
- multiple masks per layer;
- mask feathering;
- mask thumbnails;
- layer locking;
- alpha locking;
- clipping masks;
- advanced layer effects.

These features can be added later while preserving the current separation
between layer data, composition and user interface.