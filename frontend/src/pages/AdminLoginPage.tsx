import { useState, useEffect, type FormEvent, type ReactElement } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import Icon from '../components/Icon'

const INPUT_CLASS =
  'w-full min-h-[44px] px-3.5 py-2.5 rounded-md bg-paper border border-line text-ink text-base sm:text-sm focus:border-indigo focus:ring-2 focus:ring-indigo/20 placeholder:text-muted transition-colors'

export default function AdminLoginPage(): ReactElement {
  const navigate = useNavigate()
  const [email, setEmail] = useState<string>(() =>
    import.meta.env.DEV ? (import.meta.env.VITE_DEV_ADMIN_EMAIL ?? '') : ''
  )
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>('')

  // Rediriger automatiquement vers /admin si déjà connecté
  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session) {
        navigate('/admin', { replace: true })
      }
    })
    return () => {
      mounted = false
    }
  }, [navigate])

  const handleLogin = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    if (!isSupabaseConfigured) {
      setLoading(false)
      setErrorMsg(
        'Configuration d’authentification introuvable. Veuillez vérifier vos paramètres d’accès.'
      )
      return
    }

    const loginEmail = email.trim()
    if (!loginEmail || !password.trim()) {
      setLoading(false)
      setErrorMsg('Veuillez renseigner votre email et votre mot de passe.')
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password.trim(),
      })

      if (error) {
        const lowerMsg = error.message.toLowerCase()
        if (
          lowerMsg.includes('invalid api key') ||
          lowerMsg.includes('api key') ||
          lowerMsg.includes('apikey') ||
          (error.status === 401 && lowerMsg.includes('jwt'))
        ) {
          setErrorMsg('Erreur de configuration du service d’authentification.')
        } else if (lowerMsg.includes('invalid login credentials')) {
          setErrorMsg('Identifiants incorrects ou compte non autorisé.')
        } else {
          setErrorMsg(error.message)
        }
        return
      }

      if (data.session) {
        navigate('/admin', { replace: true })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inattendue de connexion'
      setErrorMsg(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper text-muted flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-sm">
        <div className="bg-surface border border-line rounded-xl p-7 sm:p-8 text-center transition-colors">
          <div className="size-11 rounded-md border border-line bg-paper text-indigo flex items-center justify-center mx-auto mb-4">
            <Icon name="shield" className="size-5" />
          </div>

          <p className="text-xs font-mono text-indigo mb-1.5">
            Espace d&apos;administration
          </p>
          <h1 className="text-2xl font-bold tracking-[-0.025em] text-ink mb-2">
            Connexion
          </h1>
          <p className="text-xs text-muted mb-6 leading-relaxed">
            Accès sécurisé pour la gestion des projets, compétences et messages.
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-medium text-ink mb-1.5">
                Adresse email
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@domaine.com"
                autoComplete="email"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-medium text-ink mb-1.5"
              >
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className={`${INPUT_CLASS} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn-tactile absolute inset-y-0 right-0 flex w-11 min-h-[44px] items-center justify-center text-muted hover:text-ink transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-pressed={showPassword}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} className="size-4" />
                </button>
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="p-3.5 rounded-md border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs flex items-start gap-2"
              >
                <Icon name="alert" className="size-3.5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-tactile mt-2 w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-indigo hover:bg-indigo-hover text-indigo-fg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Connexion en cours...' : 'Accéder au tableau de bord'}</span>
              <Icon name="arrowRight" className="size-4" />
            </button>

            <div className="mt-2 text-center">
              <Link
                to="/"
                className="btn-tactile inline-flex items-center justify-center min-h-[44px] px-2 text-xs font-medium text-muted hover:text-ink transition-colors"
              >
                ← Retour au site
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
