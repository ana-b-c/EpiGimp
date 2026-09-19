/*
 ** EPITECH PROJECT, 2026
 ** EpiGimp
 ** File description:
 ** CanvasWorkspace.tsx
 */

import { useEffect, useRef } from 'react'

import type { BrushOptions } from '../../tools/brush/types'
import { pickCanvasColor } from '../../tools/colorPicker/pickCanvasColor'
import { drawStroke } from '../../tools/drawStroke'
import type { EraserOptions } from '../../tools/eraser/types'
import type { RectangleSelection } from '../../tools/selection/types'
import type { ToolId } from '../../tools/types'
import type { RasterDocument } from '../../types/RasterDocument'
import { getCanvasCoordinates } from '../getCanvasCoordinates'

import './CanvasWorkspace.css'

interface CanvasWorkspaceProps {
  document: RasterDocument | null
  zoom: number
  activeTool: ToolId
  brushOptions: BrushOptions
  eraserOptions: EraserOptions
  selection: RectangleSelection | null
  onImageDataChange: (imageData: ImageData) => void
  onForegroundColorChange: (color: string) => void
  onSelectionChange: (selection: RectangleSelection | null) => void
  onEditStart: () => void
}

function CanvasWorkspace({
  document,
  zoom,
  activeTool,
  brushOptions,
  eraserOptions,
  selection,
  onImageDataChange,
  onForegroundColorChange,
  onSelectionChange,
  onEditStart,
}: CanvasWorkspaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)

  const isSelectingRef = useRef(false)
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null)

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

  const drawActiveStroke = (
    context: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
  ): void => {
    drawStroke(context, {
      from,
      to,
      size: activeTool === 'brush' ? brushOptions.size : eraserOptions.size,
      color: brushOptions.color,
      erase: activeTool === 'eraser',
    })
  }

  const createSelection = (
    start: { x: number; y: number },
    end: { x: number; y: number },
  ): RectangleSelection => {
    const x = Math.min(start.x, end.x)
    const y = Math.min(start.y, end.y)

    return {
      x,
      y,
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    }
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    const canvas = event.currentTarget
    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    const point = getCanvasCoordinates(event, canvas)

    if (activeTool === 'color-picker') {
      const color = pickCanvasColor(context, point)

      if (color) {
        onForegroundColorChange(color)
      }

      return
    }

    if (activeTool === 'rectangle-select') {
      canvas.setPointerCapture(event.pointerId)

      isSelectingRef.current = true
      selectionStartRef.current = point

      onSelectionChange({
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
      })

      return
    }

    if (activeTool !== 'brush' && activeTool !== 'eraser') {
      return
    }

    onEditStart()

    canvas.setPointerCapture(event.pointerId)

    isDrawingRef.current = true
    lastPointRef.current = point

    drawActiveStroke(context, point, point)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    const canvas = event.currentTarget

    if (activeTool === 'rectangle-select' && isSelectingRef.current && selectionStartRef.current) {
      const point = getCanvasCoordinates(event, canvas)

      onSelectionChange(createSelection(selectionStartRef.current, point))

      return
    }

    if (
      (activeTool !== 'brush' && activeTool !== 'eraser') ||
      !isDrawingRef.current ||
      !lastPointRef.current
    ) {
      return
    }

    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    const point = getCanvasCoordinates(event, canvas)
    const previousPoint = lastPointRef.current

    drawActiveStroke(context, previousPoint, point)

    lastPointRef.current = point
  }

  const handlePointerEnd = (event: React.PointerEvent<HTMLCanvasElement>): void => {
    if (isSelectingRef.current) {
      isSelectingRef.current = false
      selectionStartRef.current = null
      return
    }

    if (!isDrawingRef.current) {
      return
    }

    const canvas = event.currentTarget
    const context = canvas.getContext('2d')

    isDrawingRef.current = false
    lastPointRef.current = null

    if (!context) {
      return
    }

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

    onImageDataChange(imageData)
  }

  const zoomScale = zoom / 100

  return (
    <main className="canvas-workspace">
      {document ? (
        <div
          className="canvas-workspace__document"
          style={{
            width: `${document.width * zoomScale}px`,
            height: `${document.height * zoomScale}px`,
          }}
        >
          <canvas
            ref={canvasRef}
            className={`canvas-workspace__canvas canvas-workspace__canvas--${activeTool}`}
            width={document.width}
            height={document.height}
            style={{
              width: `${document.width * zoomScale}px`,
              height: `${document.height * zoomScale}px`,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
          />

          {selection && selection.width > 0 && selection.height > 0 && (
            <div
              className="canvas-workspace__selection"
              style={{
                left: `${selection.x * zoomScale}px`,
                top: `${selection.y * zoomScale}px`,
                width: `${selection.width * zoomScale}px`,
                height: `${selection.height * zoomScale}px`,
              }}
            />
          )}
        </div>
      ) : (
        <p className="canvas-workspace__empty">No document open</p>
      )}
    </main>
  )
}

export default CanvasWorkspace
