import { useEffect, useState } from 'react'

const QUERY = '(max-width: 820px)'

export function useIsMobile() {
  const [m, setM] = useState(() => window.matchMedia(QUERY).matches)
  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const on = () => setM(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return m
}

export const waLink = (number, text = '') =>
  `https://wa.me/${String(number || '').replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`

export const isExternal = (url = '') => /^https?:\/\//.test(url)
