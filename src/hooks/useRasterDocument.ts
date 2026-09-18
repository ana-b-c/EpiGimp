/*
 ** EPITECH PROJECT, 2026
 ** EpiGimp
 ** File description:
 ** useRasterDocument.ts
 */

import { useState } from 'react'
import type { RasterDocument } from '../types/RasterDocument'
import { createRasterDocument } from '../utils/createRasterDocument'
import { loadRasterImage } from '../utils/loadRasterImage'

export function useRasterDocument() {
  const [document, setDocument] = useState<RasterDocument | null>(null)
  const [error, setError] = useState<string | null>(null)

  const createDocument = (width: number, height: number): void => {
    setDocument(createRasterDocument(width, height))
    setError(null)
  }

  const openDocument = async (): Promise<void> => {
    try {
      const filePath = await window.electronAPI.openImage()

      if (!filePath) {
        return
      }

      const file = await window.electronAPI.readImage(filePath)
      const rasterDocument = await loadRasterImage(file.name, file.data)

      setDocument(rasterDocument)
      setError(null)
    } catch {
      setError('Unable to open this image.')
    }
  }

  return {
    document,
    error,
    createDocument,
    openDocument,
  }
}
