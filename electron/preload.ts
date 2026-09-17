import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  ping: (): Promise<string> => ipcRenderer.invoke('ping'),
})
