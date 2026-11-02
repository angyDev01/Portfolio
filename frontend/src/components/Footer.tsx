import type { ReactElement } from 'react'
import { portfolioData } from '../data/portfolioData'
import Icon from './Icon'

const { socials, footer, ui } = portfolioData

export default function Footer(): ReactElement {
  return (
    <footer className="border-t border-zinc-900 py-10 bg-zinc-950">
      <div className="container-custom flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-mono text-zinc-400">{footer.copyright}</p>
          <p className="text-[11px] text-zinc-400 font-mono">{footer.builtWith}</p>
        </div>

        <nav aria-label={ui.socialsTitle}>
          <ul className="flex items-center gap-3">
            {socials.map((social) => (
              <li key={social.name}>
                <a
                  href={social.href}
                  target={social.external ? '_blank' : undefined}
                  rel={social.external ? 'noopener noreferrer' : undefined}
                  className="flex size-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 hover:bg-zinc-800/60 motion-safe:hover:-translate-y-0.5 transition-all duration-200"
                  aria-label={social.external ? `${social.label} ${ui.newTab}` : social.label}
                >
                  <Icon name={social.icon} className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  )
}
