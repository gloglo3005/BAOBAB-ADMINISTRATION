import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { get, patch, post } from '../api'
import { useOrg } from '../org'
import { Badge, Empty, ErrorBox, Field, Loading, Modal, PageHeader, label, rows, useAction, useFetch } from '../ui'
import { BookForm } from './Books'

const MANUAL_STATUSES = ['AVAILABLE', 'UNAVAILABLE', 'DAMAGED', 'LOST']
const CONDITIONS = ['NEW', 'GOOD', 'FAIR', 'POOR']

function AddCopies({ bookId, locations, onDone, onClose }) {
  const { path } = useOrg()
  const [codes, setCodes] = useState('')
  const [location, setLocation] = useState('')
  const [condition, setCondition] = useState('GOOD')
  const { busy, error, run } = useAction()
  const submit = async (e) => {
    e.preventDefault()
    const list = codes.split(/[\n,;]+/).map((c) => c.trim()).filter(Boolean)
    const ok = await run(() => post(path(`/books/${bookId}/copies/`), { codes: list, location: location || null, condition }))
    if (ok) onDone()
  }
  return (
    <Modal title="Ajouter des exemplaires" onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBox>{error}</ErrorBox>
        <Field label="Codes d'inventaire" hint="Un code par ligne (200 au plus)"><textarea required rows={4} value={codes} onChange={(e) => setCodes(e.target.value)} /></Field>
        <div className="form-grid">
          <Field label="Emplacement">
            <select value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="">— Aucun —</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </Field>
          <Field label="État">
            <select value={condition} onChange={(e) => setCondition(e.target.value)}>
              {CONDITIONS.map((c) => <option key={c} value={c}>{label(c)}</option>)}
            </select>
          </Field>
        </div>
        <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button><button className="btn" disabled={busy}>Ajouter</button></div>
      </form>
    </Modal>
  )
}

export default function BookDetail() {
  const { id } = useParams()
  const { org, path } = useOrg()
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const action = useAction()
  const { data: book, loading, error, reload } = useFetch(() => get(path(`/books/${id}/`)), [org.id, id])
  const cats = useFetch(() => get(path('/categories/'), { active: 'true' }), [org.id])
  const locs = useFetch(() => get(path('/locations/'), { active: 'true' }), [org.id])
  const locations = rows(locs.data)

  const save = async (body) => {
    const ok = await action.run(() => patch(path(`/books/${id}/`), body))
    if (ok) { setEditing(false); reload() }
  }
  const toggleArchive = async () => {
    const ok = await action.run(() => post(path(`/books/${id}/${book.active ? 'archive' : 'restore'}/`)))
    if (ok) reload()
  }
  const move = async (copy, location) => {
    const ok = await action.run(() => post(path(`/copies/${copy.id}/move/`), { location: location || null }))
    if (ok) reload()
  }
  const setStatus = async (copy, status) => {
    const ok = await action.run(() => post(path(`/copies/${copy.id}/status/`), { status }))
    if (ok) reload()
  }

  if (loading && !book) return <Loading />
  if (error) return <ErrorBox>{error}</ErrorBox>
  if (!book) return null

  return (
    <>
      <p><Link to="/library/books">← Livres</Link></p>
      <PageHeader title={book.title} subtitle={book.subtitle}>
        <button className="btn btn-ghost" onClick={() => setEditing(true)}>Modifier</button>
        <button className="btn btn-ghost" disabled={action.busy} onClick={toggleArchive}>{book.active ? 'Archiver' : 'Restaurer'}</button>
      </PageHeader>
      <ErrorBox>{action.error}</ErrorBox>
      <div className="card">
        <dl className="kv">
          <dt>Auteurs</dt><dd>{book.authors.join(', ') || '—'}</dd>
          <dt>Catégorie</dt><dd>{book.category?.name || '—'}</dd>
          <dt>ISBN</dt><dd>{book.isbn || '—'}</dd>
          <dt>Éditeur</dt><dd>{[book.publisher, book.publication_year].filter(Boolean).join(' · ') || '—'}</dd>
          <dt>Langue</dt><dd>{book.language || '—'}</dd>
          <dt>Statut</dt><dd>{book.active ? <Badge value="ACTIVE" /> : <Badge value="archivé" tone="neutral" />}</dd>
          <dt>Description</dt><dd>{book.description || '—'}</dd>
        </dl>
      </div>

      <div className="section">
        <PageHeader title={`Exemplaires (${book.copies_available}/${book.copies_total} disponibles)`}>
          <button className="btn" onClick={() => setAdding(true)}>+ Ajouter</button>
        </PageHeader>
        {book.copies.length === 0 ? <Empty>Aucun exemplaire.</Empty> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Code</th><th>Statut</th><th>État</th><th>Emplacement</th></tr></thead>
              <tbody>
                {book.copies.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.inventory_code}</strong></td>
                    <td>
                      {c.status === 'BORROWED' ? <Badge value="BORROWED" /> : (
                        <select value={c.status} onChange={(e) => setStatus(c, e.target.value)}>
                          {MANUAL_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                        </select>
                      )}
                    </td>
                    <td>{label(c.condition)}</td>
                    <td>
                      <select value={c.location?.id ?? ''} onChange={(e) => move(c, e.target.value)}>
                        <option value="">— Aucun —</option>
                        {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <Modal title="Modifier le livre" onClose={() => setEditing(false)} wide>
          <BookForm initial={book} categories={rows(cats.data)} onSubmit={save} onCancel={() => setEditing(false)} busy={action.busy} error={action.error} />
        </Modal>
      )}
      {adding && <AddCopies bookId={id} locations={locations} onClose={() => setAdding(false)} onDone={() => { setAdding(false); reload() }} />}
    </>
  )
}
