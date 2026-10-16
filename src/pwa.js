// Installation de l'application (PWA) : service worker et bouton « Installer ».
let deferred = null
const listeners = new Set()
const notify = () => listeners.forEach((callback) => callback())

if (typeof window !== 'undefined') {
  // Le navigateur propose l'installation une seule fois : on garde l'événement pour le bouton.
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferred = event
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    notify()
  })
}

export const canInstall = () => deferred !== null
export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
export const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
export const subscribe = (callback) => {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

export async function promptInstall() {
  if (!deferred) return false
  deferred.prompt()
  const { outcome } = await deferred.userChoice
  deferred = null
  notify()
  return outcome === 'accepted'
}

// Le service worker n'est actif que dans la version publiée (npm run build), pas en développement.
export function registerPwa() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
