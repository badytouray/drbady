import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays } from 'lucide-react'
import { LogoMark } from './Logo'
import { WhatsAppIcon } from '../lib/icons'
import { useData } from '../lib/DataContext'
import { waLink } from '../lib/hooks'

export default function CtaBand() {
  const { settings } = useData()
  return (
    <footer className="cta-band">
      <div className="cta-swoosh cta-swoosh-l" />
      <div className="cta-swoosh cta-swoosh-r" />
      <div className="container cta-inner">
        <LogoMark size={70} />
        <div className="cta-copy">
          <h2>{settings.cta_title}</h2>
          <p>{settings.cta_subtitle}</p>
        </div>
        <div className="cta-actions">
          <a className="btn btn-outline-gold btn-pill" href={waLink(settings.whatsapp)} target="_blank" rel="noreferrer">
            <WhatsAppIcon size={24} /> {settings.phone}
          </a>
          <Link className="btn btn-gold btn-pill" to="/book">
            <CalendarDays size={22} /> Book a Chat <ArrowRight size={20} />
          </Link>
        </div>
      </div>
      <div className="site-foot-wrap"><div className="container site-foot">
        <span>© {new Date().getFullYear()} Dr Bady™. All rights reserved.</span>
        <span>
          <Link to="/faqs">FAQs</Link> · <Link to="/academy">Academy</Link> · <a href={`mailto:${settings.email}`}>{settings.email}</a>
        </span>
      </div></div>
    </footer>
  )
}
