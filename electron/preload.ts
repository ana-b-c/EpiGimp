/*
 ** EPITECH PROJECT, 2026
 ** EpiGimp
 ** File description:
 ** preload.ts
 */

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  ping: (): Promise<string> => ipcRenderer.invoke('ping'),

  openImage: (): Promise<string | null> => ipcRenderer.invoke('dialog:openImage'),

  readImage: (filePath: string): Promise<{ name: string; data: number[] }> =>
    ipcRenderer.invoke('file:readImage', filePath),
})
