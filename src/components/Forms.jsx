import { useState } from 'react'
import { CalendarDays, CheckCircle2, Send } from 'lucide-react'
import { submit } from '../lib/api'
import { useData } from '../lib/DataContext'

function useForm(initial) {
  const [values, setValues] = useState(initial)
  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }))
  return [values, set, setValues]
}

function Success({ title, text, onReset }) {
  return (
    <div className="form-success" role="status">
      <CheckCircle2 size={48} />
      <h3>{title}</h3>
      <p>{text}</p>
      <button type="button" className="btn btn-outline-dark btn-pill" onClick={onReset}>Send another</button>
    </div>
  )
}

export function BookingForm({ defaultTopic = '' }) {
  const { products, services } = useData()
  const empty = { full_name: '', email: '', phone: '', topic: defaultTopic, preferred_date: '', preferred_time: '', contact_method: 'WhatsApp', message: '' }
  const [v, set, setV] = useForm(empty)
  const [state, setState] = useState('idle')
  const [err, setErr] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setState('sending'); setErr('')
    try {
      await submit('bookings', { ...v, preferred_date: v.preferred_date || null })
      setState('done')
    } catch (ex) {
      setErr(ex.message || 'Something went wrong. Please try WhatsApp instead.')
      setState('idle')
    }
  }

  if (state === 'done')
    return <Success title="Request received" text="Thanks! Dr Bady will be in touch shortly to confirm your chat." onReset={() => { setV(empty); setState('idle') }} />

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="form-row">
        <label>Full name<input required value={v.full_name} onChange={set('full_name')} autoComplete="name" /></label>
        <label>Email<input required type="email" value={v.email} onChange={set('email')} autoComplete="email" /></label>
      </div>
      <div className="form-row">
        <label>Phone / WhatsApp<input value={v.phone} onChange={set('phone')} autoComplete="tel" /></label>
        <label>What is it about?
          <select value={v.topic} onChange={set('topic')}>
            <option value="">General enquiry</option>
            <optgroup label="Services">{services.map((s) => <option key={s.id}>{s.title}</option>)}</optgroup>
            <optgroup label="Products">{products.map((p) => <option key={p.id}>{p.title}</option>)}</optgroup>
            <option>Academy / Training</option>
          </select>
        </label>
      </div>
      <div className="form-row form-row-3">
        <label>Preferred date<input type="date" value={v.preferred_date} onChange={set('preferred_date')} /></label>
        <label>Preferred time
          <select value={v.preferred_time} onChange={set('preferred_time')}>
            <option value="">Any time</option><option>Morning</option><option>Afternoon</option><option>Evening</option>
          </select>
        </label>
        <label>Contact me by
          <select value={v.contact_method} onChange={set('contact_method')}>
            <option>WhatsApp</option><option>Phone</option><option>Email</option><option>Video call</option>
          </select>
        </label>
      </div>
      <label>Tell me about your idea or challenge<textarea rows={4} value={v.message} onChange={set('message')} /></label>
      {err && <p className="form-error">{err}</p>}
      <button className="btn btn-gold btn-pill btn-block" disabled={state === 'sending'}>
        <CalendarDays size={20} /> {state === 'sending' ? 'Sending…' : 'Book a Chat'}
      </button>
    </form>
  )
}

export function EnrollForm({ program, onDone }) {
  const empty = { full_name: '', email: '', phone: '', country: '', message: '' }
  const [v, set, setV] = useForm(empty)
  const [state, setState] = useState('idle')
  const [err, setErr] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setState('sending'); setErr('')
    try {
      const isUuid = /^[0-9a-f-]{36}$/i.test(program?.id || '')
      await submit('academy_enrollments', { ...v, program_id: isUuid ? program.id : null, program_title: program?.title || null })
      setState('done')
    } catch (ex) {
      setErr(ex.message || 'Something went wrong.')
      setState('idle')
    }
  }

  if (state === 'done')
    return <Success title="You're on the list!" text={`Thanks for registering for ${program?.title || 'the Academy'}. Details will be sent to you soon.`} onReset={() => { setV(empty); setState('idle'); onDone?.() }} />

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="form-row">
        <label>Full name<input required value={v.full_name} onChange={set('full_name')} autoComplete="name" /></label>
        <label>Email<input required type="email" value={v.email} onChange={set('email')} autoComplete="email" /></label>
      </div>
      <div className="form-row">
        <label>Phone / WhatsApp<input value={v.phone} onChange={set('phone')} autoComplete="tel" /></label>
        <label>Country<input value={v.country} onChange={set('country')} autoComplete="country-name" /></label>
      </div>
      <label>Anything you'd like to share? (optional)<textarea rows={3} value={v.message} onChange={set('message')} /></label>
      {err && <p className="form-error">{err}</p>}
      <button className="btn btn-gold btn-pill btn-block" disabled={state === 'sending'}>
        <Send size={18} /> {state === 'sending' ? 'Sending…' : 'Register'}
      </button>
    </form>
  )
}
