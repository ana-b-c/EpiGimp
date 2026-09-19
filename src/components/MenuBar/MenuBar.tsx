/*
 ** EPITECH PROJECT, 2026
 ** EpiGimp
 ** File description:
 ** MenuBar.tsx
 */

import { useState } from 'react'

import './MenuBar.css'

const MENU_ITEMS = ['Image', 'Filters', 'View'] as const

interface MenuBarProps {
  onNewDocument: () => void
  onOpenImage: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

function MenuBar({ onNewDocument, onOpenImage, onUndo, onRedo, canUndo, canRedo }: MenuBarProps) {
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false)
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false)

  const handleFileAction = (action: () => void): void => {
    setIsFileMenuOpen(false)
    action()
  }

  const handleEditAction = (action: () => void): void => {
    setIsEditMenuOpen(false)
    action()
  }

  const toggleFileMenu = (): void => {
    setIsFileMenuOpen((isOpen) => !isOpen)
    setIsEditMenuOpen(false)
  }

  const toggleEditMenu = (): void => {
    setIsEditMenuOpen((isOpen) => !isOpen)
    setIsFileMenuOpen(false)
  }

  return (
    <nav className="menu-bar" aria-label="Application menu">
      <div className="menu-bar__menu">
        <button
          className="menu-bar__item"
          type="button"
          onClick={toggleFileMenu}
          aria-expanded={isFileMenuOpen}
        >
          File
        </button>

        {isFileMenuOpen && (
          <div className="menu-bar__dropdown">
            <button type="button" onClick={() => handleFileAction(onNewDocument)}>
              New
            </button>

            <button type="button" onClick={() => handleFileAction(onOpenImage)}>
              Open
            </button>
          </div>
        )}
      </div>

      <div className="menu-bar__menu">
        <button
          className="menu-bar__item"
          type="button"
          onClick={toggleEditMenu}
          aria-expanded={isEditMenuOpen}
        >
          Edit
        </button>

        {isEditMenuOpen && (
          <div className="menu-bar__dropdown">
            <button type="button" disabled={!canUndo} onClick={() => handleEditAction(onUndo)}>
              Undo
            </button>

            <button type="button" disabled={!canRedo} onClick={() => handleEditAction(onRedo)}>
              Redo
            </button>
          </div>
        )}
      </div>

      {MENU_ITEMS.map((item) => (
        <button className="menu-bar__item" type="button" key={item}>
          {item}
        </button>
      ))}
    </nav>
  )
}

export default MenuBar
