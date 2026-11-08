import {
  Car, ShieldCheck, GraduationCap, Store, MonitorSmartphone, Monitor,
  Laptop, Palette, Printer, Megaphone, BriefcaseBusiness, Briefcase, UsersRound,
  Tag, CirclePlus, Ship, Wrench, Truck, Key, Gauge,
  ExternalLink, CalendarDays, Rocket, Layers, Lightbulb, Target,
  Shirt, Globe, Code, PenTool, Sparkles, TrendingUp, Building2,
  Camera, FileText, Download, Smartphone, Package, Award, Star,
  BookOpen, MessageCircle, Mail, Phone, MapPin, Box, ChevronRight, User, CircleHelp,
} from 'lucide-react'

// Icons available by name (DB values, admin picker). Add more here as needed.
const ICONS = {
  Car, ShieldCheck, GraduationCap, Store, MonitorSmartphone, Monitor,
  Laptop, Palette, Printer, Megaphone, BriefcaseBusiness, Briefcase, UsersRound,
  Tag, CirclePlus, Ship, Wrench, Truck, Key, Gauge,
  ExternalLink, CalendarDays, Rocket, Layers, Lightbulb, Target,
  Shirt, Globe, Code, PenTool, Sparkles, TrendingUp, Building2,
  Camera, FileText, Download, Smartphone, Package, Award, Star,
  BookOpen, MessageCircle, Mail, Phone, MapPin, Box, ChevronRight, User, CircleHelp,
}

export const ICON_CHOICES = Object.keys(ICONS)

export function Icon({ name, ...props }) {
  const C = ICONS[name] || Box
  return <C aria-hidden="true" {...props} />
}

// WhatsApp glyph (brand icons are not in lucide).
export function WhatsAppIcon({ size = 22, ...props }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3.5 20.5l1.3-4.1A8.6 8.6 0 1 1 8 19.4l-4.5 1.1z" />
      <g transform="translate(7.3 7.1) scale(0.42)" strokeWidth="3.6">
        <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
      </g>
    </svg>
  )
}
