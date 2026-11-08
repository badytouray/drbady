import { createContext, useContext, useEffect, useState } from 'react'
import { getSettings, listPublic } from './api'
import { seedSettings, seedProducts, seedServices } from './seed'

const DataContext = createContext(null)

// Settings, products and services are small and used on almost every page,
// so they load once at start-up. Seed data renders instantly meanwhile.
export function DataProvider({ children }) {
  const [state, setState] = useState({
    settings: seedSettings,
    products: seedProducts,
    services: seedServices,
    loading: true,
  })

  useEffect(() => {
    Promise.all([getSettings(), listPublic('products'), listPublic('services')]).then(
      ([settings, products, services]) => setState({ settings, products, services, loading: false }),
    )
  }, [])

  return <DataContext.Provider value={state}>{children}</DataContext.Provider>
}

export const useData = () => useContext(DataContext)

/** Load any public table on demand (academy, faqs). */
export function usePublicList(table) {
  const [rows, setRows] = useState(null)
  useEffect(() => {
    let alive = true
    listPublic(table).then((d) => alive && setRows(d))
    return () => { alive = false }
  }, [table])
  return rows
}
