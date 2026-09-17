/*
 ** EPITECH PROJECT, 2026
 ** EpiGimp
 ** File description:
 ** electron.d.ts
 */

export {}

declare global {
  interface Window {
    electronAPI: {
      ping: () => Promise<string>
    }
  }
}
