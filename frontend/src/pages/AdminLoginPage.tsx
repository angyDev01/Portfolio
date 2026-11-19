import { useState, useEffect, type FormEvent, type ReactElement } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import Icon from '../components/Icon'

export default function AdminLoginPage(): ReactElement {
  const navigate = useNavigate()
  const [email, setEmail] = useState<string>('yaojeanangoa@gmail.com')
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

    if (!email.trim() || !password.trim()) {
      setLoading(false)
      setErrorMsg('Veuillez renseigner votre email et votre mot de passe.')
      return
    }

    let loginEmail = email.trim()
    if (loginEmail.toLowerCase() === 'yaojeanangoa@mail.com') {
      loginEmail = 'yaojeanangoa@gmail.com'
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center shadow-xl">
          <div className="size-11 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200 flex items-center justify-center mx-auto mb-4">
            <Icon name="shield" className="size-5 text-blue-600 dark:text-blue-400" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1.5">
            Espace d'Administration
          </p>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">
            Connexion
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
            Accès sécurisé pour la gestion des projets, compétences et messages.
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Adresse email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yaojeanangoa@gmail.com"
                autoComplete="email"
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm focus:border-blue-500 focus:outline-none placeholder:text-zinc-400"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm focus:border-blue-500 focus:outline-none placeholder:text-zinc-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn-tactile absolute right-3 top-3 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} className="size-4" />
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                <Icon name="alert" className="size-3.5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-tactile mt-2 w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Connexion en cours...' : 'Accéder au tableau de bord'}</span>
              <Icon name="arrowRight" className="size-4" />
            </button>

            <div className="mt-4 text-center">
              <Link
                to="/"
                className="btn-tactile text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
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
