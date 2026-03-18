import { create } from 'zustand'
import type { AppView, Conversation, ChatMessage, JewelryParams } from '@/types'
import {
  getAllConversations,
  saveConversation,
  deleteConversation as deleteConversationFromDB,
} from '@/lib/db'

// ── Store shape ──────────────────────────────────────────────────

interface JewelryStore {
  // View
  view: AppView
  isHydrated: boolean

  // Conversations
  conversations: Conversation[]
  activeConversationId: string | null

  // UI state
  isGenerating: boolean
  error: string | null
  drawerOpen: boolean
  drawerTab: 'chats' | 'images'

  // Derived (computed inline via selectors)
  // activeConversation → use getActiveConversation selector

  // Actions
  setView: (view: AppView) => void
  setError: (error: string | null) => void
  setDrawerOpen: (open: boolean) => void
  setDrawerTab: (tab: 'chats' | 'images') => void

  // Conversation lifecycle
  hydrate: () => Promise<void>
  startNewConversation: (firstPrompt: string) => string // returns convo ID
  loadConversation: (id: string) => void
  deleteConversation: (id: string) => Promise<void>

  // Message management
  addMessage: (message: ChatMessage) => void
  updateLastAssistantMessage: (update: Partial<ChatMessage>) => void
  setCurrentParams: (params: JewelryParams) => void
  setIsGenerating: (val: boolean) => void

  // Persistence
  persistActiveConversation: () => Promise<void>

  // Full reset
  reset: () => void
}

// ── Helpers ──────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function titleFromPrompt(prompt: string): string {
  const clean = prompt.replace(/\n/g, ' ').trim()
  return clean.length > 60 ? clean.slice(0, 57) + '...' : clean
}

// ── Store ────────────────────────────────────────────────────────

export const useJewelryStore = create<JewelryStore>((set, get) => ({
  // Initial state
  view: 'home',
  isHydrated: false,
  conversations: [],
  activeConversationId: null,
  isGenerating: false,
  error: null,
  drawerOpen: false,
  drawerTab: 'chats',

  // ── Simple setters ─────────────────────────────────────────────
  setView: (view) => set({ view }),
  setError: (error) => set({ error }),
  setDrawerOpen: (open) => set({ drawerOpen: open }),
  setDrawerTab: (tab) => set({ drawerTab: tab }),
  setIsGenerating: (val) => set({ isGenerating: val }),

  // ── Hydrate from IndexedDB ─────────────────────────────────────
  hydrate: async () => {
    try {
      const conversations = await getAllConversations()
      set({ conversations, isHydrated: true })
    } catch (err) {
      console.error('Failed to hydrate from IndexedDB:', err)
      set({ isHydrated: true })
    }
  },

  // ── Start a new conversation ───────────────────────────────────
  startNewConversation: (firstPrompt: string) => {
    const id = generateId()
    const now = Date.now()

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: firstPrompt,
      timestamp: now,
    }

    const conversation: Conversation = {
      id,
      title: titleFromPrompt(firstPrompt),
      createdAt: now,
      updatedAt: now,
      messages: [userMessage],
    }

    set((state) => ({
      conversations: [conversation, ...state.conversations],
      activeConversationId: id,
      view: 'chat',
      error: null,
    }))

    return id
  },

  // ── Load existing conversation ─────────────────────────────────
  loadConversation: (id: string) => {
    set({
      activeConversationId: id,
      view: 'chat',
      error: null,
      drawerOpen: false,
    })
  },

  // ── Delete conversation ────────────────────────────────────────
  deleteConversation: async (id: string) => {
    await deleteConversationFromDB(id)
    set((state) => {
      const conversations = state.conversations.filter((c) => c.id !== id)
      const activeConversationId =
        state.activeConversationId === id ? null : state.activeConversationId
      const view = activeConversationId ? state.view : 'home'
      return { conversations, activeConversationId, view }
    })
  },

  // ── Add message to active conversation ─────────────────────────
  addMessage: (message: ChatMessage) => {
    set((state) => {
      const convos = state.conversations.map((c) => {
        if (c.id !== state.activeConversationId) return c
        return {
          ...c,
          messages: [...c.messages, message],
          updatedAt: Date.now(),
        }
      })
      return { conversations: convos }
    })
  },

  // ── Update the last assistant message (resolve loading placeholder) ─
  updateLastAssistantMessage: (update: Partial<ChatMessage>) => {
    set((state) => {
      const convos = state.conversations.map((c) => {
        if (c.id !== state.activeConversationId) return c
        const msgs = [...c.messages]
        // Find last assistant message
        for (let i = msgs.length - 1; i >= 0; i--) {
          if (msgs[i].role === 'assistant') {
            msgs[i] = { ...msgs[i], ...update }
            break
          }
        }
        return { ...c, messages: msgs, updatedAt: Date.now() }
      })
      return { conversations: convos }
    })
  },

  // ── Update params on active conversation ───────────────────────
  setCurrentParams: (params: JewelryParams) => {
    set((state) => {
      const convos = state.conversations.map((c) => {
        if (c.id !== state.activeConversationId) return c
        return { ...c, currentParams: params, updatedAt: Date.now() }
      })
      return { conversations: convos }
    })
  },

  // ── Persist active conversation to IndexedDB ───────────────────
  persistActiveConversation: async () => {
    const state = get()
    const convo = state.conversations.find(
      (c) => c.id === state.activeConversationId,
    )
    if (convo) {
      await saveConversation(convo)
    }
  },

  // ── Full reset → go home ───────────────────────────────────────
  reset: () => {
    set({
      view: 'home',
      activeConversationId: null,
      isGenerating: false,
      error: null,
      drawerOpen: false,
    })
  },
}))

// ── Selectors ────────────────────────────────────────────────────

export function getActiveConversation(state: JewelryStore): Conversation | undefined {
  return state.conversations.find((c) => c.id === state.activeConversationId)
}
