import { useState, useMemo, type ReactElement } from 'react'
import Icon from '../Icon'
import SkillModal from './SkillModal'
import type { DbSkill, SkillCategoryType } from '../../types/database'

interface SkillsTabProps {
  skills: DbSkill[]
  onSaveSkill: (
    editingId: string | null,
    skillData: {
      name: string
      category: SkillCategoryType
      icon: string
      description?: string
      display_order: number
      is_featured: boolean
    }
  ) => Promise<boolean>
  onDeleteSkill: (s: DbSkill) => Promise<boolean>
}

export default function SkillsTab({
  skills,
  onSaveSkill,
  onDeleteSkill,
}: SkillsTabProps): ReactElement {
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [editingSkill, setEditingSkill] = useState<DbSkill | null>(null)

  const [search, setSearch] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const openCreate = (): void => {
    setEditingSkill(null)
    setModalOpen(true)
  }

  const openEdit = (s: DbSkill): void => {
    setEditingSkill(s)
    setModalOpen(true)
  }

  const filteredSkills = useMemo(() => {
    return skills.filter((s) => {
      if (selectedCategory !== 'all' && s.category !== selectedCategory) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
      )
    })
  }, [skills, selectedCategory, search])

  const categories = [
    { id: 'all', label: 'Toutes' },
    { id: 'frontend', label: 'Frontend' },
    { id: 'backend', label: 'Backend' },
    { id: 'database', label: 'Base de données' },
    { id: 'tools', label: 'Outils' },
    { id: 'devops', label: 'DevOps' },
  ]

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Gestion des Compétences
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Gérez votre stack technique, outils et technologies.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs font-mono transition-all cursor-pointer shadow-md shadow-indigo-600/20"
        >
          <Icon name="plus" className="size-4" />
          <span>Ajouter une compétence</span>
        </button>
      </div>

      {/* Filtres par Catégorie & Recherche */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Catégories (Pills) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-indigo-600 text-white font-medium shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Barre de recherche */}
        <div className="relative min-w-[180px] max-w-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une compétence..."
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
      </div>

      {/* Grille des compétences */}
      {filteredSkills.length === 0 ? (
        <div className="glass-card p-12 text-center border-zinc-200 dark:border-zinc-800">
          <p className="text-xs font-mono text-zinc-500">
            Aucune compétence ne correspond aux filtres.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredSkills.map((s) => (
            <div
              key={s.id}
              className="glass-card p-4 border-zinc-200 dark:border-zinc-800 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase">
                    {s.category}
                  </span>
                  {s.is_featured && (
                    <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                      ★ Star
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="code" className="size-4 text-indigo-500" />
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{s.name}</h4>
                </div>
                {s.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
                    {s.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800/60 mt-3">
                <button
                  type="button"
                  onClick={() => openEdit(s)}
                  className="p-1 rounded bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-xs transition-colors cursor-pointer"
                  title="Modifier la compétence"
                >
                  <Icon name="pencil" className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteSkill(s)}
                  className="p-1 rounded bg-zinc-100 dark:bg-zinc-900 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 border border-zinc-200 dark:border-zinc-800 text-xs transition-colors cursor-pointer"
                  title="Supprimer la compétence"
                >
                  <Icon name="trash" className="size-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Compétence */}
      <SkillModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingSkill={editingSkill}
        onSave={onSaveSkill}
      />
    </div>
  )
}
