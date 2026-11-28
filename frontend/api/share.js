const DEFAULT_SITE_ORIGIN = 'https://portfolio-vs28.vercel.app'
const DEFAULT_SUPABASE_URL = 'https://bemwrrgnquvnuuxjghhm.supabase.co'
const DEFAULT_SUPABASE_KEY = 'sb_publishable_SpSllH6khfzhvjIceQPOZA_WPlckQAV'
const PWA_ICON_PATH = '/pwa-512x512.png'

const SLUG_RE = /^[a-z0-9][a-z0-9-_]{0,120}$/i
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const KIND_LABELS = {
  project_wip: 'Projet en cours',
  event: 'Événement à venir',
  news: 'Actualité',
}

function resolveSiteOrigin(req) {
  const configured = process.env.SITE_URL?.trim()
  if (configured && /^https?:\/\//i.test(configured)) {
    return configured.replace(/\/+$/, '')
  }
  const rawProto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim()
  const proto = rawProto === 'http' ? 'http' : 'https'
  const rawHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim()
  if (rawHost && /^[a-z0-9.-]+(?::\d+)?$/i.test(rawHost)) {
    return `${proto}://${rawHost}`
  }
  return DEFAULT_SITE_ORIGIN
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function truncateText(text, maxLen = 190) {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim()
  if (clean.length <= maxLen) return clean
  return `${clean.slice(0, maxLen - 1).trimEnd()}…`
}

function stripHash(url) {
  if (!url || typeof url !== 'string') return ''
  return (url.split('#')[0] || '').trim()
}

function sanitizeImageUrl(rawUrl, siteOrigin) {
  const fallback = `${siteOrigin}${PWA_ICON_PATH}`
  const clean = stripHash(rawUrl)
  if (!clean) return { url: fallback, isFallback: true }

  if (clean.startsWith('/') && !clean.startsWith('//')) {
    const resolved = `${siteOrigin}${clean}`
    return { url: resolved, isFallback: clean === PWA_ICON_PATH }
  }

  try {
    const parsed = new URL(clean)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return { url: parsed.toString(), isFallback: false }
    }
  } catch {
    return { url: fallback, isFallback: true }
  }

  return { url: fallback, isFallback: true }
}

