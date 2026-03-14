import { create } from 'zustand'
import { AppState, GeneratedImage } from '@/types'

interface JewelryStore {
  // State
  appState: AppState
  images: GeneratedImage[]
  error: string | null

  // Actions
  setAppState: (state: AppState) => void
  setImages: (images: GeneratedImage[]) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  appState: 'idle' as AppState,
  images: [],
  error: null,
}

export const useJewelryStore = create<JewelryStore>((set) => ({
  ...initialState,

  setAppState: (appState) => set({ appState }),

  setImages: (images) => set({ images, appState: 'done' }),

  setError: (error) => set({ error }),

  reset: () => set({ ...initialState }),
}))
