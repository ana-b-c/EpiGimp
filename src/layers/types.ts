/*
 ** EPITECH PROJECT, 2026
 ** EpiGimp
 ** File description:
 ** types.ts
 */

export interface Layer {
  id: string
  name: string
  imageData: ImageData
  visible: boolean
  opacity: number
}
