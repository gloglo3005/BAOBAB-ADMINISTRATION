import { Link, useParams } from 'react-router-dom'
import { get, post } from '../api'
import { useOrg } from '../org'
import { ErrorBox, Loading, PageHeader, useAction, useFetch } from '../ui'
import { IMPORT_TONE } from './Import'

const Stat = ({ label, value }) => <div className="card stat"><div className="num">{value ?? 0}</div><div className="lbl">{label}</div></div>

export default function ImportDetail() {
  const { id } = useParams()
  const { org, path } = useOrg()
  const { data: b, loading, error, reload } = useFetch(() => get(path(`/imports/${id}/`)), [org.id, id])
  const action = useAction()
  const confirm = async () => {
    if (!window.confirm('Importer ce fichier dans le catalogue ? Cette action ne peut pas être annulée.')) return
    if (await action.run(() => post(path(`/imports/${id}/confirm/`)))) reload()
  }
  if (loading && !b) return <Loading />
  if (error) return <ErrorBox>{error}</ErrorBox>
  const s = b.summary || {}
  const r = b.result
  return (
    <>
      <PageHeader title={b.file_name} subtitle={`${b.row_count} ligne(s) · ${b.user_email || 'Système'}`}>
        <span className={`badge badge-${IMPORT_TONE[b.status] || 'neutral'}`}>{b.status_label}</span>
        <Link className="btn btn-ghost" to="/library/import">← Imports</Link>
        {b.can_confirm && <button className="btn" disabled={action.busy} onClick={confirm}>{action.busy ? 'Import en cours…' : 'Confirmer l\'import'}</button>}
      </PageHeader>
      <ErrorBox>{action.error}</ErrorBox>

      {r ? (
        <div className="cards">
          <Stat label="Livres créés" value={r.books_created} /><Stat label="Livres déjà présents" value={r.books_matched} />
          <Stat label="Exemplaires ajoutés" value={r.copies_created} /><Stat label="Catégories créées" value={r.categories_created} />
          <Stat label="Emplacements créés" value={r.locations_created} /><Stat label="Auteurs créés" value={r.authors_created} />
        </div>
      ) : (
        <div className="cards">
          <Stat label="Livres à créer" value={s.books_new} /><Stat label="Livres déjà présents" value={s.books_existing} /><Stat label="Exemplaires à ajouter" value={s.copies} />
        </div>
      )}

      {b.status === 'PREVIEWED' && b.error_count > 0 && <div className="alert alert-error">Ce fichier contient {b.error_count} erreur(s) : corrigez-les puis renvoyez le fichier. L'import est impossible tant qu'il reste des erreurs.</div>}
      {b.status === 'PREVIEWED' && b.error_count === 0 && <div className="alert alert-info">Aperçu sans erreur. Vérifiez les chiffres, puis confirmez pour ajouter ces livres.</div>}
      {b.status === 'FAILED' && <div className="alert alert-error">L'import a échoué et rien n'a été ajouté. {b.errors?.[0]?.message}</div>}
      {s.ignored_columns?.length > 0 && <div className="alert alert-info">Colonnes ignorées (non reconnues) : {s.ignored_columns.join(', ')}.</div>}

      {b.error_count > 0 && b.status !== 'FAILED' && (
        <div className="section card">
          <h2>Erreurs ({b.error_count})</h2>
          <div className="table-wrap"><table>
            <thead><tr><th>Ligne</th><th>Problème</th></tr></thead>
            <tbody>{b.errors.map((e, i) => <tr key={i}><td>{e.line ?? '—'}</td><td>{e.message}</td></tr>)}</tbody>
          </table></div>
          {b.errors_hidden > 0 && <p className="muted">… et {b.errors_hidden} autre(s) erreur(s) non affichée(s).</p>}
        </div>
      )}

      {b.warnings?.length > 0 && (
        <div className="section card">
          <h2>Avertissements ({s.warnings_total ?? b.warnings.length})</h2>
          <ul>{b.warnings.map((w, i) => <li key={i}>{w.line ? `Ligne ${w.line} : ` : ''}{w.message || String(w)}</li>)}</ul>
        </div>
      )}

      {b.matches?.length > 0 && (
        <div className="section card">
          <h2>Livres déjà dans le catalogue ({s.matches_total ?? b.matches.length})</h2>
          <p className="muted">Ces livres ne sont pas dupliqués : seuls leurs nouveaux exemplaires sont ajoutés.</p>
          <div className="table-wrap"><table>
            <thead><tr><th>Ligne</th><th>Dans le fichier</th><th>Dans le catalogue</th><th>Reconnu par</th><th>Exemplaires</th></tr></thead>
            <tbody>{b.matches.map((m) => <tr key={`${m.line}-${m.existing_id}`}><td>{m.line}</td><td>{m.title}</td><td><Link to={`/library/books/${m.existing_id}`}>{m.existing_title}</Link></td><td>{m.matched_by}</td><td>{m.copies}</td></tr>)}</tbody>
          </table></div>
        </div>
      )}

      {(s.new_categories?.length > 0 || s.new_locations?.length > 0 || s.new_authors?.length > 0) && (
        <div className="section card">
          <h2>Éléments qui seront créés</h2>
          <ul>
            {s.new_categories?.length > 0 && <li>Catégories ({s.new_categories.length}) : {s.new_categories.slice(0, 20).join(', ')}</li>}
            {s.new_locations?.length > 0 && <li>Emplacements ({s.new_locations.length}) : {s.new_locations.slice(0, 20).join(', ')}</li>}
            {s.new_authors?.length > 0 && <li>Auteurs ({s.new_authors.length})</li>}
          </ul>
        </div>
      )}
    </>
  )
}
