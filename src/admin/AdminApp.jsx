import { useEffect, useState } from 'react'
import { NavLink, Route, Routes, Navigate, Link } from 'react-router-dom'
import {
  Box, LayoutGrid, GraduationCap, UsersRound, CalendarDays, CircleHelp, Settings,
  LayoutDashboard, LogOut, ExternalLink, Menu, X,
} from 'lucide-react'
import { supabase, hasSupabase } from '../lib/supabase'
import { LogoMark } from '../components/Logo'
import { CONTENT, SUBMISSIONS } from './config'
import CrudPage from './CrudPage'
import Submissions from './Submissions'
import SettingsPage from './SettingsPage'
import Dashboard from './Dashboard'
import './admin.css'

const NAV = [
  { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { section: 'Content' },
  { to: '/admin/products', label: 'Products', icon: Box },
  { to: '/admin/services', label: 'Services', icon: LayoutGrid },
  { to: '/admin/academy_programs', label: 'Academy Programmes', icon: GraduationCap },
  { to: '/admin/faqs', label: 'FAQs', icon: CircleHelp },
  { section: 'People' },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
  { to: '/admin/academy_enrollments', label: 'Academy People', icon: UsersRound },
  { section: 'Site' },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

function Setup() {
  return (
    <div className="a-center">
      <div className="a-card a-login">
        <LogoMark size={56} className="dark" />
        <h1>Connect Supabase</h1>
        <p>The admin panel needs a Supabase project. Create a <code>.env</code> file in the project root:</p>
        <pre>{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}</pre>
        <p>Then run <code>supabase/schema.sql</code> in the Supabase SQL editor and restart <code>npm run dev</code>. See README.md.</p>
        <Link to="/" className="a-btn ghost">← Back to site</Link>
      </div>
    </div>
  )
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setErr(error.message)
    setBusy(false)
  }
  return (
    <div className="a-center">
      <form className="a-card a-login" onSubmit={onSubmit}>
        <LogoMark size={56} className="dark" />
        <h1>Dr Bady Admin</h1>
        <label className="a-field"><span className="a-label">Email</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></label>
        <label className="a-field"><span className="a-label">Password</span><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
        {err && <p className="a-err">{err}</p>}
        <button className="a-btn primary block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}

function NotAdmin({ email }) {
  return (
    <div className="a-center">
      <div className="a-card a-login">
        <h1>No admin access</h1>
        <p><b>{email}</b> is signed in but is not listed as an admin. Run this in the Supabase SQL editor:</p>
        <pre>{`insert into public.admins (user_id)
select id from auth.users
where email = '${email}';`}</pre>
        <button className="a-btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
    </div>
  )
}

export default function AdminApp() {
  const [session, setSession] = useState(undefined)
  const [isAdmin, setIsAdmin] = useState(null)
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    if (!hasSupabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setIsAdmin(null); return }
    supabase.rpc('is_admin').then(({ data }) => setIsAdmin(!!data))
  }, [session])

  if (!hasSupabase) return <Setup />
  if (session === undefined) return <div className="a-center">Loading…</div>
  if (!session) return <Login />
  if (isAdmin === null) return <div className="a-center">Checking access…</div>
  if (!isAdmin) return <NotAdmin email={session.user.email} />

  return (
    <div className={`a-shell ${navOpen ? 'nav-open' : ''}`}>
      <aside className="a-side">
        <div className="a-brand"><LogoMark size={34} /> <span>Dr Bady <small>Admin</small></span>
          <button className="a-ico a-close" onClick={() => setNavOpen(false)} aria-label="Close menu"><X size={20} /></button>
        </div>
        <nav>
          {NAV.map((n, i) =>
            n.section ? <div key={i} className="a-nav-sec">{n.section}</div> : (
              <NavLink key={n.to} to={n.to} end={n.end} className="a-nav" onClick={() => setNavOpen(false)}>
                <n.icon size={18} /> {n.label}
              </NavLink>
            ),
          )}
        </nav>
        <div className="a-side-foot">
          <a href="/" target="_blank" rel="noreferrer" className="a-nav"><ExternalLink size={18} /> View site</a>
          <button className="a-nav" onClick={() => supabase.auth.signOut()}><LogOut size={18} /> Sign out</button>
          <small>{session.user.email}</small>
        </div>
      </aside>
      <div className="a-main">
        <div className="a-mobilebar">
          <button className="a-ico" onClick={() => setNavOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
          <span>Dr Bady Admin</span>
        </div>
        <Routes>
          <Route index element={<Dashboard />} />
          {Object.keys(CONTENT).map((t) => <Route key={t} path={t} element={<CrudPage table={t} />} />)}
          {Object.keys(SUBMISSIONS).map((t) => <Route key={t} path={t} element={<Submissions table={t} />} />)}
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  )
}
