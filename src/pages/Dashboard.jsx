import { Fragment } from 'react'
import { get } from '../api'
import { useOrg } from '../org'
import { ErrorBox, Loading, PageHeader, label, useFetch } from '../ui'

export default function Dashboard() {
  const { org, path } = useOrg()
  const { data, loading, error } = useFetch(() => get(path('/dashboard/')), [org.id])
  return (
    <>
      <PageHeader title="Bibliothèque" subtitle={org.name} />
      {loading && <Loading />}
      <ErrorBox>{error}</ErrorBox>
      {data && (
        <>
          <div className="cards">
            <div className="card stat"><div className="num">{data.books.active}</div><div className="lbl">Livres actifs</div></div>
            <div className="card stat"><div className="num">{data.copies.total}</div><div className="lbl">Exemplaires</div></div>
            <div className="card stat"><div className="num">{data.members.total}</div><div className="lbl">Membres</div></div>
            <div className="card stat"><div className="num">{data.loans.active}</div><div className="lbl">Prêts en cours</div></div>
            <div className={`card stat ${data.loans.overdue ? 'warn' : ''}`}><div className="num">{data.loans.overdue}</div><div className="lbl">Prêts en retard</div></div>
          </div>
          <div className="cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            <div className="card">
              <h2>Exemplaires par statut</h2>
              <dl className="kv" style={{ marginTop: '.7rem' }}>
                {Object.entries(data.copies.by_status).map(([k, v]) => (<Fragment key={k}><dt>{label(k)}</dt><dd>{v}</dd></Fragment>))}
              </dl>
            </div>
            <div className="card">
              <h2>Membres par statut</h2>
              <dl className="kv" style={{ marginTop: '.7rem' }}>
                {Object.entries(data.members.by_status).map(([k, v]) => (<Fragment key={k}><dt>{label(k)}</dt><dd>{v}</dd></Fragment>))}
              </dl>
            </div>
          </div>
        </>
      )}
    </>
  )
}
