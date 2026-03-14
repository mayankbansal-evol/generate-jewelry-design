import { create } from 'zustand'
import { Message, AppState, DesignContext, GeneratedImage } from '@/types'

interface JewelryStore {
  // State
  appState: AppState
  messages: Message[]
  designContext: DesignContext | null
  images: GeneratedImage[]
  error: string | null

  // Actions
  setAppState: (state: AppState) => void
  addMessage: (message: Message) => void
  setDesignContext: (context: DesignContext) => void
  setImages: (images: GeneratedImage[]) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  appState: 'idle' as AppState,
  messages: [],
  designContext: null,
  images: [],
  error: null,
}

export const useJewelryStore = create<JewelryStore>((set) => ({
  ...initialState,

  setAppState: (appState) => set({ appState }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setDesignContext: (designContext) =>
    set({ designContext, appState: 'ready' }),

  setImages: (images) => set({ images, appState: 'done' }),

  setError: (error) => set({ error }),

  reset: () => set({ ...initialState }),
}))
