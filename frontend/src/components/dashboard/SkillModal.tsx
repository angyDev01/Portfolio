import { useState, useEffect, type FormEvent, type ReactElement } from 'react'
import type { DbSkill, SkillCategoryType } from '../../types/database'

interface SkillModalProps {
  isOpen: boolean
  onClose: () => void
  editingSkill: DbSkill | null
  onSave: (
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
}

export default function SkillModal({
  isOpen,
  onClose,
  editingSkill,
  onSave,
}: SkillModalProps): ReactElement | null {
  const [form, setForm] = useState<{
    name: string
    category: SkillCategoryType
    icon: string
    description: string
    display_order: number
    is_featured: boolean
  }>({
    name: '',
    category: 'frontend',
    icon: 'code',
    description: '',
    display_order: 0,
    is_featured: false,
  })

  useEffect(() => {
    if (editingSkill) {
      setForm({
        name: editingSkill.name,
        category: editingSkill.category,
        icon: editingSkill.icon,
        description: editingSkill.description || '',
        display_order: editingSkill.display_order,
        is_featured: editingSkill.is_featured,
      })
    } else {
      setForm({
        name: '',
        category: 'frontend',
        icon: 'code',
        description: '',
        display_order: 0,
        is_featured: false,
      })
    }
  }, [editingSkill, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    const success = await onSave(
      editingSkill ? editingSkill.id : null,
      {
        name: form.name,
        category: form.category,
        icon: form.icon,
        description: form.description,
        display_order: form.display_order,
        is_featured: form.is_featured,
      }
    )

    if (success) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="glass-card max-w-md w-full p-6 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {editingSkill ? 'Modifier la compétence' : 'Ajouter une compétence'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
              Nom *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                Catégorie
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value.toLowerCase().trim() as SkillCategoryType,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="tools">Outils & Méthodes</option>
                <option value="database">Base de données</option>
                <option value="devops">DevOps / Cloud</option>
                <option value="mobile">Mobile</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                Nom Icône
              </label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="code, frontend..."
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                Ordre
              </label>
              <input
                type="number"
                value={form.display_order}
                onChange={(e) =>
                  setForm({
                    ...form,
                    display_order: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                  className="size-4 rounded accent-indigo-600"
                />
                <span>À la une</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
              Description (optionnelle)
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brève description..."
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-mono cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-semibold cursor-pointer shadow-md shadow-indigo-600/20"
            >
              {editingSkill ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
