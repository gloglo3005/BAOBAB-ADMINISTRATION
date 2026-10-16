import { ApiError, api, tokens } from './api'

// Envoi et téléchargement de fichiers : api.js ne gère que du JSON.
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '')

async function authHeaders() {
  await api('/auth/me/') // renouvelle le jeton d'accès s'il a expiré
  const access = tokens.get()?.access
  return access ? { Authorization: `Bearer ${access}` } : {}
}

async function send(path, options) {
  try {
    return await fetch(`${BASE}${path}`, { ...options, headers: await authHeaders() })
  } catch (err) {
    if (err instanceof ApiError) throw err
    throw new ApiError(0, { detail: "Impossible de joindre l'API. Le serveur Django est-il lancé ?" })
  }
}

async function readJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export async function uploadFile(path, file, field = 'file') {
  const form = new FormData()
  form.append(field, file)
  const res = await send(path, { method: 'POST', body: form })
  const data = await readJson(res)
  if (!res.ok) throw new ApiError(res.status, data)
  return data
}

export async function downloadFile(path, filename) {
  const res = await send(path, { method: 'GET' })
  if (!res.ok) throw new ApiError(res.status, await readJson(res))
  const url = URL.createObjectURL(await res.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
