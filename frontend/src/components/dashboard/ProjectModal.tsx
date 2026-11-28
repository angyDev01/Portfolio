import { useState, useEffect, type FormEvent, type ReactElement } from 'react'
import Icon from '../Icon'
import type { DbProject, DbSkill, ProjectStatusType, ProjectCategoryType } from '../../types/database'
import type { ProjectFormData } from '../../hooks/useDashboardData'

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  editingProject: DbProject | null
  skills: DbSkill[]
  saving: boolean
  onSave: (
    editingId: string | null,
    projectData: ProjectFormData,
    selectedSkills: string[],
    newCoverFile: File | null
  ) => Promise<boolean>
}

export default function ProjectModal({
  isOpen,
  onClose,
  editingProject,
  skills,
  saving,
  onSave,
}: ProjectModalProps): ReactElement | null {
  const [form, setForm] = useState({
    title: '',
    slug: '',
    tagline: '',
    category: 'Full-Stack' as ProjectCategoryType,
    status: 'completed' as ProjectStatusType,
    summary: '',
    description: '',
    demo_url: '',
    repo_url: '',
    is_featured: false,
    display_order: 0,
    selectedSkills: [] as string[],
  })

  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  useEffect(() => {
    if (editingProject) {
      const existingCover =
        editingProject.cover_image_url ||
        (editingProject.images && editingProject.images[0]) ||
        ''
      setCoverPreview(existingCover || null)
      setCoverFile(null)

      // Résolution des noms de compétences vers leurs UUID (project_skills.skill_id)
      const resolvedSkillIds = editingProject.skills
        .map((skillRef) => {
          const byId = skills.find((s) => s.id === skillRef)
          if (byId) return byId.id
          const byName = skills.find(
            (s) => s.name.toLowerCase() === skillRef.toLowerCase()
          )
          return byName?.id
        })
        .filter((id): id is string => Boolean(id))

      setForm({
        title: editingProject.title,
        slug: editingProject.slug,
        tagline: editingProject.tagline,
        category: editingProject.category,
        status: editingProject.status,
        summary: editingProject.summary,
        description: editingProject.description,
        demo_url: editingProject.demo_url || '',
        repo_url: editingProject.repo_url || '',
        is_featured: editingProject.is_featured,
        display_order: editingProject.display_order,
        selectedSkills: resolvedSkillIds,
      })
    } else {
      setCoverPreview(null)
      setCoverFile(null)
      setForm({
        title: '',
        slug: '',
        tagline: '',
        category: 'Full-Stack',
        status: 'completed',
        summary: '',
        description: '',
        demo_url: '',
        repo_url: '',
        is_featured: false,
        display_order: 0,
        selectedSkills: [],
      })
    }
  }, [editingProject, isOpen, skills])

  // Libère l'URL blob générée localement pour éviter toute fuite mémoire
  useEffect(() => {
    if (!coverPreview || !coverPreview.startsWith('blob:')) return
    return () => {
      URL.revokeObjectURL(coverPreview)
    }
  }, [coverPreview])

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const handleRemoveCover = (): void => {
    setCoverFile(null)
    setCoverPreview(null)
  }

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    const success = await onSave(
      editingProject ? editingProject.id : null,
      {
        title: form.title.trim(),
        slug: form.slug.trim(),
        tagline: form.tagline.trim(),
        category: form.category,
        status: form.status,
        summary: form.summary.trim(),
        description: form.description.trim(),
        cover_image_url: coverPreview,
        demo_url: form.demo_url.trim() || null,
        repo_url: form.repo_url.trim() || null,
        is_featured: form.is_featured,
        display_order: Number(form.display_order) || 0,
      },
      form.selectedSkills,
      coverFile
    )

    if (success) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-indigo-500 animate-pulse" />
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {editingProject ? 'Modifier le projet' : 'Ajouter un nouveau projet'}
              </h3>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              {editingProject
                ? editingProject.title
                : 'Remplissez les détails et importez une capture de votre projet'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 overscroll-contain">
            {/* Capture / Image */}
            <div>
              <label className="block text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Capture d'écran / Photo du projet *
              </label>
              <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mb-2">
                Format YouTube 16:9 recommandé : 1280 × 720 px ou 1920 × 1080 px (identique sur mobile et desktop).
              </p>

              {coverPreview ? (
                <div className="space-y-2">
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-950">
                    <img
                      src={coverPreview}
                      alt="Aperçu du projet"
                      className="w-full h-full object-contain object-center"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-white text-[11px] font-mono flex items-center gap-1.5 shadow-sm">
                      <span className="size-2 rounded-full bg-emerald-400" />
                      <span>Aperçu 16:9</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-mono transition-colors">
                      <Icon name="sparkles" className="size-3.5 text-indigo-500" />
                      <span>Changer la capture</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-rose-500/10 hover:border-rose-500/30 text-rose-600 text-xs font-mono transition-colors cursor-pointer"
                    >
                      Retirer la capture
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl cursor-pointer bg-zinc-50/50 dark:bg-zinc-950/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all p-4 text-center group">
                  <div className="size-10 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Icon name="sparkles" className="size-5" />
                  </div>
                  <span className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                    Importer une capture ou photo du projet
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    Format YouTube 16:9 (1280 × 720 ou 1920 × 1080 px) • PNG, JPG, WebP, AVIF (max 5 Mo)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Titre & Slug */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                  Titre du projet *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Portfolio SaaS v2"
                  value={form.title}
                  onChange={(e) => {
                    const val = e.target.value
                    setForm({
                      ...form,
                      title: val,
                      slug:
                        !editingProject && !form.slug
                          ? val
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-|-$/g, '')
                          : form.slug,
                    })
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                  Slug (URL unique) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: portfolio-saas-v2"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Tagline */}
            <div>
              <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                Accroche concise (Tagline) *
              </label>
              <input
                type="text"
                required
                placeholder="ex: Application web moderne full-stack ultra-rapide"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Catégorie & Statut */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                  Catégorie
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category: e.target.value as ProjectCategoryType,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Full-Stack">Full-Stack</option>
                  <option value="Frontend">Frontend</option>
                  <option value="APIs">APIs & Backend</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                  Statut du projet
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as ProjectStatusType,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="completed">Terminé</option>
                  <option value="in_progress">En cours</option>
                </select>
              </div>
            </div>

            {/* Résumé */}
            <div>
              <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                Résumé de la carte *
              </label>
              <textarea
                rows={2}
                required
                placeholder="Court paragraphe d'aperçu visible sur le catalogue..."
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Description complète */}
            <div>
              <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                Description complète (Optionnel)
              </label>
              <textarea
                rows={3}
                placeholder="Détails techniques, choix d'architecture, défis relevés..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* URLs Démo & Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                  URL Démo en ligne
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.demo_url}
                  onChange={(e) => setForm({ ...form, demo_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                  URL Dépôt GitHub
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={form.repo_url}
                  onChange={(e) => setForm({ ...form, repo_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Ordre & À la une */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-zinc-50/70 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800/80">
              <div>
                <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                  Ordre d'affichage
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
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center sm:pt-5">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-mono text-zinc-700 dark:text-zinc-300 select-none">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                    className="size-4 rounded accent-indigo-600 cursor-pointer"
                  />
                  <span>Mettre à la une (Projet vedette)</span>
                </label>
              </div>
            </div>

            {/* Technologies & Compétences */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300">
                  Technologies & Compétences
                </label>
                <span className="text-[11px] font-mono text-zinc-400">
                  {form.selectedSkills.length} sélectionnée(s)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800">
                {skills.map((s) => {
                  const isSel = form.selectedSkills.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setForm({
                          ...form,
                          selectedSkills: isSel
                            ? form.selectedSkills.filter((x) => x !== s.id)
                            : [...form.selectedSkills, s.id],
                        })
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono cursor-pointer transition-colors ${isSel
                          ? 'bg-indigo-600 text-white font-medium shadow-xs'
                          : 'bg-zinc-200 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                    >
                      {isSel ? '✓ ' : ''}
                      {s.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3 shrink-0 bg-zinc-50/95 dark:bg-zinc-900/95 backdrop-blur-md">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-mono transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-semibold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {saving && (
                <span className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>{editingProject ? 'Enregistrer les modifications' : 'Créer le projet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
