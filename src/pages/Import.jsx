import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { get, upload } from '../api'
import { useOrg } from '../org'
import { Empty, ErrorBox, Loading, PageHeader, Pager, dateTime, rows, useAction, useFetch } from '../ui'

export const IMPORT_TONE = { PREVIEWED: 'warn', IMPORTED: 'ok', FAILED: 'bad' }

const csvCell = (v) => (/[;"\n\r]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v))

// Modèle de fichier : UTF-8 avec signature et point-virgule, pour s'ouvrir correctement dans Excel.
async function downloadTemplate(path) {
  const t = await get(path('/imports/template/'))
  const text = [t.columns, ...t.rows].map((r) => r.map(csvCell).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([`\ufeff${text}`], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: t.filename })
  a.click()
  URL.revokeObjectURL(url)
}

export default function Import() {
  const { org, path } = useOrg()
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [page, setPage] = useState(1)
  const send = useAction()
  const tpl = useAction()
  const history = useFetch(() => get(path('/imports/'), { page }), [org.id, page])
  const list = rows(history.data)

  const submit = async (e) => {
    e.preventDefault()
    const form = new FormData()
    form.append('file', file)
    const batch = await send.run(() => upload(path('/imports/'), form))
    if (batch) navigate(`/library/import/${batch.id}`)
  }

  return (
    <>
      <PageHeader title="Import du catalogue" subtitle="Ajoutez des livres et des exemplaires depuis un fichier CSV ou XLSX">
        <button className="btn btn-ghost" disabled={tpl.busy} onClick={() => tpl.run(() => downloadTemplate(path))}>Télécharger le modèle</button>
      </PageHeader>
      <form className="card" onSubmit={submit}>
        <h2>Envoyer un fichier</h2>
        <p className="muted">CSV (UTF-8, virgule ou point-virgule) ou XLSX (première feuille), 5 000 lignes et 5 Mo au plus. Rien n'est ajouté avant que vous confirmiez l'aperçu.</p>
        <ErrorBox>{send.error || tpl.error}</ErrorBox>
        <input type="file" accept=".csv,.xlsx" required onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <div className="form-actions"><button className="btn" disabled={send.busy || !file}>{send.busy ? 'Analyse du fichier…' : 'Voir l\'aperçu'}</button></div>
      </form>

      <div className="section">
        <h2>Historique</h2>
        <ErrorBox>{history.error}</ErrorBox>
        {history.loading && <Loading />}
        {history.data && (list.length === 0 ? <Empty>Aucun import pour le moment.</Empty> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Fichier</th><th>Date</th><th>Lignes</th><th>Erreurs</th><th>Statut</th></tr></thead>
            <tbody>{list.map((b) => (
              <tr key={b.id}>
                <td><Link to={`/library/import/${b.id}`}><strong>{b.file_name}</strong></Link><div className="muted">{b.user_email}</div></td>
                <td>{dateTime(b.created_at)}</td><td>{b.row_count}</td><td>{b.error_count}</td>
                <td><span className={`badge badge-${IMPORT_TONE[b.status] || 'neutral'}`}>{b.status_label}</span></td>
              </tr>
            ))}</tbody>
          </table></div>
        ))}
        <Pager page={page} count={history.data?.count || 0} pageSize={25} onPage={setPage} />
      </div>
    </>
  )
}
