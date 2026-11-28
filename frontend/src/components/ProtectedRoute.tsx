import { useEffect, useState, type ReactElement } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { portfolioService } from '../services/portfolioService'
import type { Session } from '@supabase/supabase-js'

interface ProtectedRouteProps {
  children?: ReactElement
}

export default function ProtectedRoute({ children }: ProtectedRouteProps): ReactElement {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let mounted = true

    portfolioService.getSession().then((initialSession) => {
      if (mounted) {
        setSession(initialSession)
        setLoading(false)
      }
    })

    const subscription = portfolioService.onAuthStateChange((currentSession) => {
      if (mounted) {
        setSession(currentSession)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center transition-colors">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-2 border-indigo border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-muted">Vérification des autorisations...</p>
        </div>
      </div>
    )
  }

  // Redirection automatique vers / en cas d'accès non autorisé
  if (!session) {
    return <Navigate to="/" replace />
  }

  return children ? children : <Outlet />
}

