/*
 ** EPITECH PROJECT, 2026
 ** EpiGimp
 ** File description:
 ** compositeLayers.ts
 */

import type { Layer } from './types'

function createLayerCanvas(layer: Layer): HTMLCanvasElement {
  const canvas = document.createElement('canvas')

  canvas.width = layer.imageData.width
  canvas.height = layer.imageData.height

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Unable to create layer context')
  }

  context.putImageData(layer.imageData, 0, 0)

  return canvas
}

export function compositeLayers(
  context: CanvasRenderingContext2D,
  layers: Layer[],
  width: number,
  height: number,
): void {
  context.clearRect(0, 0, width, height)

  layers.forEach((layer) => {
    if (!layer.visible) {
      return
    }

    const layerCanvas = createLayerCanvas(layer)

    context.save()
    context.globalAlpha = layer.opacity / 100
    context.drawImage(layerCanvas, 0, 0)
    context.restore()
  })
}
