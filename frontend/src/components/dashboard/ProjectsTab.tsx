import { useState, useMemo, type ReactElement } from 'react'
import Icon from '../Icon'
import ShareButton from '../ShareButton'
import ProjectModal from './ProjectModal'
import { stripRichLinks } from '../../utils/richText'
import type { DbProject, DbSkill } from '../../types/database'
import type { ProjectFormData } from '../../hooks/useDashboardData'

interface ProjectsTabProps {
  projects: DbProject[]
  skills: DbSkill[]
  savingProject: boolean
  onSaveProject: (
    editingId: string | null,
    projectData: ProjectFormData,
    selectedSkills: string[],
    newCoverFile: File | null
  ) => Promise<boolean>
  onDeleteProject: (p: DbProject) => Promise<boolean>
}

export default function ProjectsTab({
  projects,
  skills,
  savingProject,
  onSaveProject,
  onDeleteProject,
}: ProjectsTabProps): ReactElement {
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [editingProject, setEditingProject] = useState<DbProject | null>(null)

  // Filtres & Recherche
  const [search, setSearch] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const openCreate = (): void => {
    setEditingProject(null)
    setModalOpen(true)
  }

  const openEdit = (p: DbProject): void => {
    setEditingProject(p)
    setModalOpen(true)
  }

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        p.title.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.skills.some((s) => s.toLowerCase().includes(q))
      )
    })
  }, [projects, categoryFilter, statusFilter, search])

  return (
    <div className="space-y-6">
      {/* En-tête de section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Gestion des Projets
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Ajoutez, filtrez et organisez vos réalisations web.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs font-mono transition-all cursor-pointer shadow-md shadow-indigo-600/20"
        >
          <Icon name="plus" className="size-4" />
          <span>Nouveau Projet</span>
        </button>
      </div>

      {/* Barre de Filtres & Recherche */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Recherche */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre, techno..."
            className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none font-mono"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtres Catégorie & Statut */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Catégorie */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-mono focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">Toutes Catégories</option>
            <option value="Full-Stack">Full-Stack</option>
            <option value="Frontend">Frontend</option>
            <option value="APIs">APIs</option>
          </select>

          {/* Statut */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-mono focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">Tous Statuts</option>
            <option value="completed">Terminés</option>
            <option value="in_progress">En cours</option>
          </select>
        </div>
      </div>

      {/* Grille des Projets */}
      {filteredProjects.length === 0 ? (
        <div className="glass-card p-12 text-center border-zinc-200 dark:border-zinc-800">
          <p className="text-xs font-mono text-zinc-500">
            Aucun projet ne correspond aux critères de recherche.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="glass-card p-5 border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-4 transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                        p.status === 'in_progress'
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {p.status === 'in_progress' ? 'En cours' : 'Terminé'}
                    </span>
                    {p.is_featured && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                        ★ À la une
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                    #{p.display_order}
                  </span>
                </div>

                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  {p.title}
                </h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono mb-2">
                  {p.tagline}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                  {stripRichLinks(p.summary)}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {p.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] font-mono text-zinc-700 dark:text-zinc-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800/60 mt-2">
                <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                  {p.category}
                </span>
                <div className="flex items-center gap-2">
                  <ShareButton
                    adminOnly={false}
                    compact
                    label="Partager"
                    item={{
                      kind: 'project',
                      id: p.id,
                      slug: p.slug,
                      title: p.title,
                      subtitle: p.tagline,
                      description: p.summary || p.description,
                      badge: p.is_featured ? 'À la une' : p.category,
                      secondaryBadge: p.status === 'in_progress' ? 'En cours' : undefined,
                      imageUrl: p.cover_image_url || p.images?.[0],
                      metaItems: (p.skills ?? []).slice(0, 4),
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-zinc-200 dark:border-zinc-800 text-xs transition-colors cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-xs transition-colors cursor-pointer"
                    title="Modifier le projet"
                  >
                    <Icon name="pencil" className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteProject(p)}
                    className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 border border-zinc-200 dark:border-zinc-800 text-xs transition-colors cursor-pointer"
                    title="Supprimer le projet"
                  >
                    <Icon name="trash" className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Projet */}
      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingProject={editingProject}
        skills={skills}
        saving={savingProject}
        onSave={onSaveProject}
      />
    </div>
  )
}
