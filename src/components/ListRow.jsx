import { ChevronRight } from 'lucide-react'
import { Icon } from '../lib/icons'
import SmartLink from './SmartLink'

/** Mobile list card: icon · title + description · chevron */
export default function ListRow({ to, icon, color, title, desc, compact }) {
  return (
    <SmartLink to={to} className={`m-row ${compact ? 'm-row-compact' : ''}`}>
      {icon && (
        <span className="m-row-icon" style={{ color: color || 'var(--ink)' }}>
          <Icon name={icon} size={compact ? 26 : 38} strokeWidth={color ? 2.2 : 1.9} />
        </span>
      )}
      <span className="m-row-text">
        <strong>{title}</strong>
        {desc && <small>{desc}</small>}
      </span>
      <ChevronRight className="m-row-chev" size={20} strokeWidth={2.4} />
    </SmartLink>
  )
}
