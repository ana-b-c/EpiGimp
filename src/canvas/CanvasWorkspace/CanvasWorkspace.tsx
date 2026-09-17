/*
 ** EPITECH PROJECT, 2026
 ** EpiGimp
 ** File description:
 ** CanvasWorkspace.tsx
 */

import './CanvasWorkspace.css'

const DOCUMENT_WIDTH = 800
const DOCUMENT_HEIGHT = 600

function CanvasWorkspace() {
  return (
    <main className="canvas-workspace">
      <div className="canvas-workspace__document">
        <canvas
          className="canvas-workspace__canvas"
          width={DOCUMENT_WIDTH}
          height={DOCUMENT_HEIGHT}
        />
      </div>
    </main>
  )
}

export default CanvasWorkspace
