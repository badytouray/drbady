import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation, Link } from 'react-router-dom'
import { DataProvider } from './lib/DataContext'
import { useIsMobile } from './lib/hooks'
import Header from './components/Header'
import CtaBand from './components/CtaBand'
import MobileShell, { Splash, Sheet } from './components/MobileShell'
import Home from './pages/Home'
import { ProductsPage, ProductDetail } from './pages/Products'
import { ServicesPage, ServiceDetail } from './pages/Services'
import Academy from './pages/Academy'
import { About, Contact, Faqs, More } from './pages/Info'

const AdminApp = lazy(() => import('./admin/AdminApp'))

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function NotFound() {
  return (
    <Sheet title="Page not found">
      <p className="m-lead">That page doesn't exist. <Link to="/">Go home</Link>.</p>
    </Sheet>
  )
}

function SiteRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/products/:slug" element={<ProductDetail />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/services/:slug" element={<ServiceDetail />} />
      <Route path="/academy" element={<Academy />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact title="Contact" />} />
      <Route path="/book" element={<Contact title="Book a Chat" />} />
      <Route path="/faqs" element={<Faqs />} />
      <Route path="/more" element={<More />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function PublicSite() {
  const isMobile = useIsMobile()
  if (isMobile)
    return (
      <>
        <Splash />
        <MobileShell><SiteRoutes /></MobileShell>
      </>
    )
  return (
    <div className="site">
      <Header />
      <main><SiteRoutes /></main>
      <CtaBand />
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <Routes>
        <Route path="/admin/*" element={<Suspense fallback={null}><AdminApp /></Suspense>} />
        <Route path="*" element={<DataProvider><PublicSite /></DataProvider>} />
      </Routes>
    </>
  )
}
