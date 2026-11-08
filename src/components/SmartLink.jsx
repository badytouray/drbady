import { Link } from 'react-router-dom'
import { isExternal } from '../lib/hooks'

// Uses <a target=_blank> for absolute URLs and router <Link> for internal paths.
export default function SmartLink({ to = '#', children, ...props }) {
  if (isExternal(to) || to.startsWith('mailto:') || to.startsWith('tel:')) {
    return (
      <a href={to} target={isExternal(to) ? '_blank' : undefined} rel="noreferrer" {...props}>
        {children}
      </a>
    )
  }
  return (
    <Link to={to} {...props}>
      {children}
    </Link>
  )
}
