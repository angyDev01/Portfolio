import { useState, useEffect, useRef, type FormEvent, type ReactElement } from 'react'
import Icon from '../Icon'
import AvatarImage from '../AvatarImage'
import type { DbProfile, AvailabilityStatusType } from '../../types/database'

interface ProfileTabProps {
  profile: DbProfile | null
  uploadingAvatar: boolean
  uploadingBanner: boolean
  onUpdateAvailability: (status: AvailabilityStatusType) => Promise<boolean>
  onUpdateProfile: (payload: Partial<DbProfile>) => Promise<boolean>
  onUploadAvatar: (file: File) => Promise<boolean>
  onRemoveAvatar: () => Promise<boolean>
  onUploadBanner: (file: File) => Promise<boolean>
  onRemoveBanner: () => Promise<boolean>
}

export default function ProfileTab({
  profile,
  uploadingAvatar,
  uploadingBanner,
  onUpdateAvailability,
  onUpdateProfile,
  onUploadAvatar,
  onRemoveAvatar,
  onUploadBanner,
  onRemoveBanner,
}: ProfileTabProps): ReactElement {
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const bannerInputRef = useRef<HTMLInputElement | null>(null)

  const [form, setForm] = useState({
    name: 'Angoa Yao Jean',
    alias: "Angy's",
    role: 'Développeur Full-Stack Junior',
    short_bio:
      "Développeur Full-Stack autodidacte passionné par la conception d'applications web modernes, réactives et performantes sous React, Vite et Node.js.",
    full_bio_text:
      "Basé à Abidjan, Côte d'Ivoire, et ouvert au télétravail à l'international, je conçois des solutions logicielles complètes avec une attention particulière portée au clean code, à l'ergonomie et à la sécurité.",
    github_url: 'https://github.com/angyDev01',
    linkedin_url: 'https://www.linkedin.com/in/angy-dev-532293357',
    twitter_url: 'https://x.com/Angy656261',
    facebook_url: 'https://www.facebook.com/share/1FGHSoJjo9/',
    avatar_url: '',
    phone: '+225 07 20 64 65 26',
    phone_secondary: '+225 05 66 40 29 73',
    whatsapp_url: 'https://wa.me/2250720646526',
    location: "Abidjan, Côte d'Ivoire (Ouvert au télétravail / remote)",
    availability_status: 'available' as AvailabilityStatusType,
    status_label: 'Disponible',
  })

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        alias: profile.alias || '',
        role: profile.role || '',
        short_bio: profile.short_bio || '',
        full_bio_text: Array.isArray(profile.full_bio)
          ? profile.full_bio.join('\n\n')
          : typeof profile.full_bio === 'string'
          ? profile.full_bio
          : '',
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
        twitter_url: profile.twitter_url || '',
        facebook_url: profile.facebook_url || '',
        avatar_url: profile.avatar_url || '',
        phone: profile.phone || '',
        phone_secondary: profile.phone_secondary || '',
        whatsapp_url: profile.whatsapp_url || '',
        location: profile.location || '',
        availability_status: profile.availability_status || 'available',
        status_label: profile.status_label || 'Disponible',
      })
    }
  }, [profile])

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    if (!file) return
    await onUploadAvatar(file)
    if (avatarInputRef.current) {
      avatarInputRef.current.value = ''
    }
    e.target.value = ''
  }

  const handleBannerFileSelect = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    if (!file) return
    await onUploadBanner(file)
    if (bannerInputRef.current) {
      bannerInputRef.current.value = ''
    }
    e.target.value = ''
  }

  const handleAvatarRemove = async (): Promise<void> => {
    if (avatarInputRef.current) {
      avatarInputRef.current.value = ''
    }
    await onRemoveAvatar()
  }

  const handleFormSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()

    const paragraphs = form.full_bio_text
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0)

    await onUpdateProfile({
      name: form.name.trim(),
      alias: form.alias.trim() || undefined,
      role: form.role.trim() || undefined,
      short_bio: form.short_bio.trim(),
      full_bio: paragraphs,
      github_url: form.github_url.trim() || undefined,
      linkedin_url: form.linkedin_url.trim() || undefined,
      twitter_url: form.twitter_url.trim() || undefined,
      facebook_url: form.facebook_url.trim() || undefined,
      phone: form.phone.trim() || undefined,
      phone_secondary: form.phone_secondary.trim() || undefined,
      whatsapp_url: form.whatsapp_url.trim() || undefined,
      location: form.location.trim() || undefined,
      status_label: form.status_label.trim(),
    })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 1. Statut de Disponibilité Public */}
      <div className="glass-card p-6 border-zinc-200 dark:border-zinc-800">
        <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          Statut de Disponibilité Public
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
          Sélectionnez l'un des 3 états ci-dessous. Le badge sur la page d'accueil sera instantanément mis à jour.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {/* A. Disponible */}
          <button
            type="button"
            onClick={() => onUpdateAvailability('available')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-2 ${
              form.availability_status === 'available'
                ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                Disponible
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
              Badge vert pulsant : ouvert aux opportunités et missions freelance.
            </p>
          </button>

          {/* B. En poste */}
          <button
            type="button"
            onClick={() => onUpdateAvailability('employed')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-2 ${
              form.availability_status === 'employed'
                ? 'bg-indigo-500/15 border-indigo-500/50 shadow-md shadow-indigo-500/10'
                : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-indigo-500" />
              </span>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                En poste
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
              Badge bleu/violet discret : actuellement en mission ou en poste fixe.
            </p>
          </button>

          {/* C. Non disponible */}
          <button
            type="button"
            onClick={() => onUpdateAvailability('unavailable')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-2 ${
              form.availability_status === 'unavailable'
                ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-amber-500" />
              <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
                Non disponible
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
              Badge ambre : indisponible pour le moment ou congés.
            </p>
          </button>
        </div>

        <div>
          <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1.5">
            Libellé personnalisé affiché dans le badge Hero
          </label>
          <input
            type="text"
            value={form.status_label}
            onChange={(e) => setForm({ ...form, status_label: e.target.value })}
            className="w-full px-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* 2. Formulaire des Informations & Bios */}
      <form
        onSubmit={handleFormSubmit}
        className="glass-card p-6 border-zinc-200 dark:border-zinc-800 space-y-5"
      >
        <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Informations & Bios
        </h2>

        {/* Avatar & Supabase Storage */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
          <div className="relative group shrink-0">
            <AvatarImage
              src={profile?.avatar_url}
              alt="Avatar prévisualisation"
              className="size-20 border-2 border-indigo-500 shadow-md"
            />
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-medium transition-colors shadow-xs">
                <Icon name="sparkles" className="size-3.5" />
                <span>{uploadingAvatar ? 'Téléversement...' : 'Changer l’avatar (Stockage)'}</span>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  disabled={uploadingAvatar}
                  onChange={handleAvatarFileSelect}
                  className="hidden"
                />
              </label>
              {profile?.avatar_url && (
                <button
                  type="button"
                  onClick={handleAvatarRemove}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-600 text-xs font-mono transition-colors cursor-pointer"
                >
                  Retirer
                </button>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              Formats acceptés : JPG, PNG, WebP, AVIF (max 5 Mo).
            </p>
          </div>
        </div>

        {/* Photo de couverture / Bannière Hero */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 uppercase">
                Bannière / Photo de couverture (Accueil)
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono">
                Format panoramique recommandé (ex. 1600×500 px). Affichée en tête du Hero.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-medium transition-colors shadow-xs">
                <Icon name="image" className="size-3.5" />
                <span>
                  {uploadingBanner
                    ? 'Téléversement...'
                    : profile?.banner_url
                      ? 'Changer la bannière'
                      : 'Importer une bannière'}
                </span>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  disabled={uploadingBanner}
                  onChange={handleBannerFileSelect}
                  className="hidden"
                />
              </label>
              {profile?.banner_url && (
                <button
                  type="button"
                  onClick={() => void onRemoveBanner()}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-600 text-xs font-mono transition-colors cursor-pointer"
                >
                  Retirer
                </button>
              )}
            </div>
          </div>

          {profile?.banner_url ? (
            <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
              <img
                key={profile.banner_url}
                src={profile.banner_url}
                alt="Aperçu bannière"
                className="w-full h-32 sm:h-40 object-cover block"
              />
            </div>
          ) : (
            <div className="h-20 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-800 flex items-center justify-center text-xs font-mono text-zinc-400">
              Aucune bannière configurée
            </div>
          )}
        </div>

        {/* Noms & Rôles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
              Nom complet *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
              Alias / Surnom
            </label>
            <input
              type="text"
              value={form.alias}
              onChange={(e) => setForm({ ...form, alias: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
              Rôle
            </label>
            <input
              type="text"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Bio Courte */}
        <div>
          <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
            Bio courte (Section Hero) *
          </label>
          <textarea
            rows={2}
            required
            value={form.short_bio}
            onChange={(e) => setForm({ ...form, short_bio: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none resize-y"
          />
        </div>

        {/* Bio Détaillée */}
        <div>
          <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
            Bio détaillée (Section À propos — séparez les paragraphes par une ligne vide) *
          </label>
          <textarea
            rows={5}
            required
            value={form.full_bio_text}
            onChange={(e) => setForm({ ...form, full_bio_text: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none resize-y leading-relaxed"
          />
        </div>

        {/* Réseaux Sociaux */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
              URL GitHub
            </label>
            <input
              type="url"
              value={form.github_url}
              onChange={(e) => setForm({ ...form, github_url: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
              URL LinkedIn
            </label>
            <input
              type="url"
              value={form.linkedin_url}
              onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
              URL X (Twitter)
            </label>
            <input
              type="url"
              value={form.twitter_url}
              onChange={(e) => setForm({ ...form, twitter_url: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
              URL Facebook
            </label>
            <input
              type="url"
              value={form.facebook_url}
              onChange={(e) => setForm({ ...form, facebook_url: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Coordonnées */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
              Téléphone Principal & WhatsApp
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+225 07 20 64 65 26"
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
              Téléphone Secondaire
            </label>
            <input
              type="text"
              value={form.phone_secondary}
              onChange={(e) => setForm({ ...form, phone_secondary: e.target.value })}
              placeholder="+225 05 66 40 29 73"
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
              Lien WhatsApp Direct
            </label>
            <input
              type="url"
              value={form.whatsapp_url}
              onChange={(e) => setForm({ ...form, whatsapp_url: e.target.value })}
              placeholder="https://wa.me/2250720646526"
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
              Localisation Affichée
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Abidjan, Côte d'Ivoire (Ouvert au télétravail / remote)"
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs font-mono transition-all cursor-pointer shadow-md shadow-indigo-600/20"
          >
            Enregistrer les modifications du Profil
          </button>
        </div>
      </form>
    </div>
  )
}
