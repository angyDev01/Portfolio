import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'

export default function HomeContactBanner(): ReactElement {
  return (
    <section id="contact-invitation" className="py-20 border-t border-zinc-200 dark:border-zinc-900 relative isolate overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-500/5 dark:from-indigo-950/20 via-transparent to-transparent -z-10"
        aria-hidden="true"
      />

      <div className="container-custom">
        <div className="glass-card p-8 sm:p-12 text-center max-w-3xl mx-auto flex flex-col items-center relative overflow-hidden">
          <div className="size-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-5">
            <Icon name="mail" className="size-5" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-3">
            Un projet en tête ou une opportunité ?
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed mb-8">
            Disponible immédiatement pour concevoir ou renforcer vos applications web avec rigueur, performance et créativité.
          </p>

          <Link
            to="/contact"
            className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold text-sm dark:hover:bg-white hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-200 cursor-pointer"
          >
            <span>Prendre contact</span>
            <Icon name="arrowRight" className="size-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}

