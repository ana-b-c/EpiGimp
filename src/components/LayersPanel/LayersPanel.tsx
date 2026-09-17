/*
 ** EPITECH PROJECT, 2026
 ** EpiGimp
 ** File description:
 ** LayersPanel.tsx
 */

import './LayersPanel.css'

function LayersPanel() {
  return (
    <aside className="layers-panel">
      <header className="layers-panel__header">
        <h2 className="layers-panel__title">Layers</h2>
      </header>

      <div className="layers-panel__content">
        <p>No layers yet.</p>
      </div>
    </aside>
  )
}

export default LayersPanel
