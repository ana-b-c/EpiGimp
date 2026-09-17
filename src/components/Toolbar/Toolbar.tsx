/*
 ** EPITECH PROJECT, 2026
 ** EpiGimp
 ** File description:
 ** Toolbar.tsx
 */

import './Toolbar.css'

const TOOL_ITEMS = ['Select', 'Brush', 'Eraser', 'Fill', 'Text'] as const

type ToolName = (typeof TOOL_ITEMS)[number]

interface ToolbarProps {
  activeTool?: ToolName
}

function Toolbar({ activeTool = 'Select' }: ToolbarProps) {
  return (
    <aside className="toolbar" aria-label="Editing tools">
      {TOOL_ITEMS.map((tool) => {
        const isActive = tool === activeTool

        return (
          <button
            className={`toolbar__item${isActive ? ' toolbar__item--active' : ''}`}
            type="button"
            key={tool}
            title={tool}
            aria-pressed={isActive}
          >
            {tool}
          </button>
        )
      })}
    </aside>
  )
}

export default Toolbar
