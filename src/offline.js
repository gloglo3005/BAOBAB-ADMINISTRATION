// Mode hors connexion (lecture seule) et suivi de la lenteur du serveur.
// - Chaque réponse GET réussie est copiée dans le navigateur (localStorage).
// - Sans réseau, la dernière copie est renvoyée à la place de l'erreur.
// - La copie est effacée à la déconnexion (voir tokens.clear dans api.js).
import { useSyncExternalStore } from 'react'

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '')
const PREFIX = 'baobab.cache.'
const INDEX = PREFIX + 'index'
const MAX_ENTRIES = 60
const MAX_ENTRY_SIZE = 400000
const MAX_AGE = 7 * 24 * 3600 * 1000
const SLOW_AFTER = 3500

// ------------------------------------------------------------------ état réseau
const state = {
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  fromCache: false,
  restored: false,
  slow: 0,
}
let snapshot = { ...state }
const listeners = new Set()

function emit() {
  snapshot = { ...state }
  listeners.forEach((listener) => listener())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useNetState() {
  return useSyncExternalStore(subscribe, () => snapshot)
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    state.online = true
    state.restored = true
    emit()
  })
  window.addEventListener('offline', () => {
    state.online = false
    state.restored = false
    emit()
  })
}

export function markFromCache(value) {
  if (state.fromCache !== value) {
    state.fromCache = value
    if (!value) state.restored = false
    emit()
  }
}

// Compte les requêtes qui traînent (serveur gratuit qui se réveille, réseau lent).
export function trackRequest() {
  let counted = false
  const timer = setTimeout(() => {
    counted = true
    state.slow += 1
    emit()
  }, SLOW_AFTER)
  return () => {
    clearTimeout(timer)
    if (counted) {
      counted = false
      state.slow -= 1
      emit()
    }
  }
}

export function offlineMessage(method) {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine
  if (method !== 'GET') {
    return offline
      ? 'Action impossible hors connexion. Reconnectez-vous puis réessayez.'
      : 'Impossible de joindre le serveur. Vérifiez votre connexion puis réessayez.'
  }
  return offline
    ? "Vous êtes hors connexion et cette page n'a pas encore été consultée."
    : 'Impossible de joindre le serveur pour le moment. Réessayez dans un instant.'
}

// Réveille le serveur dès l'ouverture de l'application (au plus une fois par minute).
let lastWarm = 0
export function warmUp() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return
  if (Date.now() - lastWarm < 60000) return
  lastWarm = Date.now()
  fetch(`${BASE}/ping/`, { mode: 'no-cors', cache: 'no-store' }).catch(() => {})
}

// ---------------------------------------------------------------- copie locale
function keyFor(path, params) {
  const query = Object.entries(params || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
  return PREFIX + path + (query ? `?${query}` : '')
}

function readIndex() {
  try {
    const value = JSON.parse(localStorage.getItem(INDEX))
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function cacheSet(path, params, data) {
  try {
    const key = keyFor(path, params)
    const value = JSON.stringify({ t: Date.now(), d: data })
    if (value.length > MAX_ENTRY_SIZE) return
    const index = readIndex().filter((k) => k !== key)
    index.push(key)
    while (index.length > MAX_ENTRIES) localStorage.removeItem(index.shift())
    for (let attempt = 0; attempt < 10; attempt += 1) {
      try {
        localStorage.setItem(key, value)
        break
      } catch {
        // Stockage plein : on libère les plus anciennes copies.
        if (index.length <= 1) return
        localStorage.removeItem(index.shift())
      }
    }
    localStorage.setItem(INDEX, JSON.stringify(index))
  } catch {
    /* stockage indisponible : pas de mode hors connexion */
  }
}

export function cacheGet(path, params) {
  try {
    const entry = JSON.parse(localStorage.getItem(keyFor(path, params)))
    if (!entry || Date.now() - entry.t > MAX_AGE) return null
    return { data: entry.d }
  } catch {
    return null
  }
}

export function cacheClear() {
  try {
    const keys = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key && key.startsWith(PREFIX)) keys.push(key)
    }
    keys.forEach((key) => localStorage.removeItem(key))
  } catch {
    /* stockage indisponible */
  }
}