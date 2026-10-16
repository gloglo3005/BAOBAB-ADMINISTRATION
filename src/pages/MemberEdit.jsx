import { useState } from 'react'
import { patch } from '../api'
import { useOrg } from '../org'
import { ErrorBox, Field, Modal, useAction } from '../ui'

// Modification des informations d'un membre (le statut a ses propres boutons).
export default function MemberEdit({ member, onDone, onClose }) {
  const { path } = useOrg()
  const [f, setF] = useState({
    first_name: member.first_name,
    last_name: member.last_name,
    phone: member.phone || '',
    member_number: member.member_number,
  })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const { busy, error, run } = useAction()
  const submit = async (e) => {
    e.preventDefault()
    const ok = await run(() => patch(path(`/members/${member.id}/`), f))
    if (ok) onDone()
  }
  return (
    <Modal title={`Modifier ${member.first_name} ${member.last_name}`} onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBox>{error}</ErrorBox>
        <div className="form-grid">
          <Field label="Prénom"><input required value={f.first_name} onChange={set('first_name')} /></Field>
          <Field label="Nom"><input required value={f.last_name} onChange={set('last_name')} /></Field>
        </div>
        <Field label="Téléphone"><input value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Numéro de membre" hint="À changer seulement si la carte du membre change aussi">
          <input required value={f.member_number} onChange={set('member_number')} />
        </Field>
        <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button><button className="btn" disabled={busy}>Enregistrer</button></div>
      </form>
    </Modal>
  )
}
