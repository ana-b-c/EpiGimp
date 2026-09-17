/*
 ** EPITECH PROJECT, 2026
 ** EpiGimp
 ** File description:
 ** EditorLayout.tsx
 */

import CanvasWorkspace from '../../canvas/CanvasWorkspace/CanvasWorkspace'
import LayersPanel from '../LayersPanel/LayersPanel'
import MenuBar from '../MenuBar/MenuBar'
import StatusBar from '../StatusBar/StatusBar'
import Toolbar from '../Toolbar/Toolbar'
import ToolOptions from '../ToolOptions/ToolOptions'
import './EditorLayout.css'

function EditorLayout() {
  return (
    <div className="editor-layout">
      <MenuBar />

      <ToolOptions />

      <div className="editor-layout__workspace">
        <Toolbar />
        <CanvasWorkspace />
        <LayersPanel />
      </div>

      <StatusBar />
    </div>
  )
}

export default EditorLayout
