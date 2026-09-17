/*
 ** EPITECH PROJECT, 2026
 ** EpiGimp
 ** File description:
 ** main.ts
 */

import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'

const loadRenderer = (window: BrowserWindow): void => {
  const devServerUrl = process.env.VITE_DEV_SERVER_URL

  if (devServerUrl) {
    window.loadURL(devServerUrl)
    return
  }

  window.loadFile(path.join(__dirname, '../dist/index.html'))
}

const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  loadRenderer(mainWindow)
}

ipcMain.handle('ping', () => {
  return 'pong'
})

app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
