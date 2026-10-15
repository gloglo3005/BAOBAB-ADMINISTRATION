// Client HTTP minimal pour l'API Django : JWT + renouvellement automatique.
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '')
const STORAGE_KEY = 'baobab-admin.tokens'

export class ApiError extends Error {
  constructor(status, data) {
    super(errorMessage({ status, data }))
    this.status = status
    this.data = data
  }
}

export const tokens = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null
    } catch {
      return null
    }
  },
  set(value) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
      /* stockage indisponible */
    }
  },
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* stockage indisponible */
    }
  },
}

// Transforme une réponse d'erreur DRF ({detail} ou {champ: [messages]}) en texte.
export function errorMessage(err) {
  const data = err?.data
  if (!data) return err?.message || 'Erreur inconnue.'
  if (typeof data === 'string') return data
  if (data.detail) return String(data.detail)
  const parts = Object.entries(data).map(([field, msgs]) => {
    const text = Array.isArray(msgs) ? msgs.join(' ') : typeof msgs === 'object' ? JSON.stringify(msgs) : String(msgs)
    return field === 'non_field_errors' ? text : `${field} : ${text}`
  })
  return parts.join(' · ') || 'Requête refusée.'
}

let refreshing = null

async function refreshAccess() {
  const current = tokens.get()
  if (!current?.refresh) return false
  if (!refreshing) {
    refreshing = fetch(`${BASE}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: current.refresh }),
    })
      .then(async (res) => {
        if (!res.ok) return false
        const data = await res.json()
        tokens.set({ ...current, access: data.access, refresh: data.refresh || current.refresh })
        return true
      })
      .catch(() => false)
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

function buildUrl(path, params) {
  const url = new URL(`${BASE}${path}`)
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
  })
  return url.toString()
}

export async function api(path, { method = 'GET', body, params, auth = true } = {}, retry = true) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && tokens.get()?.access) headers.Authorization = `Bearer ${tokens.get().access}`
  let res
  try {
    res = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, { detail: "Impossible de joindre l'API. Le serveur Django est-il lancé ?" })
  }
  if (res.status === 401 && auth && retry && (await refreshAccess())) {
    return api(path, { method, body, params, auth }, false)
  }
  let data = null
  if (res.status !== 204) {
    try {
      data = await res.json()
    } catch {
      data = null
    }
  }
  if (!res.ok) {
    if (res.status === 401 && auth) window.dispatchEvent(new Event('baobab:unauthorized'))
    throw new ApiError(res.status, data)
  }
  return data
}

export const get = (path, params) => api(path, { params })
export const post = (path, body = {}) => api(path, { method: 'POST', body })
export const patch = (path, body = {}) => api(path, { method: 'PATCH', body })
