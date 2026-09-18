/*
 ** EPITECH PROJECT, 2026
 ** EpiGimp
 ** File description:
 ** CanvasWorkspace.tsx
 */

import { useEffect, useRef } from 'react'
import type { RasterDocument } from '../../types/RasterDocument'
import './CanvasWorkspace.css'

interface CanvasWorkspaceProps {
  document: RasterDocument | null
  zoom: number
}

function CanvasWorkspace({ document, zoom }: CanvasWorkspaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!document || !canvasRef.current) {
      return
    }

    const context = canvasRef.current.getContext('2d')

    if (!context) {
      return
    }

    context.putImageData(document.imageData, 0, 0)
  }, [document])

  const zoomScale = zoom / 100

  return (
    <main className="canvas-workspace">
      {document ? (
        <div className="canvas-workspace__document">
          <canvas
            ref={canvasRef}
            className="canvas-workspace__canvas"
            width={document.width}
            height={document.height}
            style={{
              width: `${document.width * zoomScale}px`,
              height: `${document.height * zoomScale}px`,
            }}
          />
        </div>
      ) : (
        <p className="canvas-workspace__empty">No document open</p>
      )}
    </main>
  )
}

export default CanvasWorkspace
