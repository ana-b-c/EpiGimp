# Filters and Pixel Processing

## Purpose

The filter system provides reusable image-processing operations for raster
layers.

Filters modify the pixel data of the active layer while keeping the
processing logic independent from the React interface.

The V1 provides the following filters:

- Grayscale;
- Invert;
- Brightness increase;
- Brightness decrease;
- Contrast increase;
- Contrast decrease;
- Blur.

The filter architecture separates:

    User interface
          |
          v
    Filter action
          |
          v
    Pixel-processing algorithm
          |
          v
    New ImageData
          |
          v
    Active layer update

This makes image-processing algorithms reusable and keeps them independent
from menus and React components.

---

## Related Source Files

The filter implementation is located in:

    src/filters/

This directory contains the shared pixel-processing logic and the
individual filter implementations used by EpiGimp.

The filter system also interacts with:

    src/components/MenuBar/
    src/layers/
    src/types/RasterDocument.ts
    src/hooks/

The Menu Bar exposes filter actions to the user, while the document and
layer systems determine which raster data should be processed.

---

# Filter Architecture

Filters operate on `ImageData`.

They do not directly manipulate React components, the Layers Panel or the
visible editor Canvas.

The general workflow is:

    Active Layer
         |
         v
    Layer ImageData
         |
         v
    Selected Filter
         |
         v
    Pixel Processing
         |
         v
    New ImageData
         |
         v
    Update Active Layer
         |
         v
    Recompose Document

This separation means a filter algorithm only needs to understand raster
pixel data.

It does not need to know:

- which menu triggered it;
- which layer is selected in the UI;
- how the layer is displayed;
- how Undo/Redo is implemented;
- how the document is exported.

---

# ImageData

Filters work with the browser `ImageData` structure.

An `ImageData` object contains:

    width
    height
    data

The `data` property contains the pixel values.

Pixels are stored using four consecutive values:

    R G B A

where:

    R = Red
    G = Green
    B = Blue
    A = Alpha

Each channel uses a value between:

    0 and 255

For example:

    Red pixel:

    R = 255
    G = 0
    B = 0
    A = 255

A fully transparent pixel has:

    A = 0

---

# Pixel Representation

The raster buffer can be represented conceptually as:

    Pixel 1        Pixel 2        Pixel 3
    R G B A        R G B A        R G B A
    | | | |        | | | |        | | | |
    0 1 2 3        4 5 6 7        8 9 10 11

The filter engine processes these values to create the resulting raster
image.

Most color filters modify:

    R
    G
    B

while preserving:

    A

Preserving alpha is important because EpiGimp supports transparent
layers, erased pixels and masks.

---

# Shared Pixel-Processing Logic

Filters that operate independently on each pixel can share common
processing infrastructure.

Instead of every filter manually recreating the complete `ImageData`
iteration logic, the common processing system handles the raster
traversal.

Conceptually:

    ImageData
        |
        v
    Iterate over pixels
        |
        v
    Apply pixel transformation
        |
        v
    Store transformed pixel
        |
        v
    New ImageData

The individual filter only needs to define the transformation that should
be applied.

This avoids duplicating the same pixel-loop logic across multiple filter
implementations.

---

# Source Image Preservation

Filter processing creates a new raster result instead of intentionally
using the source `ImageData` as the final result.

Conceptually:

    Source ImageData
           |
           v
       Filter
           |
           v
    Result ImageData

This separation is useful because the previous raster state may still be
needed by:

- Undo;
- history snapshots;
- other layers;
- previews or future processing operations.

Avoiding unnecessary shared mutable raster data reduces the risk of
accidentally changing a previous document state.

---

# Active Layer Processing

Filters are applied only to the active layer.

The target layer is identified through:

    document.activeLayerId

The workflow is:

    RasterDocument
          |
          v
    activeLayerId
          |
          v
    Active Layer
          |
          v
    Filter ImageData
          |
          v
    Replace active layer raster data

Other layers remain unchanged.

For example:

    Layer 3
    Layer 2  <- active layer <- Grayscale
    Layer 1

After applying the filter:

    Layer 3  -> unchanged
    Layer 2  -> grayscale
    Layer 1  -> unchanged

This is consistent with the layer-based editing model used throughout
EpiGimp.

---

# Grayscale

## Purpose

The Grayscale filter converts the active layer colors into shades of
gray.

The transformation operates on the RGB channels of each pixel.

Conceptually:

    Original pixel

    R
    G
    B

        |
        v

    Calculate grayscale value

        |
        v

    Result

    R = gray
    G = gray
    B = gray

The alpha channel is preserved.

Therefore:

    Original alpha = Result alpha

This means applying Grayscale does not remove existing transparency.

---

# Invert

## Purpose

The Invert filter reverses the RGB color values of every pixel.

For a channel value `C`, the inverse can be represented as:

    inverted value = 255 - C

