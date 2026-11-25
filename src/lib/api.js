import { supabase, hasSupabase } from './supabase'
import {
  seedSettings, seedProducts, seedServices, seedPrograms, seedFaqs,
  seedPageSeo, seedBlogCategories, seedBlogPosts,
} from './seed'

const seeds = {
  products: seedProducts,
  services: seedServices,
  academy_programs: seedPrograms,
  faqs: seedFaqs,
  blog_categories: seedBlogCategories,
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

/** Per-page SEO rows for fixed pages (/, /about, /blog …). */
export async function getPageSeo() {
  if (!hasSupabase) return seedPageSeo
  const { data, error } = await supabase.from('page_seo').select('*').order('sort_order')
  if (error || !data?.length) return seedPageSeo
  return data
}

// ---------- Blog ----------
const POST_CARD = 'id,slug,title,excerpt,cover_image,cover_alt,author_name,category_id,tags,featured,reading_minutes,published_at,updated_at'
const livePost = (p) => p.published && new Date(p.published_at) <= new Date()

/**
 * Published posts, newest first.
 * opts: { category (id), tag, q, page (1-based), perPage }
 * Returns { posts, total }.
 */
export async function listPosts({ category, tag, q, page = 1, perPage = 9 } = {}) {
  const from = (page - 1) * perPage
  if (!hasSupabase) {
    let all = seedBlogPosts.filter(livePost)
    if (category) all = all.filter((p) => p.category_id === category)
    if (tag) all = all.filter((p) => p.tags?.includes(tag))
    if (q) all = all.filter((p) => (p.title + ' ' + p.excerpt).toLowerCase().includes(q.toLowerCase()))
    return { posts: all.slice(from, from + perPage), total: all.length }
  }
  let query = supabase
    .from('blog_posts')
    .select(POST_CARD, { count: 'exact' })
    .eq('published', true)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .range(from, from + perPage - 1)
  if (category) query = query.eq('category_id', category)
  if (tag) query = query.contains('tags', [tag])
  if (q) {
    const term = q.replace(/[%,()]/g, ' ').trim()
    if (term) query = query.or(`title.ilike.%${term}%,excerpt.ilike.%${term}%`)
  }
  const { data, error, count } = await query
  if (error) {
    console.warn('[blog_posts]', error.message)
    return { posts: [], total: 0 }
  }
  return { posts: data, total: count ?? data.length }
}

export async function getPost(slug) {
  if (!hasSupabase) return seedBlogPosts.find((p) => p.slug === slug && livePost(p)) || null
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .lte('published_at', new Date().toISOString())
    .maybeSingle()
  if (error) console.warn('[blog_posts]', error.message)
  return data || null
}

/** Related: same category first, then latest. */
export async function relatedPosts(post, limit = 3) {
  const { posts: same } = await listPosts({ category: post.category_id, perPage: limit + 1 })
  let list = same.filter((p) => p.id !== post.id)
  if (list.length < limit) {
    const { posts: latest } = await listPosts({ perPage: limit + 4 })
    for (const p of latest) if (p.id !== post.id && !list.some((x) => x.id === p.id)) list.push(p)
  }
  return list.slice(0, limit)
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

export async function adminSavePageSeo(row) {
  const { updated_at: _u, ...rest } = row
  const { error } = await supabase.from('page_seo').upsert(rest)
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
