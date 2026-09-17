/*
 ** EPITECH PROJECT, 2026
 ** EpiGimp
 ** File description:
 ** MenuBar.tsx
 */

import './MenuBar.css'

const MENU_ITEMS = ['File', 'Edit', 'Image', 'Filters', 'View'] as const

function MenuBar() {
  return (
    <nav className="menu-bar" aria-label="Application menu">
      {MENU_ITEMS.map((item) => (
        <button className="menu-bar__item" type="button" key={item}>
          {item}
        </button>
      ))}
    </nav>
  )
}

export default MenuBar