Therefore:

    R -> 255 - R
    G -> 255 - G
    B -> 255 - B

The alpha channel remains unchanged.

Examples:

    Black

    0, 0, 0

        becomes

    255, 255, 255

and:

    White

    255, 255, 255

        becomes

    0, 0, 0

The filter therefore changes colors without changing pixel transparency.

---

# Brightness

## Purpose

The Brightness filter makes the active layer lighter or darker.

Brightness processing modifies the RGB channels while preserving alpha.

Conceptually:

    Original RGB
         |
         +
    Brightness adjustment
         |
         v
    Result RGB

EpiGimp exposes brightness adjustment in both directions:

    Brightness +
    Brightness -

---

## Increasing Brightness

Increasing brightness raises the RGB channel values.

Conceptually:

    R -> R + adjustment
    G -> G + adjustment
    B -> B + adjustment

Values must remain inside the valid channel range:

    0 to 255

A channel cannot become greater than `255`.

---

## Decreasing Brightness

Decreasing brightness lowers the RGB channel values.

Conceptually:

    R -> R - adjustment
    G -> G - adjustment
    B -> B - adjustment

Values must also remain inside:

    0 to 255

A channel cannot become negative.

---

## Channel Clamping

Pixel-processing operations must respect the valid color range.

Conceptually:

    value < 0
        -> 0

    0 <= value <= 255
        -> value

    value > 255
        -> 255

This prevents invalid raster channel values from being produced by
brightness calculations.

---

# Contrast

## Purpose

The Contrast filter changes the difference between darker and lighter
colors.

Increasing contrast makes differences more pronounced.

Decreasing contrast makes pixel values move closer together.

EpiGimp provides:

    Contrast +
    Contrast -

Like the other color filters, contrast processing modifies RGB while
preserving alpha.

---

## Contrast Processing

Contrast is applied independently to the color channels.

Conceptually:

    Original channel
          |
          v
    Contrast transformation
          |
          v
    Adjusted channel
          |
          v
    Clamp to 0 - 255

The resulting RGB values are written to the filtered `ImageData`.

The alpha channel is copied without applying the contrast transformation.

---

# Blur

## Purpose

The Blur filter reduces local image detail by mixing information from
neighboring pixels.

Unlike Grayscale, Invert, Brightness and Contrast, Blur cannot be
calculated using only the current pixel.

It needs information from pixels around it.

Conceptually:

    Neighbor   Neighbor   Neighbor

    Neighbor   Current    Neighbor

    Neighbor   Neighbor   Neighbor

                 |
                 v

             Blur result

---

## Blur Radius

The V1 blur uses a radius of:

    3

The radius determines the surrounding area considered during the blur
operation.

A larger radius would require processing a larger neighborhood and would
produce a stronger blur.

---

## Why Blur Is Different

Most basic filters can process pixels independently:

    Pixel
      |
      v
    Transform
      |
      v
    Result Pixel

Blur instead depends on neighboring pixels:

    Pixel Neighborhood
           |
           v
       Calculation
           |
           v
       Result Pixel

For this reason, Blur requires a different processing strategy from
simple per-pixel color transformations.

---

# Alpha Preservation

Preserving alpha is an important requirement of the filter system.

Consider a layer containing:

    Visible pixels
    +
    Transparent pixels

After applying Grayscale, Invert, Brightness or Contrast, transparent
areas should remain transparent.

The expected behavior is:

    RGB
      -> processed

    Alpha
      -> preserved

This allows filters to work correctly with:

- transparent PNG images;
- erased regions;
- partially transparent pixels;
- layer masks;
- layer opacity.

---

# Filters and Layer Masks

Filters modify the active layer's raster data.

Layer masks remain independent.

Conceptually:

    Layer
      |
      +-- ImageData <- Filter modifies this
      |
      +-- Mask      <- Remains independent

After the filter is applied, normal layer composition still applies the
mask to the filtered layer.

The workflow becomes:

    Filtered Layer ImageData
             +
          Layer Mask
             |
             v
       Masked Layer
             |
             +
          Opacity
             |
             v
    Final Composition

This preserves the non-destructive behavior of masks.

---

# Filters and Layer Opacity

Layer opacity is not permanently included in the filtered pixel data.

A filter processes the layer raster itself.

Opacity remains a separate rendering property.

Conceptually:

    Layer ImageData
          |
          v
        Filter
          |
          v
    Filtered ImageData
          |
          +
       Layer Opacity
          |
          v
    Final Composition

This means applying a filter does not destroy or bake the current opacity
setting into the raster pixels.

---

# Filters and Hidden Layers

The filter system targets the active layer rather than the final visible
composition.

A filter is therefore fundamentally a layer editing operation.

It does not flatten the complete document before applying the effect.

This preserves the multi-layer document structure.

---

# Filters and Undo/Redo

