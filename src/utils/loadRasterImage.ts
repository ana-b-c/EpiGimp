/*
 ** EPITECH PROJECT, 2026
 ** EpiGimp
 ** File description:
 ** loadRasterImage.ts
 */

import type { RasterDocument } from '../types/RasterDocument'

export async function loadRasterImage(name: string, data: number[]): Promise<RasterDocument> {
  const bytes = new Uint8Array(data)
  const blob = new Blob([bytes])
  const bitmap = await createImageBitmap(blob)

  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height

    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Unable to create image context')
    }

    context.drawImage(bitmap, 0, 0)

    return {
      id: crypto.randomUUID(),
      name,
      width: bitmap.width,
      height: bitmap.height,
      imageData: context.getImageData(0, 0, bitmap.width, bitmap.height),
    }
  } finally {
    bitmap.close()
  }
}
