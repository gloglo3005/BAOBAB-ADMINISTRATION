import { Link, useParams } from 'react-router-dom'
import { get, post } from '../api'
import { useOrg } from '../org'
import { Badge, ErrorBox, Loading, PageHeader, dateTime, useAction, useFetch } from '../ui'
import { IMPORT_TONES } from './Imports'

function Stats({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '.8rem', margin: '1rem 0' }}>
      {items.map(([label, value, alert]) => (
        <div key={label} className="card" style={alert ? { borderColor: '#b3261e' } : undefined}>
          <div className="muted">{label}</div>
          <strong style={{ fontSize: '1.6rem' }}>{value ?? 0}</strong>
        </div>
      ))}
    </div>
  )
}

function Table({ head, children }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export default function ImportDetail() {
  const { id } = useParams()
  const { org, path } = useOrg()
  const { data: b, loading, error, reload } = useFetch(() => get(path(`/imports/${id}/`)), [org.id, id])
  const action = useAction()

  const confirm = async () => {
    const ok = await action.run(() => post(path(`/imports/${id}/confirm/`)))
    if (ok) reload()
  }

  if (loading && !b) return <Loading />
  if (!b) return <ErrorBox>{error || 'Import introuvable.'}</ErrorBox>

  const s = b.summary || {}
  const newRefs = [['Catégories', s.new_categories], ['Emplacements', s.new_locations], ['Auteurs', s.new_authors]].filter(([, list]) => list?.length)
  const title = b.status === 'IMPORTED' ? "Rapport d'import" : b.status === 'FAILED' ? 'Import échoué' : "Aperçu de l'import"

  return (
    <>
      <PageHeader title={title} subtitle={`${b.file_name} · envoyé le ${dateTime(b.created_at)}${b.user_email ? ` par ${b.user_email}` : ''}`}>
        <Badge value={b.status_label} tone={IMPORT_TONES[b.status]} />
        <Link className="btn btn-ghost" to="/library/imports">Historique des imports</Link>
      </PageHeader>
      <ErrorBox>{action.error}</ErrorBox>

      {b.status === 'IMPORTED' && b.result && (
        <>
          <Stats items={[
            ['Livres créés', b.result.books_created], ['Livres déjà présents', b.result.books_matched],
            ['Exemplaires ajoutés', b.result.copies_created], ['Catégories créées', b.result.categories_created],
            ['Emplacements créés', b.result.locations_created], ['Auteurs créés', b.result.authors_created],
          ]} />
          <div className="page-actions">
            <Link className="btn" to="/library/books">Voir le catalogue</Link>
            <Link className="btn btn-ghost" to="/library/imports">Nouvel import</Link>
          </div>
        </>
      )}

      {b.status === 'FAILED' && (
        <>
          {b.errors.map((e, i) => <div key={i} className="alert alert-error">{e.message}</div>)}
          <p className="muted">Rien n'a été importé. Vous pouvez renvoyer le fichier pour un nouvel aperçu.</p>
          <Link className="btn" to="/library/imports">Renvoyer un fichier</Link>
        </>
      )}

      {b.status !== 'IMPORTED' && b.status !== 'FAILED' && (
        <>
          <Stats items={[
            ['Lignes lues', b.row_count], ['Livres à créer', s.books_new], ['Livres déjà présents', s.books_existing],
            ['Exemplaires à ajouter', s.copies], ['Lignes en erreur', b.error_count, b.error_count > 0],
          ]} />
          {s.ignored_columns?.length > 0 && <div className="alert alert-info">Colonnes ignorées (non reconnues) : {s.ignored_columns.join(', ')}.</div>}

          {b.error_count > 0 && (
            <>
              <div className="alert alert-error">Ce fichier contient {b.error_count} erreur(s) : l'import est bloqué. Corrigez le fichier puis renvoyez-le.</div>
              <Table head={['Ligne', 'Problème']}>
                {b.errors.map((e, i) => <tr key={i}><td>{e.line ?? '—'}</td><td>{e.message}</td></tr>)}
              </Table>
              {b.errors_hidden > 0 && <p className="muted">… et {b.errors_hidden} autre(s) erreur(s) non affichée(s).</p>}
              <p><Link className="btn" to="/library/imports">Renvoyer le fichier corrigé</Link></p>
            </>
          )}

          {newRefs.length > 0 && (
            <>
              <h2>Références nouvelles</h2>
              <p className="muted">Elles n'existent pas encore et seront créées à la confirmation.</p>
              <Table head={['Type', 'À créer']}>
                {newRefs.map(([label, list]) => <tr key={label}><td>{label} ({list.length})</td><td>{list.join(', ')}</td></tr>)}
              </Table>
            </>
          )}

          {b.matches.length > 0 && (
            <>
              <h2>Livres déjà présents</h2>
              <p className="muted">Les exemplaires du fichier s'ajoutent à ces livres, aucun second livre n'est créé.</p>
              <Table head={['Ligne', 'Titre du fichier', 'Livre existant', 'Trouvé par', 'Exemplaires']}>
                {b.matches.map((m, i) => (
                  <tr key={i}>
                    <td>{m.line}</td><td>{m.title}</td>
                    <td><Link to={`/library/books/${m.existing_id}`}>{m.existing_title}</Link></td>
                    <td>{m.matched_by}</td><td>{m.copies}</td>
                  </tr>
                ))}
              </Table>
              {b.matches_total > b.matches.length && <p className="muted">… et {b.matches_total - b.matches.length} autre(s) livre(s) déjà présent(s).</p>}
            </>
          )}

          {b.warnings.length > 0 && (
            <>
              <h2>À noter</h2>
              <ul className="muted">{b.warnings.map((w, i) => <li key={i}>Ligne {w.line} : {w.message}</li>)}</ul>
              {b.warnings_total > b.warnings.length && <p className="muted">… et {b.warnings_total - b.warnings.length} autre(s) remarque(s).</p>}
            </>
          )}

          {b.can_confirm && (
            <div className="page-actions" style={{ marginTop: '1rem' }}>
              <button className="btn" disabled={action.busy} onClick={confirm}>{action.busy ? 'Import en cours…' : "Confirmer l'import"}</button>
              <Link className="btn btn-ghost" to="/library/imports">Annuler</Link>
            </div>
          )}
        </>
      )}
    </>
  )
}
