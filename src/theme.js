// Thème d'affichage : automatique (réglage du système), clair ou sombre.
// Le choix est gardé dans le navigateur ; il est appliqué dès le chargement pour éviter un flash.
const KEY = 'baobab.theme'

export const THEMES = ['auto', 'light', 'dark']

export function getTheme() {
  try {
    const value = localStorage.getItem(KEY)
    return THEMES.includes(value) ? value : 'auto'
  } catch {
    return 'auto'
  }
}

export function applyTheme(theme = getTheme()) {
  const root = document.documentElement
  if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme)
  else root.removeAttribute('data-theme')
}

export function setTheme(theme) {
  try {
    if (theme === 'auto') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, theme)
  } catch {
    /* stockage indisponible : le choix vaut pour cette visite seulement */
  }
  applyTheme(theme)
}

applyTheme()
