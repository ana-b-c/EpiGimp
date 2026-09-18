/*
 ** EPITECH PROJECT, 2026
 ** EpiGimp
 ** File description:
 ** MenuBar.tsx
 */

import { useState } from 'react'
import './MenuBar.css'

const MENU_ITEMS = ['Edit', 'Image', 'Filters', 'View'] as const

interface MenuBarProps {
  onNewDocument: () => void
  onOpenImage: () => void
}

function MenuBar({ onNewDocument, onOpenImage }: MenuBarProps) {
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false)

  const handleFileAction = (action: () => void): void => {
    setIsFileMenuOpen(false)
    action()
  }

  return (
    <nav className="menu-bar" aria-label="Application menu">
      <div className="menu-bar__menu">
        <button
          className="menu-bar__item"
          type="button"
          onClick={() => setIsFileMenuOpen((isOpen) => !isOpen)}
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

      {MENU_ITEMS.map((item) => (
        <button className="menu-bar__item" type="button" key={item}>
          {item}
        </button>
      ))}
    </nav>
  )
}

export default MenuBar
