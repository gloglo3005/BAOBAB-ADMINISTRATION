import { useState } from 'react'
import { get, patch, post } from '../api'
import { useOrg } from '../org'
import { Badge, Empty, ErrorBox, Loading, PageHeader, rows, useAction, useFetch } from '../ui'

function RefList({ kind, title }) {
  const { org, path } = useOrg()
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(null)
  const action = useAction()
  const { data, loading, error, reload } = useFetch(() => get(path(`/${kind}/`)), [org.id, kind])
  const items = rows(data)

  const add = async (e) => {
    e.preventDefault()
    const ok = await action.run(() => post(path(`/${kind}/`), { name }))
    if (ok) { setName(''); reload() }
  }
  const update = async (item, body) => {
    const ok = await action.run(() => patch(path(`/${kind}/${item.id}/`), body))
    if (ok) { setEditing(null); reload() }
  }

  return (
    <div className="section">
      <h2>{title}</h2>
      <form className="toolbar" onSubmit={add} style={{ marginTop: '.7rem' }}>
        <input placeholder={`Nouvelle entrée`} required value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn" disabled={action.busy}>Ajouter</button>
      </form>
      <ErrorBox>{action.error || error}</ErrorBox>
      {loading && <Loading />}
      {data && (items.length === 0 ? <Empty>Aucune entrée.</Empty> : (
        <div className="table-wrap">
          <table>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>
                    {editing?.id === it.id ? (
                      <input autoFocus value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && update(it, { name: editing.name })} />
                    ) : <strong>{it.name}</strong>}
                  </td>
                  <td>{it.active ? <Badge value="ACTIVE" /> : <Badge value="inactif" tone="neutral" />}</td>
                  <td className="actions">
                    {editing?.id === it.id ? (
                      <>
                        <button className="btn btn-sm" onClick={() => update(it, { name: editing.name })}>OK</button>{' '}
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Annuler</button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditing({ id: it.id, name: it.name })}>Renommer</button>{' '}
                        <button className="btn btn-ghost btn-sm" onClick={() => update(it, { active: !it.active })}>{it.active ? 'Désactiver' : 'Activer'}</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

export default function Referentials() {
  return (
    <>
      <PageHeader title="Catégories & emplacements" subtitle="Référentiels de la bibliothèque" />
      <RefList kind="categories" title="Catégories" />
      <RefList kind="locations" title="Emplacements" />
    </>
  )
}
