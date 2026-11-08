import { supabase, hasSupabase } from './supabase'
import { seedSettings, seedProducts, seedServices, seedPrograms, seedFaqs } from './seed'

const seeds = {
  products: seedProducts,
  services: seedServices,
  academy_programs: seedPrograms,
  faqs: seedFaqs,
}

/** Public: published rows of a content table, ordered. Falls back to seed data. */
export async function listPublic(table) {
  if (!hasSupabase) return seeds[table] ?? []
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('published', true)
    .order('sort_order', { ascending: true })
  if (error) {
    console.warn(`[${table}]`, error.message)
    return seeds[table] ?? []
  }
  return data
}

export async function getSettings() {
  if (!hasSupabase) return seedSettings
  const { data, error } = await supabase.from('site_settings').select('data').eq('id', 1).maybeSingle()
  if (error || !data) return seedSettings
  return { ...seedSettings, ...data.data }
}

/** Public form submissions (bookings, academy_enrollments). */
export async function submit(table, payload) {
  if (!hasSupabase) {
    // Demo mode: pretend it worked so the UI flow can be tested.
    console.info(`[demo] ${table} submission`, payload)
    await new Promise((r) => setTimeout(r, 500))
    return
  }
  const { error } = await supabase.from(table).insert({ ...payload, status: 'new' })
  if (error) throw error
}

// ---------- Admin helpers ----------
export async function adminList(table, order = 'sort_order') {
  const asc = order === 'sort_order'
  const { data, error } = await supabase.from(table).select('*').order(order, { ascending: asc })
  if (error) throw error
  return data
}

export async function adminSave(table, row) {
  const { id, created_at: _c, ...rest } = row
  const q = id
    ? supabase.from(table).update(rest).eq('id', id).select().single()
    : supabase.from(table).insert(rest).select().single()
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function adminDelete(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}

export async function adminSaveSettings(data) {
  const { error } = await supabase
    .from('site_settings')
    .upsert({ id: 1, data, updated_at: new Date().toISOString() })
  if (error) throw error
}

export async function uploadImage(file) {
  const ext = file.name.split('.').pop()
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('media').upload(path, file, { cacheControl: '31536000' })
  if (error) throw error
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl
}

export function slugify(s = '') {
  return s.toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
