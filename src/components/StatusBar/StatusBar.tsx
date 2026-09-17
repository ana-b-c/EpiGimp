/*
 ** EPITECH PROJECT, 2026
 ** EpiGimp
 ** File description:
 ** StatusBar.tsx
 */

import './StatusBar.css'

function StatusBar() {
  return (
    <footer className="status-bar">
      <span className="status-bar__item">Ready</span>

      <div className="status-bar__info">
        <span className="status-bar__item">100%</span>
        <span className="status-bar__item">No document</span>
      </div>
    </footer>
  )
}

export default StatusBar
