/*
 ** EPITECH PROJECT, 2026
 ** EpiGimp
 ** File description:
 ** EditorLayout.tsx
 */

import { useState } from 'react'
import CanvasWorkspace from '../../canvas/CanvasWorkspace/CanvasWorkspace'
import { useRasterDocument } from '../../hooks/useRasterDocument'
import LayersPanel from '../LayersPanel/LayersPanel'
import MenuBar from '../MenuBar/MenuBar'
import NewDocumentDialog from '../NewDocumentDialog/NewDocumentDialog'
import StatusBar from '../StatusBar/StatusBar'
import Toolbar from '../Toolbar/Toolbar'
import ToolOptions from '../ToolOptions/ToolOptions'
import './EditorLayout.css'
import { useZoom } from '../../hooks/useZoom'

function EditorLayout() {
  const [isNewDocumentOpen, setIsNewDocumentOpen] = useState(false)
  const { document, error, createDocument, openDocument } = useRasterDocument()
  const { zoom, zoomIn, zoomOut } = useZoom()

  return (
    <div className="editor-layout">
      <MenuBar onNewDocument={() => setIsNewDocumentOpen(true)} onOpenImage={openDocument} />

      <ToolOptions />

      {error && <p className="editor-layout__error">{error}</p>}

      <div className="editor-layout__workspace">
        <Toolbar />
        <CanvasWorkspace document={document} zoom={zoom} />
        <LayersPanel />
      </div>

      <StatusBar
        zoom={zoom}
        documentSize={document ? `${document.width} × ${document.height} px` : 'No document'}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
      />

      <NewDocumentDialog
        isOpen={isNewDocumentOpen}
        onClose={() => setIsNewDocumentOpen(false)}
        onCreate={createDocument}
      />
    </div>
  )
}

export default EditorLayout
