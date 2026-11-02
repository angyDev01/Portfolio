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
        'Vérifiez vos clés VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY dans le fichier .env et redémarrez le serveur (npm run dev).'
      )
      return
    }

    if (!email.trim() || !password.trim()) {
      setLoading(false)
      setErrorMsg('Veuillez renseigner votre email et votre mot de passe.')
      return
    }

    // Normalisation si faute de frappe (@mail.com au lieu de @gmail.com)
    let loginEmail = email.trim()
    if (loginEmail.toLowerCase() === 'yaojeanangoa@mail.com') {
      loginEmail = 'yaojeanangoa@gmail.com'
    }

    try {
      // Appel standard Supabase Auth
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
          setErrorMsg(
            'Vérifiez vos clés VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY dans le fichier .env et redémarrez le serveur (npm run dev).'
          )
        } else if (lowerMsg.includes('invalid login credentials')) {
          setErrorMsg(
            "Email ou mot de passe incorrect (Assurez-vous d'avoir créé votre compte dans Supabase > Authentication > Users)."
          )
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
      if (message.toLowerCase().includes('api key')) {
        setErrorMsg(
          'Vérifiez vos clés VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY dans le fichier .env et redémarrez le serveur (npm run dev).'
        )
      } else {
        setErrorMsg(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-card p-8 text-center border-zinc-800 shadow-2xl relative overflow-hidden">
          {/* Halo d'ambiance discret */}
          <div
            className="pointer-events-none absolute -top-12 -right-12 size-36 bg-indigo-500/10 rounded-full blur-2xl"
            aria-hidden="true"
          />

          <div className="size-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Icon name="shield" className="size-6" />
          </div>

          <p className="text-xs font-mono font-medium text-indigo-400 uppercase tracking-widest mb-1">
            Espace Protégé
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 mb-2">
            Connexion Administrateur
          </h1>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            Authentification Supabase requise pour accéder au tableau de bord de gestion.
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-mono text-zinc-300 mb-1.5">
                Email administrateur
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yaojeanangoa@gmail.com"
                autoComplete="email"
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm focus:border-indigo-400 focus:outline-none placeholder:text-zinc-600 font-sans"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-mono text-zinc-300 mb-1.5"
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
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-zinc-100 text-sm focus:border-indigo-400 focus:outline-none placeholder:text-zinc-600 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} className="size-4" />
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono flex items-start gap-2 leading-relaxed">
                <Icon name="alert" className="size-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-500/20"
            >
              <span>{loading ? 'Connexion en cours...' : 'Accéder au Dashboard'}</span>
              <Icon name="arrowRight" className="size-4" />
            </button>

            <div className="mt-4 text-center">
              <Link
                to="/"
                className="text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                ← Retour au site public
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
