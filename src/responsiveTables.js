// Tableaux adaptatifs : copie le titre de chaque colonne sur ses cellules (attribut data-label).
// Sur téléphone, le CSS (responsive.css) affiche alors chaque ligne comme une fiche « libellé : valeur ».
function labelTable(table) {
  const heads = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent.trim())
  if (heads.length === 0) return
  table.classList.add('rt')
  table.querySelectorAll('tbody tr').forEach((row) => {
    let column = 0
    Array.from(row.children).forEach((cell) => {
      if (cell.tagName !== 'TD') return
      cell.setAttribute('data-label', heads[column] || '')
      column += cell.colSpan || 1
    })
  })
}

// À appeler une fois : suit les changements de la page (nouvelles données, changement d'onglet).
export function watchTables() {
  let queued = false
  const run = () => {
    queued = false
    document.querySelectorAll('.table-wrap table').forEach(labelTable)
  }
  const schedule = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(run)
  }
  const observer = new MutationObserver(schedule)
  observer.observe(document.body, { childList: true, subtree: true, characterData: true })
  schedule()
  return () => observer.disconnect()
}
