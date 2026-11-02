import { useEffect, useState, type ReactElement } from 'react'
import { portfolioService } from '../services/portfolioService'
import type { DbProfile } from '../types/database'
import Icon from './Icon'

export default function Footer(): ReactElement {
  const [profile, setProfile] = useState<DbProfile | null>(null)

  useEffect(() => {
    let mounted = true
    portfolioService.getProfile().then((data) => {
      if (mounted) setProfile(data)
    })
    return () => {
      mounted = false
    }
  }, [])

  const name = profile?.name || 'Yao Jean Angoa'
  const alias = profile?.alias || 'Angy'
  const github = profile?.github_url || 'https://github.com/angyDev01'
  const linkedin = profile?.linkedin_url || 'https://linkedin.com/in/angydev'
  const email = profile?.email || 'contact@angy.dev'

  return (
    <footer className="border-t border-zinc-900 py-10 bg-zinc-950">
      <div className="container-custom flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-mono text-zinc-400">
            © {new Date().getFullYear()} {name} ({alias}). Tous droits réservés.
          </p>
          <p className="text-[11px] text-zinc-500 font-mono">
            Conçu avec React, Vite, TypeScript, Tailwind CSS & Supabase.
          </p>
        </div>

        <nav aria-label="Réseaux sociaux">
          <ul className="flex items-center gap-3">
            <li>
              <a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 hover:bg-zinc-800/60 motion-safe:hover:-translate-y-0.5 transition-all duration-200"
                aria-label="GitHub (nouvel onglet)"
              >
                <Icon name="github" className="size-4" />
              </a>
            </li>
            <li>
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 hover:bg-zinc-800/60 motion-safe:hover:-translate-y-0.5 transition-all duration-200"
                aria-label="LinkedIn (nouvel onglet)"
              >
                <Icon name="linkedin" className="size-4" />
              </a>
            </li>
            <li>
              <a
                href={`mailto:${email}`}
                className="flex size-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 hover:bg-zinc-800/60 motion-safe:hover:-translate-y-0.5 transition-all duration-200"
                aria-label="Email"
              >
                <Icon name="mail" className="size-4" />
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}
