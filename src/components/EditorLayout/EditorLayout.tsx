/*
 ** EPITECH PROJECT, 2026
 ** EpiGimp
 ** File description:
 ** EditorLayout.tsx
 */

import { useState } from 'react'

import CanvasWorkspace from '../../canvas/CanvasWorkspace/CanvasWorkspace'
import { useBrushOptions } from '../../hooks/useBrushOptions'
import { useEraserOptions } from '../../hooks/useEraserOptions'
import { useHistory } from '../../hooks/useHistory'
import { useRasterDocument } from '../../hooks/useRasterDocument'
import { useSelection } from '../../hooks/useSelection'
import { useToolManager } from '../../hooks/useToolManager'
import { useZoom } from '../../hooks/useZoom'
import LayersPanel from '../LayersPanel/LayersPanel'
import MenuBar from '../MenuBar/MenuBar'
import NewDocumentDialog from '../NewDocumentDialog/NewDocumentDialog'
import StatusBar from '../StatusBar/StatusBar'
import Toolbar from '../Toolbar/Toolbar'
import ToolOptions from '../ToolOptions/ToolOptions'

import './EditorLayout.css'

function EditorLayout() {
  const [isNewDocumentOpen, setIsNewDocumentOpen] = useState(false)

  const {
    document,
    error,
    createDocument,
    openDocument,
    updateDocumentImageData,
    cropDocument,
    addLayer,
    deleteLayer,
    selectLayer,
    renameLayer,
    duplicateLayer,
    toggleLayerVisibility,
    setLayerOpacity,
    moveLayerUp,
    moveLayerDown,
    replaceDocument,
  } = useRasterDocument()

  const { zoom, zoomIn, zoomOut } = useZoom()

  const { activeTool, selectTool } = useToolManager()

  const { brushOptions, setBrushSize, setBrushColor } = useBrushOptions()

  const { eraserOptions, setEraserSize } = useEraserOptions()

  const { selection, setSelection, clearSelection } = useSelection()

  const { pushHistory, undo, redo, clearHistory, canUndo, canRedo } = useHistory()

  const handleCreateDocument = (width: number, height: number): void => {
    createDocument(width, height)
    clearSelection()
    clearHistory()
    setIsNewDocumentOpen(false)
  }

  const handleEditStart = (): void => {
    if (!document) {
      return
    }

    pushHistory(document)
  }

  const handleCrop = (): void => {
    if (!document || !selection) {
      return
    }

    pushHistory(document)
    cropDocument(selection)
    clearSelection()
  }

  const handleAddLayer = (): void => {
    if (!document) {
      return
    }

    pushHistory(document)
    addLayer()
  }

  const handleDeleteLayer = (layerId: string): void => {
    if (!document || document.layers.length <= 1) {
      return
    }

    pushHistory(document)
    deleteLayer(layerId)
  }

  const handleRenameLayer = (layerId: string, name: string): void => {
    const layer = document?.layers.find((currentLayer) => currentLayer.id === layerId)

    const trimmedName = name.trim()

    if (!document || !layer || !trimmedName || layer.name === trimmedName) {
      return
    }

    pushHistory(document)
    renameLayer(layerId, trimmedName)
  }

  const handleDuplicateLayer = (layerId: string): void => {
    if (!document) {
      return
    }

    pushHistory(document)
    duplicateLayer(layerId)
  }

  const handleToggleLayerVisibility = (layerId: string): void => {
    if (!document) {
      return
    }

    pushHistory(document)
    toggleLayerVisibility(layerId)
  }

  const handleLayerOpacityEditStart = (): void => {
    if (!document) {
      return
    }

    pushHistory(document)
  }

  const handleLayerOpacityChange = (layerId: string, opacity: number): void => {
    setLayerOpacity(layerId, opacity)
  }

  const handleMoveLayerUp = (layerId: string): void => {
    if (!document) {
      return
    }

    const layerIndex = document.layers.findIndex((layer) => layer.id === layerId)

    if (layerIndex === -1 || layerIndex === document.layers.length - 1) {
      return
    }

    pushHistory(document)
    moveLayerUp(layerId)
  }

  const handleMoveLayerDown = (layerId: string): void => {
    if (!document) {
      return
    }

    const layerIndex = document.layers.findIndex((layer) => layer.id === layerId)

    if (layerIndex <= 0) {
      return
    }

    pushHistory(document)
    moveLayerDown(layerId)
  }

  const handleUndo = (): void => {
    if (!document) {
      return
    }

    const previousDocument = undo(document)

    if (!previousDocument) {
      return
    }

    replaceDocument(previousDocument)
    clearSelection()
  }

  const handleRedo = (): void => {
    if (!document) {
      return
    }

    const nextDocument = redo(document)

    if (!nextDocument) {
      return
    }

    replaceDocument(nextDocument)
    clearSelection()
  }

  return (
    <div className="editor-layout">
      <MenuBar
        onNewDocument={() => setIsNewDocumentOpen(true)}
        onOpenImage={openDocument}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <ToolOptions
        activeTool={activeTool}
        brushOptions={brushOptions}
        eraserOptions={eraserOptions}
        onBrushSizeChange={setBrushSize}
        onBrushColorChange={setBrushColor}
        onEraserSizeChange={setEraserSize}
        hasSelection={selection !== null && selection.width > 0 && selection.height > 0}
        onCrop={handleCrop}
      />

      {error && <p className="editor-layout__error">{error}</p>}

      <div className="editor-layout__workspace">
        <Toolbar activeTool={activeTool} onToolSelect={selectTool} />

        <CanvasWorkspace
          document={document}
          zoom={zoom}
          activeTool={activeTool}
          brushOptions={brushOptions}
          eraserOptions={eraserOptions}
          selection={selection}
          onImageDataChange={updateDocumentImageData}
          onForegroundColorChange={setBrushColor}
          onSelectionChange={setSelection}
          onEditStart={handleEditStart}
        />

        <LayersPanel
          layers={document?.layers ?? []}
          activeLayerId={document?.activeLayerId ?? null}
          onAddLayer={handleAddLayer}
          onDeleteLayer={handleDeleteLayer}
          onSelectLayer={selectLayer}
          onRenameLayer={handleRenameLayer}
          onDuplicateLayer={handleDuplicateLayer}
          onToggleVisibility={handleToggleLayerVisibility}
          onOpacityChange={handleLayerOpacityChange}
          onOpacityEditStart={handleLayerOpacityEditStart}
          onMoveLayerUp={handleMoveLayerUp}
          onMoveLayerDown={handleMoveLayerDown}
        />
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
        onCreate={handleCreateDocument}
      />
    </div>
  )
}

export default EditorLayout
