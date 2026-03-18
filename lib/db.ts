import { openDB, type IDBPDatabase } from 'idb'
import type { Conversation } from '@/types'

const DB_NAME = 'evol-jewelry'
const DB_VERSION = 1
const CONVERSATIONS_STORE = 'conversations'

// ── Database initialization ──────────────────────────────────────
let dbPromise: Promise<IDBPDatabase> | null = null

function getDB(): Promise<IDBPDatabase> {
  if (typeof window === 'undefined') {
    // SSR guard — return a never-resolving promise (should never be called server-side)
    return new Promise(() => {})
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(CONVERSATIONS_STORE)) {
          const store = db.createObjectStore(CONVERSATIONS_STORE, { keyPath: 'id' })
          store.createIndex('updatedAt', 'updatedAt')
        }
      },
    })
  }
  return dbPromise
}

// ── CRUD operations ──────────────────────────────────────────────

export async function getAllConversations(): Promise<Conversation[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex(CONVERSATIONS_STORE, 'updatedAt')
  // Return newest first
  return all.reverse() as Conversation[]
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  const db = await getDB()
  return db.get(CONVERSATIONS_STORE, id) as Promise<Conversation | undefined>
}

export async function saveConversation(conversation: Conversation): Promise<void> {
  const db = await getDB()
  await db.put(CONVERSATIONS_STORE, conversation)
}

export async function deleteConversation(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(CONVERSATIONS_STORE, id)
}

// ── Image helpers ────────────────────────────────────────────────

export interface ImageEntry {
  url: string
  variantLabel?: string
  conversationId: string
  conversationTitle: string
  messageId: string
  timestamp: number
}

/** Extract all generated images across all conversations */
export async function getAllImages(): Promise<ImageEntry[]> {
  const conversations = await getAllConversations()
  const images: ImageEntry[] = []

  for (const convo of conversations) {
    for (const msg of convo.messages) {
      if (msg.role === 'assistant' && msg.images) {
        for (const img of msg.images) {
          if (img.url) {
            images.push({
              url: img.url,
              variantLabel: img.variantLabel,
              conversationId: convo.id,
              conversationTitle: convo.title,
              messageId: msg.id,
              timestamp: msg.timestamp,
            })
          }
        }
      }
    }
  }

  // Newest first
  return images.sort((a, b) => b.timestamp - a.timestamp)
}
