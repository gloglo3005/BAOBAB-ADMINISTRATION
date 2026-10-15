import { useState } from 'react'
import { get, patch, post } from '../api'
import { useOrg } from '../org'
import { Badge, Empty, ErrorBox, Field, Loading, Modal, PageHeader, label, rows, useAction, useFetch } from '../ui'

const TYPES = ['DESK', 'ROOM', 'OTHER']

export default function CwResources() {
  const { org, path } = useOrg()
  const action = useAction()
  const [zoneName, setZoneName] = useState('')
  const [adding, setAdding] = useState(false)
  const [r, setR] = useState({ zone: '', code: '', name: '', resource_type: 'DESK', capacity: 1 })
  const zones = useFetch(() => get(path('/coworking/zones/'), { page_size: 100 }), [org.id])
  const resources = useFetch(() => get(path('/coworking/resources/'), { page_size: 100 }), [org.id])
  const zoneList = rows(zones.data)
  const set = (k) => (e) => setR({ ...r, [k]: e.target.value })

  const addZone = async (e) => {
    e.preventDefault()
    const ok = await action.run(() => post(path('/coworking/zones/'), { name: zoneName }))
    if (ok) { setZoneName(''); zones.reload() }
  }
  const toggle = async (kind, item) => {
    const ok = await action.run(() => patch(path(`/coworking/${kind}/${item.id}/`), { active: !item.active }))
    if (ok) { zones.reload(); resources.reload() }
  }
  const addResource = async (e) => {
    e.preventDefault()
    const ok = await action.run(() => post(path('/coworking/resources/'), { ...r, zone: Number(r.zone), capacity: Number(r.capacity) }))
    if (ok) { setAdding(false); resources.reload() }
  }

  return (
    <>
      <PageHeader title="Zones & ressources" subtitle="Espaces réservables">
        <button className="btn" disabled={zoneList.length === 0} onClick={() => { setR({ ...r, zone: zoneList[0]?.id ?? '' }); setAdding(true) }}>+ Ressource</button>
      </PageHeader>
      <ErrorBox>{action.error}</ErrorBox>

      <h2>Zones</h2>
      <form className="toolbar" onSubmit={addZone} style={{ marginTop: '.7rem' }}>
        <input placeholder="Nouvelle zone" required value={zoneName} onChange={(e) => setZoneName(e.target.value)} />
        <button className="btn" disabled={action.busy}>Ajouter</button>
      </form>
      {zones.loading && <Loading />}
      {zones.data && (zoneList.length === 0 ? <Empty>Créez d'abord une zone.</Empty> : (
        <div className="table-wrap"><table><tbody>
          {zoneList.map((z) => (
            <tr key={z.id}><td><strong>{z.name}</strong></td><td>{z.active ? <Badge value="ACTIVE" /> : <Badge value="inactive" tone="neutral" />}</td>
              <td className="actions"><button className="btn btn-ghost btn-sm" onClick={() => toggle('zones', z)}>{z.active ? 'Désactiver' : 'Activer'}</button></td></tr>
          ))}
        </tbody></table></div>
      ))}

      <div className="section">
        <h2>Ressources</h2>
        {resources.loading && <Loading />}
        <ErrorBox>{resources.error}</ErrorBox>
        {resources.data && (rows(resources.data).length === 0 ? <Empty>Aucune ressource.</Empty> : (
          <div className="table-wrap" style={{ marginTop: '.7rem' }}><table>
            <thead><tr><th>Code</th><th>Nom</th><th>Zone</th><th>Type</th><th>Capacité</th><th>Statut</th><th /></tr></thead>
            <tbody>{rows(resources.data).map((x) => (
              <tr key={x.id}><td><strong>{x.code}</strong></td><td>{x.name}</td><td>{x.zone_name}</td><td>{label(x.resource_type)}</td><td>{x.capacity}</td>
                <td>{x.active ? <Badge value="ACTIVE" /> : <Badge value="inactive" tone="neutral" />}</td>
                <td className="actions"><button className="btn btn-ghost btn-sm" onClick={() => toggle('resources', x)}>{x.active ? 'Désactiver' : 'Activer'}</button></td></tr>
            ))}</tbody>
          </table></div>
        ))}
      </div>

      {adding && (
        <Modal title="Nouvelle ressource" onClose={() => setAdding(false)}>
          <form onSubmit={addResource}>
            <ErrorBox>{action.error}</ErrorBox>
            <Field label="Zone"><select value={r.zone} onChange={set('zone')}>{zoneList.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}</select></Field>
            <div className="form-grid">
              <Field label="Code"><input required value={r.code} onChange={set('code')} /></Field>
              <Field label="Nom"><input required value={r.name} onChange={set('name')} /></Field>
              <Field label="Type"><select value={r.resource_type} onChange={set('resource_type')}>{TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}</select></Field>
              <Field label="Capacité"><input type="number" min="1" value={r.capacity} onChange={set('capacity')} /></Field>
            </div>
            <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>Annuler</button><button className="btn" disabled={action.busy}>Créer</button></div>
          </form>
        </Modal>
      )}
    </>
  )
}
