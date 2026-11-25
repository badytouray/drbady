import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Tags injected by the server for crawlers (api/render.js) are replaced by
// the <Seo> component once React renders, so drop them to avoid duplicates.
document.querySelectorAll('head [data-ssr]').forEach((n) => n.remove())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