Filters are destructive operations on the active layer raster data.

Unlike layer opacity or mask enable/disable state, applying a filter
changes the actual `ImageData` of the layer.

For this reason, the previous document state must be stored before the
filter is applied.

Conceptually:

    Original Document
          |
          v
    Save History State
          |
          v
    Apply Filter
          |
          v
    Updated Document

Undo can then restore the previous raster data.

Redo can restore the filtered state.

---

# Filters and Document Dimensions

Filters preserve the raster dimensions of the active layer.

If the layer is:

    800 x 600

the filtered result is also:

    800 x 600

Filters modify pixel values but do not resize the document.

This differs from operations such as Crop, which can change the document
dimensions.

---

# Filters and Export

Filters modify the active layer before the document is exported.

Export therefore does not need special knowledge about filters.

The workflow is:

    Active Layer
         |
         v
    Apply Filter
         |
         v
    Updated Layer
         |
         v
    Layer Composition
         |
         v
    PNG / JPEG Export

The export system simply receives the current layer stack and composes
the filtered raster like any other layer.

This is another consequence of separating raster processing from export.

---

# User Interface Integration

Filters are accessible from the `Filters` menu.

The menu triggers the requested filter action but does not contain the
pixel-processing implementation.

Conceptually:

    Filters Menu
         |
         v
    User selects filter
         |
         v
    Editor filter action
         |
         v
    Filter implementation
         |
         v
    Active Layer updated

This keeps React UI components focused on user interaction rather than
image-processing algorithms.

---

# Filter Availability

A filter requires an opened raster document and a layer that can be
processed.

When no document is available, filter actions should not attempt to
process raster data.

The UI can therefore disable unavailable filter actions.

This avoids requiring the low-level pixel algorithms to handle unrelated
editor-state conditions.

---

# Reusable Processing Design

One of the main design goals of the filter system is avoiding duplicated
raster-processing code.

Without shared processing logic, each simple filter could contain its own
complete pixel loop:

    Grayscale
        -> iterate pixels

    Invert
        -> iterate pixels

    Brightness
        -> iterate pixels

    Contrast
        -> iterate pixels

Instead, common processing can be centralized:

                     +--> Grayscale transformation
                     |
    Pixel processor -+--> Invert transformation
                     |
                     +--> Brightness transformation
                     |
                     +--> Contrast transformation

This keeps individual filters smaller and gives each function a clearer
responsibility.

---

# Separation of Responsibilities

The filter architecture separates responsibilities as follows:

    MenuBar
        -> exposes filter actions to the user

    Editor state
        -> identifies the active layer

    Filter functions
        -> define image-processing behavior

    Shared pixel processor
        -> handles reusable raster iteration

    Layer system
        -> stores the resulting ImageData

    History system
        -> preserves previous document states

    compositeLayers
        -> renders the filtered layer with other layers

    Export system
        -> exports the resulting composition

The image-processing algorithms therefore remain independent from the
editor interface.

---

# Adding a New Pixel Filter

A new simple pixel filter should follow the existing architecture.

Conceptually:

    1. Create the filter transformation.
    2. Reuse the shared pixel-processing infrastructure when possible.
    3. Preserve alpha unless the effect intentionally modifies it.
    4. Return new raster data.
    5. Connect the filter to the active-layer editing action.
    6. Add the action to the Filters menu.
    7. Ensure the operation integrates with Undo/Redo.

For example, future filters could include:

    Sepia
    Threshold
    Saturation
    Color balance

These effects can follow the same basic architecture if they operate
independently on each pixel.

Filters that depend on neighboring pixels may require specialized
algorithms similar to Blur.

---

# Design Decisions

## Filters Operate on ImageData

Filters work directly with raster data rather than UI components.

This keeps image processing reusable.

## Active Layer Only

Filters modify the active layer rather than flattening the complete
document.

This preserves the multi-layer editing model.

## Alpha Preservation

Basic color filters preserve transparency.

This allows them to work correctly with PNG images and erased areas.

## Shared Pixel Processing

Common raster iteration is centralized where possible.

This avoids duplicating the same loops across filters.

## Independent Masks and Opacity

Masks and opacity remain rendering properties and are not permanently
baked into filtered pixels.

## History Before Destructive Processing

The document state is stored before applying a destructive raster filter.

This makes filter operations compatible with Undo/Redo.

---

# Current V1 Limitations

The V1 filter system provides the basic image-processing functionality
required by EpiGimp.

It does not currently provide:

- real-time filter previews;
- configurable filter dialogs;
- advanced blur settings;
- saturation adjustment;
- hue adjustment;
- color balance;
- levels;
- curves;
- sharpening;
- edge detection;
- filter stacking;
- non-destructive adjustment layers;
- GPU-accelerated processing.

These capabilities can be added later while keeping the current
separation between pixel-processing algorithms, layer state and the user
interface.