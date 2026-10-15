import { get, post } from '../api'
import { useOrg } from '../org'
import { Badge, ErrorBox, Loading, PageHeader, dateTime, money, useAction, useFetch } from '../ui'

export default function CwDashboard() {
  const { org, path } = useOrg()
  const action = useAction()
  const { data, loading, error, reload } = useFetch(() => get(path('/coworking/dashboard/')), [org.id])
  const checkOut = async (s) => {
    const ok = await action.run(() => post(path(`/coworking/sessions/${s.id}/check-out/`)))
    if (ok) reload()
  }
  return (
    <>
      <PageHeader title="Coworking" subtitle={org.name} />
      {loading && <Loading />}
      <ErrorBox>{action.error || error}</ErrorBox>
      {data && (
        <>
          <div className="cards">
            <div className="card stat"><div className="num">{data.resources.free}</div><div className="lbl">Libres / {data.resources.total} ressources</div></div>
            <div className="card stat"><div className="num">{data.resources.occupied}</div><div className="lbl">Occupées</div></div>
            <div className="card stat"><div className="num">{data.resources.reserved_now}</div><div className="lbl">Réservées maintenant</div></div>
            <div className="card stat"><div className="num">{data.sessions.open}</div><div className="lbl">Sessions ouvertes</div></div>
            <div className="card stat"><div className="num">{money(data.revenue_today.amount, data.revenue_today.currency)}</div><div className="lbl">Encaissé aujourd'hui</div></div>
            <div className={`card stat ${data.reservations_awaiting_no_show_decision ? 'warn' : ''}`}><div className="num">{data.reservations_awaiting_no_show_decision}</div><div className="lbl">Absences à trancher</div></div>
          </div>
          <div className="card">
            <h2>Réservations du jour</h2>
            <p style={{ marginTop: '.6rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
              {Object.entries(data.reservations_today).map(([k, v]) => <span key={k}><Badge value={k} /> {v}</span>)}
            </p>
          </div>
          <div className="section">
            <h2>Sessions en cours</h2>
            {data.open_sessions.length === 0 ? <p className="empty">Personne n'est présent.</p> : (
              <div className="table-wrap" style={{ marginTop: '.7rem' }}>
                <table>
                  <thead><tr><th>Client</th><th>Ressource</th><th>Arrivée</th><th /></tr></thead>
                  <tbody>
                    {data.open_sessions.map((s) => (
                      <tr key={s.id}>
                        <td><strong>{s.customer_name}</strong> <span className="muted">{s.customer_number}</span></td>
                        <td>{s.resource_code} · {s.resource_name}</td>
                        <td>{dateTime(s.checked_in_at)}</td>
                        <td className="actions"><button className="btn btn-sm" disabled={action.busy} onClick={() => checkOut(s)}>Sortie</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
