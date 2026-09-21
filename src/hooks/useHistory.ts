/*
 ** EPITECH PROJECT, 2026
 ** EpiGimp
 ** File description:
 ** useHistory.ts
 */

import { useState } from 'react'

import type { Layer } from '../layers/types'
import type { RasterDocument } from '../types/RasterDocument'

interface HistoryState {
  past: RasterDocument[]
  future: RasterDocument[]
}

function cloneLayer(layer: Layer): Layer {
  return {
    ...layer,
    imageData: new ImageData(
      new Uint8ClampedArray(layer.imageData.data),
      layer.imageData.width,
      layer.imageData.height,
    ),
  }
}

function cloneDocument(document: RasterDocument): RasterDocument {
  return {
    ...document,
    layers: document.layers.map(cloneLayer),
  }
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    future: [],
  })

  const pushHistory = (document: RasterDocument): void => {
    const snapshot = cloneDocument(document)

    setHistory((currentHistory) => ({
      past: [...currentHistory.past, snapshot],
      future: [],
    }))
  }

  const undo = (currentDocument: RasterDocument): RasterDocument | null => {
    if (history.past.length === 0) {
      return null
    }

    const previousDocument = history.past[history.past.length - 1]
    const currentSnapshot = cloneDocument(currentDocument)

    setHistory((currentHistory) => ({
      past: currentHistory.past.slice(0, -1),
      future: [currentSnapshot, ...currentHistory.future],
    }))

    return cloneDocument(previousDocument)
  }

  const redo = (currentDocument: RasterDocument): RasterDocument | null => {
    if (history.future.length === 0) {
      return null
    }

    const nextDocument = history.future[0]
    const currentSnapshot = cloneDocument(currentDocument)

    setHistory((currentHistory) => ({
      past: [...currentHistory.past, currentSnapshot],
      future: currentHistory.future.slice(1),
    }))

    return cloneDocument(nextDocument)
  }

  const clearHistory = (): void => {
    setHistory({
      past: [],
      future: [],
    })
  }

  return {
    pushHistory,
    undo,
    redo,
    clearHistory,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  }
}
