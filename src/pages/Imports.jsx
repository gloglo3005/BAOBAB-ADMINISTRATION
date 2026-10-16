import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { get } from '../api'
import { downloadFile, uploadFile } from '../files'
import { useOrg } from '../org'
import { Badge, Empty, ErrorBox, Loading, PageHeader, Pager, dateTime, rows, useAction, useFetch } from '../ui'

export const IMPORT_TONES = { UPLOADED: 'info', PREVIEWED: 'warn', CONFIRMED: 'info', IMPORTED: 'ok', FAILED: 'bad' }

export default function Imports() {
  const { org, path } = useOrg()
  const navigate = useNavigate()
  const input = useRef(null)
  const [file, setFile] = useState(null)
  const [page, setPage] = useState(1)
  const upload = useAction()
  const template = useAction()
  const { data, loading, error } = useFetch(() => get(path('/imports/'), { page }), [org.id, page])
  const imports = rows(data)

  const submit = async (e) => {
    e.preventDefault()
    if (!file) return
    const batch = await upload.run(() => uploadFile(path('/imports/'), file))
    if (batch) navigate(`/library/imports/${batch.id}`)
  }

  return (
    <>
      <PageHeader title="Import du catalogue" subtitle="Ajoutez des livres et des exemplaires depuis un fichier CSV ou Excel">
        <button className="btn btn-ghost" disabled={template.busy} onClick={() => template.run(() => downloadFile(path('/imports/template/'), 'modele_import_catalogue.csv'))}>
          Télécharger le modèle CSV
        </button>
      </PageHeader>

      <form className="card" onSubmit={submit} style={{ marginBottom: '1rem' }}>
        <h2>Envoyer un fichier</h2>
        <p className="muted">
          CSV (UTF-8, virgule ou point-virgule) ou XLSX (première feuille), 5 000 lignes et 5 Mo au plus.
          Le fichier est d'abord analysé : rien n'entre dans le catalogue avant votre confirmation.
        </p>
        <ErrorBox>{upload.error || template.error}</ErrorBox>
        <div className="toolbar">
          <input ref={input} type="file" accept=".csv,.xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button className="btn" disabled={!file || upload.busy}>{upload.busy ? 'Analyse…' : 'Analyser le fichier'}</button>
        </div>
      </form>

      <h2>Historique</h2>
      <ErrorBox>{error}</ErrorBox>
      {loading && <Loading />}
      {data && (imports.length === 0 ? <Empty>Aucun import pour le moment.</Empty> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Fichier</th><th>Envoyé le</th><th>Par</th><th>Lignes</th><th>Erreurs</th><th>Statut</th><th /></tr></thead>
            <tbody>
              {imports.map((b) => (
                <tr key={b.id}>
                  <td><strong>{b.file_name}</strong></td>
                  <td>{dateTime(b.created_at)}</td>
                  <td>{b.user_email || '—'}</td>
                  <td>{b.row_count}</td>
                  <td>{b.error_count}</td>
                  <td><Badge value={b.status_label} tone={IMPORT_TONES[b.status]} /></td>
                  <td className="actions"><Link className="btn btn-ghost btn-sm" to={`/library/imports/${b.id}`}>{b.can_confirm ? 'Voir et confirmer' : 'Voir'}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      <Pager page={page} count={data?.count || 0} onPage={setPage} />
    </>
  )
}
