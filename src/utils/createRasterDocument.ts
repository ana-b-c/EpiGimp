/*
 ** EPITECH PROJECT, 2026
 ** EpiGimp
 ** File description:
 ** createRasterDocument.ts
 */

import type { RasterDocument } from '../types/RasterDocument'
import { areValidDocumentDimensions } from './documentDimensions'

export function createRasterDocument(
  width: number,
  height: number,
  name = 'Untitled',
): RasterDocument {
  if (!areValidDocumentDimensions(width, height)) {
    throw new Error('Invalid document dimensions')
  }

  return {
    id: crypto.randomUUID(),
    name,
    width,
    height,
    imageData: new ImageData(width, height),
  }
}
