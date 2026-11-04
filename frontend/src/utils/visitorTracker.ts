import { supabase } from '../lib/supabase'

const VISITOR_ID_KEY = 'portfolio_visitor_id'
const LAST_VISIT_KEY = 'portfolio_last_visit_timestamp'
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

/**
 * Récupère ou génère un visitor_id anonyme et persistant
 */
export function getOrCreateVisitorId(): string {
  try {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY)
    if (!visitorId) {
      visitorId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : 'v_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
      localStorage.setItem(VISITOR_ID_KEY, visitorId)
    }
    return visitorId
  } catch {
    return 'anon_guest'
  }
}

/**
 * Enregistre une visite unique avec :
 * 1. Exclusion stricte de l'administrateur (session active ou route /admin)
 * 2. Vérification de l'intervalle de 24 heures (ou même journée)
 * 3. Appel de la RPC Supabase track_unique_visit
 */
export async function trackVisit(pagePath?: string): Promise<boolean> {
  const currentPath =
    pagePath || (typeof window !== 'undefined' ? window.location.pathname : '/')

  // 1. Exclusion de l'administrateur par la route
  if (currentPath.startsWith('/admin')) {
    return false
  }

  try {
    // 1b. Exclusion totale de l'administrateur authentifié sur Supabase
    const { data } = await supabase.auth.getSession()
    if (data?.session) {
      // L'administrateur navigue : interruption immédiate, aucune visite enregistrée
      return false
    }

    // 2. Gestion des visiteurs uniques & intervalle de 24h
    const now = Date.now()
    const lastVisitStr = localStorage.getItem(LAST_VISIT_KEY)

    if (lastVisitStr) {
      const lastVisitTime = parseInt(lastVisitStr, 10)
      if (!isNaN(lastVisitTime)) {
        // Moins de 24 heures depuis le dernier enregistrement
        if (now - lastVisitTime < TWENTY_FOUR_HOURS_MS) {
          return false
        }

        // Même date calendaire (même journée)
        const lastDate = new Date(lastVisitTime).toDateString()
        const todayDate = new Date(now).toDateString()
        if (lastDate === todayDate) {
          return false
        }
      }
    }

    const visitorId = getOrCreateVisitorId()

    // 3. Appel de la fonction RPC Supabase sécurisée
    const { error } = await supabase.rpc('track_unique_visit', {
      p_visitor_id: visitorId,
      p_page_path: currentPath,
    })

    if (!error) {
      localStorage.setItem(LAST_VISIT_KEY, now.toString())
      return true
    } else {
      // Fallback si la fonction RPC n'a pas encore été migrée
      const { error: insertError } = await supabase.from('page_views').insert([
        {
          visitor_id: visitorId,
          page_path: currentPath,
        },
      ])
      if (!insertError) {
        localStorage.setItem(LAST_VISIT_KEY, now.toString())
        return true
      }
    }
  } catch (err) {
    // Ne jamais bloquer le chargement initial en cas d'erreur réseau
    console.debug('Visitor tracker silent error:', err)
  }

  return false
}
