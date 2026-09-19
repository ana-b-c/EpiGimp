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
import type { RectangleSelection } from '../tools/selection/types'
import { cropImageData } from '../tools/selection/cropImageData'

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

  const updateDocumentImageData = (imageData: ImageData): void => {
    setDocument((currentDocument) => {
      if (!currentDocument) {
        return null
      }

      return {
        ...currentDocument,
        imageData,
      }
    })
  }

  const cropDocument = (selection: RectangleSelection): void => {
    setDocument((currentDocument) => {
      if (!currentDocument) {
        return null
      }

      const croppedImageData = cropImageData(currentDocument.imageData, selection)

      return {
        ...currentDocument,
        width: croppedImageData.width,
        height: croppedImageData.height,
        imageData: croppedImageData,
      }
    })
  }

  const replaceDocument = (rasterDocument: RasterDocument): void => {
    setDocument(rasterDocument)
    setError(null)
  }

  return {
    document,
    error,
    createDocument,
    openDocument,
    updateDocumentImageData,
    cropDocument,
    replaceDocument,
  }
}
