import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { get, post } from '../api'
import { useOrg } from '../org'
import { Badge, Empty, ErrorBox, Field, Loading, Modal, PageHeader, Pager, rows, useAction, useFetch } from '../ui'

export function BookForm({ initial = {}, categories, onSubmit, onCancel, busy, error }) {
  const [f, setF] = useState({
    title: initial.title || '',
    subtitle: initial.subtitle || '',
    isbn: initial.isbn || '',
    publication_year: initial.publication_year ?? '',
    publisher: initial.publisher || '',
    language: initial.language || '',
    description: initial.description || '',
    category: initial.category?.id ?? '',
    authors: (initial.authors || []).join('\n'),
  })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = (e) => {
    e.preventDefault()
    onSubmit({
      ...f,
      publication_year: f.publication_year === '' ? null : Number(f.publication_year),
      category: f.category === '' ? null : String(f.category),
      authors: f.authors.split('\n').map((a) => a.trim()).filter(Boolean),
    })
  }
  return (
    <form onSubmit={submit}>
      <ErrorBox>{error}</ErrorBox>
      <Field label="Titre"><input required value={f.title} onChange={set('title')} /></Field>
      <Field label="Sous-titre"><input value={f.subtitle} onChange={set('subtitle')} /></Field>
      <Field label="Auteurs" hint="Un auteur par ligne"><textarea rows={2} value={f.authors} onChange={set('authors')} /></Field>
      <div className="form-grid">
        <Field label="ISBN"><input value={f.isbn} onChange={set('isbn')} /></Field>
        <Field label="Année"><input type="number" min="1" max="9999" value={f.publication_year} onChange={set('publication_year')} /></Field>
        <Field label="Éditeur"><input value={f.publisher} onChange={set('publisher')} /></Field>
        <Field label="Langue"><input value={f.language} onChange={set('language')} /></Field>
      </div>
      <Field label="Catégorie">
        <select value={f.category} onChange={set('category')}>
          <option value="">— Aucune —</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Description"><textarea rows={3} value={f.description} onChange={set('description')} /></Field>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn" disabled={busy}>Enregistrer</button>
      </div>
    </form>
  )
}

export default function Books() {
  const { org, path } = useOrg()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [active, setActive] = useState('true')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const action = useAction()

  const cats = useFetch(() => get(path('/categories/'), { active: 'true' }), [org.id])
  const { data, loading, error } = useFetch(
    () => get(path('/books/'), { q, category, active: active || undefined, page }),
    [org.id, q, category, active, page],
  )
  const books = rows(data)

  const create = async (body) => {
    const book = await action.run(() => post(path('/books/'), body))
    if (book) navigate(`/library/books/${book.id}`)
  }

  return (
    <>
      <PageHeader title="Livres" subtitle="Catalogue de la bibliothèque">
        <button className="btn" onClick={() => setCreating(true)}>+ Nouveau livre</button>
      </PageHeader>
      <div className="toolbar">
        <input type="search" placeholder="Titre, auteur, ISBN, code d'inventaire…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }}>
          <option value="">Toutes catégories</option>
          {rows(cats.data).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={active} onChange={(e) => { setActive(e.target.value); setPage(1) }}>
          <option value="true">Actifs</option>
          <option value="false">Archivés</option>
          <option value="">Tous</option>
        </select>
      </div>
      <ErrorBox>{error}</ErrorBox>
      {loading && <Loading />}
      {data && (books.length === 0 ? <Empty /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Titre</th><th>Auteurs</th><th>Catégorie</th><th>Exemplaires</th><th>Statut</th></tr></thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.id}>
                  <td><Link to={`/library/books/${b.id}`}><strong>{b.title}</strong></Link>{b.subtitle && <div className="muted">{b.subtitle}</div>}</td>
                  <td>{b.authors.join(', ') || '—'}</td>
                  <td>{b.category?.name || '—'}</td>
                  <td>{b.copies_available} / {b.copies_total}</td>
                  <td>{b.active ? <Badge value="ACTIVE" /> : <Badge value="archivé" tone="neutral" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      <Pager page={page} count={data?.count || 0} onPage={setPage} />
      {creating && (
        <Modal title="Nouveau livre" onClose={() => setCreating(false)} wide>
          <BookForm categories={rows(cats.data)} onSubmit={create} onCancel={() => setCreating(false)} busy={action.busy} error={action.error} />
        </Modal>
      )}
    </>
  )
}
