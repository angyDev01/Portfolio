import { useSyncExternalStore } from 'react'
import { portfolioService } from '../services/portfolioService'

export interface AdminSessionState {
  isAdmin: boolean
  checked: boolean
}

let currentState: AdminSessionState = { isAdmin: false, checked: false }
const listeners = new Set<() => void>()
let initialized = false
let hasAuthEvent = false

function emit(next: AdminSessionState): void {
  if (next.isAdmin === currentState.isAdmin && next.checked === currentState.checked) {
    return
  }
  currentState = next
  listeners.forEach((listener) => listener())
}

function ensureSubscribed(): void {
  if (initialized) return
  initialized = true

  portfolioService.onAuthStateChange((session) => {
    hasAuthEvent = true
    emit({ isAdmin: Boolean(session), checked: true })
  })

  portfolioService
    .getSession()
    .then((session) => {
      if (!hasAuthEvent) {
        emit({ isAdmin: Boolean(session), checked: true })
      }
    })
    .catch(() => {
      if (!hasAuthEvent) {
        emit({ isAdmin: false, checked: true })
      }
    })
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  ensureSubscribed()
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): AdminSessionState {
  return currentState
}

const SERVER_SNAPSHOT: AdminSessionState = { isAdmin: false, checked: false }

function getServerSnapshot(): AdminSessionState {
  return SERVER_SNAPSHOT
}

/**
 * Hook partagé (singleton) exposant l'état de session administrateur Supabase.
 * Évite de multiplier les abonnements `onAuthStateChange` sur les grilles de cartes.
 */
export function useAdminSession(): AdminSessionState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