function inferImageMeta(imageUrl, siteOrigin, isCover) {
  const fallbackIcon = `${siteOrigin}${PWA_ICON_PATH}`
  if (imageUrl === fallbackIcon) {
    return { mimeType: 'image/png', width: 512, height: 512 }
  }

  let pathname = ''
  try {
    pathname = new URL(imageUrl).pathname.toLowerCase()
  } catch {
    pathname = String(imageUrl || '').split(/[?#]/)[0].toLowerCase()
  }

  let mimeType = 'image/jpeg'
  if (pathname.endsWith('.png')) mimeType = 'image/png'
  else if (pathname.endsWith('.webp')) mimeType = 'image/webp'
  else if (pathname.endsWith('.avif')) mimeType = 'image/avif'
  else if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) mimeType = 'image/jpeg'

  if (isCover) {
    return { mimeType, width: 1280, height: 720 }
  }

  return { mimeType, width: 512, height: 512 }
}

async function querySupabase(supabaseUrl, supabaseKey, path) {
  if (!supabaseUrl || !supabaseKey) return null
  try {
    const response = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/rest/v1/${path}`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/json',
      },
    })
    if (!response.ok) return null
    const data = await response.json()
    return Array.isArray(data) ? data : null
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  const siteOrigin = resolveSiteOrigin(req)
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL
  const supabaseKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_KEY

  const rawType = Array.isArray(req.query?.type) ? req.query.type[0] : req.query?.type
  const rawId = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id
  const type = String(rawType || 'profile').trim()
  const id = String(rawId || '').trim()

  let title = 'Yao Jean Angoa (Angy) | Développeur Full-Stack Web'
  let description =
    "Portfolio de Yao Jean Angoa (Angy), développeur Full-Stack Web. Conception d'applications web réactives, robustes et centrées utilisateur."
  let imageUrl = `${siteOrigin}${PWA_ICON_PATH}`
  let isCover = false
  let redirectUrl = `${siteOrigin}/`
  let ogUrl = `${siteOrigin}/s/profil`
  let ogType = 'website'

  if (type === 'project' && SLUG_RE.test(id)) {
    const rows = await querySupabase(
      supabaseUrl,
      supabaseKey,
      `projects?select=slug,title,tagline,summary,description,cover_image_url,images,status,is_featured&slug=eq.${encodeURIComponent(id)}&limit=1`
    )
    const project = rows?.[0]
    if (project) {
      const prefix = project.is_featured
        ? 'À la une · '
        : project.status === 'in_progress'
          ? 'En cours · '
          : ''
      title = `${prefix}${project.title} — Yao Jean Angoa (Angy)`
      description = truncateText(
        project.summary || project.tagline || project.description || description
      )
      const projectCover =
        project.cover_image_url || (Array.isArray(project.images) && project.images[0]) || null
      const resolved = sanitizeImageUrl(projectCover, siteOrigin)
      imageUrl = resolved.url
      isCover = !resolved.isFallback
      redirectUrl = `${siteOrigin}/projets?projet=${encodeURIComponent(project.slug)}`
      ogUrl = `${siteOrigin}/s/projet/${encodeURIComponent(project.slug)}`
      ogType = 'article'
    } else {
      redirectUrl = `${siteOrigin}/projets`
      ogUrl = redirectUrl
    }
  } else if (type === 'announcement' && UUID_RE.test(id)) {
    const rows = await querySupabase(
      supabaseUrl,
      supabaseKey,
      `announcements?select=id,title,kind,content,cover_image_url,event_date&id=eq.${encodeURIComponent(id)}&is_published=eq.true&limit=1`
    )
    const ann = rows?.[0]
    if (ann) {
      const kindLabel = KIND_LABELS[ann.kind] || 'Actualité'
      title = `${ann.title} · ${kindLabel} — Angy`
      description = truncateText(ann.content || description)
      const resolved = sanitizeImageUrl(ann.cover_image_url, siteOrigin)
      imageUrl = resolved.url
      isCover = !resolved.isFallback
      redirectUrl = `${siteOrigin}/actualites?annonce=${encodeURIComponent(ann.id)}`
      ogUrl = `${siteOrigin}/s/actualite/${encodeURIComponent(ann.id)}`
      ogType = 'article'
    } else {
      redirectUrl = `${siteOrigin}/actualites`
      ogUrl = redirectUrl
    }
  } else if (type === 'poll' && UUID_RE.test(id)) {
    const [pollRows, profileRows] = await Promise.all([
      querySupabase(
        supabaseUrl,
        supabaseKey,
        `polls?select=id,question,description,is_active&id=eq.${encodeURIComponent(id)}&limit=1`
      ),
      querySupabase(
        supabaseUrl,
        supabaseKey,
        'profile?select=name,alias,avatar_url&order=created_at.desc&limit=1'
      ),
    ])
    const poll = pollRows?.[0]
    const profile = profileRows?.[0]
    if (poll) {
      title = `Sondage : ${poll.question} — ${profile?.alias || 'Angy'}`
      description = truncateText(
        poll.description || 'Participez au sondage en cours sur le portfolio de Yao Jean Angoa.'
      )
      const resolved = sanitizeImageUrl(profile?.avatar_url, siteOrigin)
      imageUrl = resolved.url
      redirectUrl = `${siteOrigin}/actualites?sondage=${encodeURIComponent(poll.id)}`
      ogUrl = `${siteOrigin}/s/sondage/${encodeURIComponent(poll.id)}`
      ogType = 'website'
    } else {
      redirectUrl = `${siteOrigin}/actualites`
      ogUrl = redirectUrl
    }
  } else {
    const profileRows = await querySupabase(
      supabaseUrl,
      supabaseKey,
      'profile?select=name,alias,role,short_bio,avatar_url,banner_url&order=created_at.desc&limit=1'
    )
    const profile = profileRows?.[0]
    if (profile) {
      const fullName = profile.name || 'Yao Jean Angoa'
      const alias = profile.alias || 'Angy'
      const role = profile.role || 'Développeur Full-Stack Web'
      title = `${fullName} (${alias}) | ${role}`
      description = truncateText(profile.short_bio || description)
      const resolved = sanitizeImageUrl(profile.avatar_url || profile.banner_url, siteOrigin)
      imageUrl = resolved.url
      isCover = !profile.avatar_url && Boolean(profile.banner_url) && !resolved.isFallback
    }
    redirectUrl = `${siteOrigin}/`
    ogUrl = `${siteOrigin}/s/profil`
  }

  const imageMeta = inferImageMeta(imageUrl, siteOrigin, isCover)
  const safeTitle = escapeHtml(title)
  const safeDescription = escapeHtml(description)
  const safeImage = escapeHtml(imageUrl)
  const safeOgUrl = escapeHtml(ogUrl)
  const safeRedirectAttr = escapeHtml(redirectUrl)
  const safeRedirectJs = JSON.stringify(redirectUrl).replace(/</g, '\\u003c')

  const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}" />
  <meta itemprop="name" content="${safeTitle}" />
  <meta itemprop="description" content="${safeDescription}" />
  <meta itemprop="image" content="${safeImage}" />
  <link itemprop="thumbnailUrl" href="${safeImage}" />
  <meta property="og:type" content="${ogType}" />
  <meta property="og:site_name" content="Portfolio de Yao Jean Angoa (Angy)" />
  <meta property="og:locale" content="fr_FR" />
  <meta property="og:url" content="${safeOgUrl}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDescription}" />
  <meta property="og:image" content="${safeImage}" />
  <meta property="og:image:url" content="${safeImage}" />
  <meta property="og:image:secure_url" content="${safeImage}" />
  <meta property="og:image:type" content="${imageMeta.mimeType}" />
  <meta property="og:image:width" content="${imageMeta.width}" />
  <meta property="og:image:height" content="${imageMeta.height}" />
  <meta property="og:image:alt" content="${safeTitle}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDescription}" />
  <meta name="twitter:image" content="${safeImage}" />
  <link rel="canonical" href="${safeRedirectAttr}" />
  <script>window.location.replace(${safeRedirectJs});</script>
</head>
<body style="font-family:system-ui,sans-serif;background:#0E1615;color:#E3E9E6;padding:24px;">
  <p>Ouverture de <a href="${safeRedirectAttr}" style="color:#8F9BFF;">${safeTitle}</a>…</p>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600')
  res.status(200).send(html)
}
