import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Box, CalendarDays, FilePen, GraduationCap, LayoutGrid, Newspaper, UsersRound } from 'lucide-react'
import { supabase } from '../lib/supabase'

const count = async (table, filter, col = 'status') => {
  let q = supabase.from(table).select('id', { count: 'exact', head: true })
  if (filter !== undefined) q = q.eq(col, filter)
  const { count: c } = await q
  return c ?? 0
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])

  useEffect(() => {
    Promise.all([
      count('bookings', 'new'), count('academy_enrollments', 'new'),
      count('products'), count('services'), count('academy_programs'),
      count('blog_posts', true, 'published'), count('blog_posts', false, 'published'),
    ]).then(([b, e, p, s, a, bp, bd]) => setStats({ b, e, p, s, a, bp, bd }))
    supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(5).then(({ data }) => setRecent(data || []))
  }, [])

  const tiles = stats && [
    { to: '/admin/bookings', label: 'New bookings', n: stats.b, icon: CalendarDays, hot: stats.b > 0 },
    { to: '/admin/academy_enrollments', label: 'New academy people', n: stats.e, icon: UsersRound, hot: stats.e > 0 },
    { to: '/admin/products', label: 'Products', n: stats.p, icon: Box },
    { to: '/admin/services', label: 'Services', n: stats.s, icon: LayoutGrid },
    { to: '/admin/academy_programs', label: 'Programmes', n: stats.a, icon: GraduationCap },
    { to: '/admin/blog_posts', label: 'Blog posts', n: stats.bp, icon: Newspaper },
    { to: '/admin/blog_posts', label: 'Blog drafts', n: stats.bd, icon: FilePen },
  ]

  return (
    <div className="a-page">
      <div className="a-head"><h1>Dashboard</h1></div>
      <div className="a-tiles">
        {!tiles && <p className="a-muted">Loading…</p>}
        {tiles?.map((t) => (
          <Link key={t.label} to={t.to} className={`a-card a-tile ${t.hot ? 'hot' : ''}`}>
            <t.icon size={22} />
            <b>{t.n}</b>
            <span>{t.label}</span>
          </Link>
        ))}
      </div>
      <div className="a-card a-recent">
        <div className="a-head small"><h2>Latest booking requests</h2><Link to="/admin/bookings">View all →</Link></div>
        {recent.length === 0 && <p className="a-muted">No bookings yet.</p>}
        {recent.map((r) => (
          <div key={r.id} className="a-recent-row">
            <strong>{r.full_name}</strong>
            <span className="a-muted">{r.topic || 'General enquiry'}</span>
            <span className={`a-status s-${r.status}`}>{r.status}</span>
            <small className="a-muted">{new Date(r.created_at).toLocaleDateString('en-GB')}</small>
          </div>
        ))}
      </div>
    </div>
  )
}
