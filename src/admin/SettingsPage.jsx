import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { adminSaveSettings, getSettings } from '../lib/api'
import { SETTINGS_FIELDS } from './config'
import { Field } from './Fields'

export default function SettingsPage() {
  const [data, setData] = useState(null)
  const [state, setState] = useState('')

  useEffect(() => { getSettings().then(setData) }, [])

  async function save(e) {
    e.preventDefault()
    setState('saving')
    try { await adminSaveSettings(data); setState('saved') } catch (ex) { setState(ex.message) }
  }

  if (!data) return <div className="a-page a-muted">Loading…</div>
  return (
    <form className="a-page" onSubmit={save}>
      <div className="a-head">
        <h1>Site Settings</h1>
        <button className="a-btn primary" disabled={state === 'saving'}><Save size={18} /> {state === 'saving' ? 'Saving…' : 'Save changes'}</button>
      </div>
      {state && state !== 'saving' && <p className={state === 'saved' ? 'a-ok' : 'a-err'}>{state === 'saved' ? 'Saved. Changes are live.' : state}</p>}
      <div className="a-card a-grid a-settings">
        {SETTINGS_FIELDS.map((f, i) =>
          f.group ? <h2 key={i} className="a-group">{f.group}</h2> : (
            <Field key={f.key} f={f} value={data[f.key]} onChange={(v) => { setData((d) => ({ ...d, [f.key]: v })); setState('') }} />
          ),
        )}
      </div>
    </form>
  )
}
