import { useEffect, useState, useMemo, type FormEvent, type ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { portfolioService } from '../services/portfolioService'
import type {
  DbProfile,
  DbProject,
  DbSkill,
  ContactMessage,
  AnalyticsStats,
  AvailabilityStatusType,
  SkillCategoryType,
  ProjectStatusType,
} from '../types/database'
import Icon from '../components/Icon'
import { useTheme } from '../context/ThemeContext'
import { CountUp } from '../hooks/useCountUp'

type AdminTab = 'analytics' | 'projects' | 'skills' | 'profile' | 'messages'

export default function DashboardPage(): ReactElement {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics')
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)

  // Global & Profile State
  const [profile, setProfile] = useState<DbProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Analytics State
  const [analyticsRange, setAnalyticsRange] = useState<7 | 30>(7)
  const [analytics, setAnalytics] = useState<AnalyticsStats>({
    totalViews: 0,
    views7d: 0,
    viewsTrendPercent: 0,
    totalMessages: 0,
    unreadMessages: 0,
    featuredProjects: 0,
    inProgressProjects: 0,
    completedProjects: 0,
    chartData: [],
  })

  // Projects State
  const [projects, setProjects] = useState<DbProject[]>([])
  const [projectModalOpen, setProjectModalOpen] = useState<boolean>(false)
  const [editingProject, setEditingProject] = useState<DbProject | null>(null)
  const [projectForm, setProjectForm] = useState<{
    title: string
    slug: string
    tagline: string
    category: 'Full-Stack' | 'Frontend' | 'APIs'
    status: ProjectStatusType
    summary: string
    description: string
    demo_url: string
    repo_url: string
    image_url: string
    is_featured: boolean
    display_order: number
    selectedSkills: string[]
  }>({
    title: '',
    slug: '',
    tagline: '',
    category: 'Full-Stack',
    status: 'completed',
    summary: '',
    description: '',
    demo_url: '',
    repo_url: '',
    image_url: '',
    is_featured: false,
    display_order: 0,
    selectedSkills: [],
  })

  // Skills State
  const [skills, setSkills] = useState<DbSkill[]>([])
  const [skillModalOpen, setSkillModalOpen] = useState<boolean>(false)
  const [editingSkill, setEditingSkill] = useState<DbSkill | null>(null)
  const [skillForm, setSkillForm] = useState<{
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

  // Profile Form State
  const [profileForm, setProfileForm] = useState<{
    name: string
    alias: string
    role: string
    short_bio: string
    full_bio_text: string
    github_url: string
    linkedin_url: string
    twitter_url: string
    facebook_url: string
    availability_status: AvailabilityStatusType
    status_label: string
  }>({
    name: '',
    alias: '',
    role: '',
    short_bio: '',
    full_bio_text: '',
    github_url: '',
    linkedin_url: '',
    twitter_url: '',
    facebook_url: '',
    availability_status: 'available',
    status_label: 'Disponible pour de nouvelles opportunités',
  })

  // Messages State
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [messagesFilter, setMessagesFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [messagesSearch, setMessagesSearch] = useState<string>('')

  // Fermeture du slide-over au clavier (ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDrawerOpen])

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  // Initial Load
  const loadAllData = async (): Promise<void> => {
    setLoading(true)
    try {
      const [profData, projsData, sksData, msgsRes, anRes] = await Promise.all([
        portfolioService.getProfile(),
        portfolioService.getProjects(),
        portfolioService.getSkills(),
        portfolioService.getAdminMessages(),
        portfolioService.getAnalyticsStats(analyticsRange),
      ])

      if (profData) {
        setProfile(profData)
        setProfileForm({
          name: profData.name || '',
          alias: profData.alias || '',
          role: profData.role || '',
          short_bio: profData.short_bio || '',
          full_bio_text: Array.isArray(profData.full_bio) ? profData.full_bio.join('\n\n') : '',
          github_url: profData.github_url || '',
          linkedin_url: profData.linkedin_url || '',
          twitter_url: profData.twitter_url || '',
          facebook_url: profData.facebook_url || '',
          availability_status: profData.availability_status || 'available',
          status_label: profData.status_label || 'Disponible pour de nouvelles opportunités',
        })
      }

      setProjects(projsData)
      setSkills(sksData)
      if (msgsRes.ok) setMessages(msgsRes.messages)
      setAnalytics(anRes)
    } catch (err) {
      console.error('Error loading admin data:', err)
      setToast({ type: 'error', text: 'Erreur lors du chargement des données.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [analyticsRange])

  // ==========================================
  // ACTIONS PROFIL & STATUT
  // ==========================================

  const handleUpdateAvailability = async (status: AvailabilityStatusType): Promise<void> => {
    let defaultLabel = 'Disponible pour de nouvelles opportunités'
    let isAvail = true
    if (status === 'employed') {
      defaultLabel = 'En poste / Actuellement en mission'
      isAvail = false
    } else if (status === 'unavailable') {
      defaultLabel = 'Non disponible pour le moment'
      isAvail = false
    }

    setProfileForm((prev) => ({
      ...prev,
      availability_status: status,
      status_label: defaultLabel,
    }))

    const res = await portfolioService.updateProfile({
      availability_status: status,
      status_label: defaultLabel,
      is_available: isAvail,
    })

    if (res.ok) {
      setToast({ type: 'success', text: `Statut mis à jour : ${defaultLabel}` })
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              availability_status: status,
              status_label: defaultLabel,
              is_available: isAvail,
            }
          : null
      )
    } else {
      setToast({ type: 'error', text: res.error || 'Erreur mise à jour statut.' })
    }
  }

  const handleProfileSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()

    const paragraphs = profileForm.full_bio_text
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0)

    const res = await portfolioService.updateProfile({
      name: profileForm.name.trim(),
      alias: profileForm.alias.trim() || undefined,
      role: profileForm.role.trim() || undefined,
      short_bio: profileForm.short_bio.trim(),
      full_bio: paragraphs,
      github_url: profileForm.github_url.trim() || undefined,
      linkedin_url: profileForm.linkedin_url.trim() || undefined,
      twitter_url: profileForm.twitter_url.trim() || undefined,
      facebook_url: profileForm.facebook_url.trim() || undefined,
      status_label: profileForm.status_label.trim(),
    })

    if (res.ok) {
      setToast({ type: 'success', text: 'Profil mis à jour avec succès.' })
      const updated = await portfolioService.getProfile()
      setProfile(updated)
    } else {
      setToast({ type: 'error', text: res.error || 'Erreur lors de la mise à jour du profil.' })
    }
  }

  const handleToggleAcceptMessages = async (): Promise<void> => {
    const currentStatus = profile?.accept_direct_messages !== false
    const newStatus = !currentStatus

    setProfile((prev) => (prev ? { ...prev, accept_direct_messages: newStatus } : null))

    const res = await portfolioService.updateProfile({
      accept_direct_messages: newStatus,
    })

    if (res.ok) {
      setToast({
        type: 'success',
        text: newStatus
          ? 'Réception des messages directs activée.'
          : 'Réception des messages directs suspendue (formulaire masqué sur le site).',
      })
    } else {
      setProfile((prev) => (prev ? { ...prev, accept_direct_messages: currentStatus } : null))
      setToast({ type: 'error', text: 'Impossible de changer le statut de réception.' })
    }
  }

  // ==========================================
  // ACTIONS PROJETS
  // ==========================================

  const openProjectCreate = (): void => {
    setEditingProject(null)
    setProjectForm({
      title: '',
      slug: '',
      tagline: '',
      category: 'Full-Stack',
      status: 'completed',
      summary: '',
      description: '',
      demo_url: '',
      repo_url: '',
      image_url: '',
      is_featured: false,
      display_order: projects.length,
      selectedSkills: [],
    })
    setProjectModalOpen(true)
  }

  const openProjectEdit = (p: DbProject): void => {
    setEditingProject(p)
    setProjectForm({
      title: p.title,
      slug: p.slug,
      tagline: p.tagline,
      category: p.category,
      status: p.status,
      summary: p.summary,
      description: p.description,
      demo_url: p.demo_url || '',
      repo_url: p.repo_url || '',
      image_url: p.images && p.images[0] ? p.images[0] : '',
      is_featured: p.is_featured,
      display_order: p.display_order,
      selectedSkills: [...p.skills],
    })
    setProjectModalOpen(true)
  }

  const handleProjectSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()

    const images = projectForm.image_url.trim() ? [projectForm.image_url.trim()] : []

    if (editingProject) {
      const res = await portfolioService.updateProject(
        editingProject.id,
        {
          title: projectForm.title.trim(),
          slug: projectForm.slug.trim(),
          tagline: projectForm.tagline.trim(),
          category: projectForm.category,
          status: projectForm.status,
          summary: projectForm.summary.trim(),
          description: projectForm.description.trim(),
          images,
          demo_url: projectForm.demo_url.trim() || null,
          repo_url: projectForm.repo_url.trim() || null,
          is_featured: projectForm.is_featured,
          display_order: Number(projectForm.display_order) || 0,
        },
        projectForm.selectedSkills
      )
      if (res.ok) {
        setToast({ type: 'success', text: 'Projet modifié avec succès.' })
        setProjectModalOpen(false)
        const updated = await portfolioService.getProjects()
        setProjects(updated)
      } else {
        setToast({ type: 'error', text: res.error || 'Erreur modification projet.' })
      }
    } else {
      const res = await portfolioService.createProject(
        {
          title: projectForm.title.trim(),
          slug: projectForm.slug.trim(),
          tagline: projectForm.tagline.trim(),
          category: projectForm.category,
          status: projectForm.status,
          summary: projectForm.summary.trim(),
          description: projectForm.description.trim(),
          images,
          demo_url: projectForm.demo_url.trim() || null,
          repo_url: projectForm.repo_url.trim() || null,
          is_featured: projectForm.is_featured,
          display_order: Number(projectForm.display_order) || 0,
        },
        projectForm.selectedSkills
      )
      if (res.ok) {
        setToast({ type: 'success', text: 'Projet créé avec succès.' })
        setProjectModalOpen(false)
        const updated = await portfolioService.getProjects()
        setProjects(updated)
      } else {
        setToast({ type: 'error', text: res.error || 'Erreur création projet.' })
      }
    }
  }

  const handleDeleteProject = async (p: DbProject): Promise<void> => {
    const confirmDel = window.confirm(`Supprimer définitivement le projet "${p.title}" ?`)
    if (!confirmDel) return

    const res = await portfolioService.deleteProject(p.id)
    if (res.ok) {
      setToast({ type: 'success', text: 'Projet supprimé.' })
      setProjects((prev) => prev.filter((item) => item.id !== p.id))
    } else {
      setToast({ type: 'error', text: res.error || 'Erreur suppression projet.' })
    }
  }

  // ==========================================
  // ACTIONS COMPÉTENCES
  // ==========================================

  const openSkillCreate = (): void => {
    setEditingSkill(null)
    setSkillForm({
      name: '',
      category: 'frontend',
      icon: 'code',
      description: '',
      display_order: skills.length,
      is_featured: false,
    })
    setSkillModalOpen(true)
  }

  const openSkillEdit = (s: DbSkill): void => {
    setEditingSkill(s)
    setSkillForm({
      name: s.name,
      category: s.category,
      icon: s.icon,
      description: s.description || '',
      display_order: s.display_order,
      is_featured: s.is_featured,
    })
    setSkillModalOpen(true)
  }

  const handleSkillSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()

    if (editingSkill) {
      const res = await portfolioService.updateSkill(editingSkill.id, {
        name: skillForm.name.trim(),
        category: skillForm.category,
        icon: skillForm.icon.trim() || 'code',
        description: skillForm.description.trim() || undefined,
        display_order: Number(skillForm.display_order) || 0,
        is_featured: skillForm.is_featured,
      })
      if (res.ok) {
        setToast({ type: 'success', text: 'Compétence mise à jour.' })
        setSkillModalOpen(false)
        const updated = await portfolioService.getSkills()
        setSkills(updated)
      } else {
        setToast({ type: 'error', text: res.error || 'Erreur modification compétence.' })
      }
    } else {
      const res = await portfolioService.createSkill({
        name: skillForm.name.trim(),
        category: skillForm.category,
        icon: skillForm.icon.trim() || 'code',
        description: skillForm.description.trim() || undefined,
        display_order: Number(skillForm.display_order) || 0,
        is_featured: skillForm.is_featured,
      })
      if (res.ok) {
        setToast({ type: 'success', text: 'Compétence ajoutée.' })
        setSkillModalOpen(false)
        const updated = await portfolioService.getSkills()
        setSkills(updated)
      } else {
        setToast({ type: 'error', text: res.error || 'Erreur création compétence.' })
      }
    }
  }

  const handleDeleteSkill = async (s: DbSkill): Promise<void> => {
    const confirmDel = window.confirm(`Supprimer la compétence "${s.name}" ?`)
    if (!confirmDel) return

    const res = await portfolioService.deleteSkill(s.id)
    if (res.ok) {
      setToast({ type: 'success', text: 'Compétence supprimée.' })
      setSkills((prev) => prev.filter((item) => item.id !== s.id))
    } else {
      setToast({ type: 'error', text: res.error || 'Erreur suppression compétence.' })
    }
  }

  // ==========================================
  // ACTIONS MESSAGES
  // ==========================================

  const handleToggleRead = async (msg: ContactMessage): Promise<void> => {
    const newStatus = !msg.is_read
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, is_read: newStatus } : m))
    )

    const res = await portfolioService.setMessageReadStatus(msg.id, newStatus)
    if (!res.ok) {
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, is_read: msg.is_read } : m))
      )
      setToast({ type: 'error', text: 'Erreur mise à jour statut lecture.' })
    }
  }

  const handleDeleteMessage = async (msg: ContactMessage): Promise<void> => {
    const confirmDel = window.confirm(`Supprimer définitivement le message de ${msg.name} ?`)
    if (!confirmDel) return

    setMessages((prev) => prev.filter((m) => m.id !== msg.id))
    const res = await portfolioService.deleteMessage(msg.id)
    if (res.ok) {
      setToast({ type: 'success', text: 'Message supprimé.' })
    } else {
      setToast({ type: 'error', text: 'Erreur lors de la suppression.' })
      portfolioService.getAdminMessages().then((r) => {
        if (r.ok) setMessages(r.messages)
      })
    }
  }

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      if (messagesFilter === 'unread' && m.is_read) return false
      if (messagesFilter === 'read' && !m.is_read) return false
      if (!messagesSearch.trim()) return true
      const q = messagesSearch.toLowerCase()
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone && m.phone.toLowerCase().includes(q)) ||
        m.message.toLowerCase().includes(q)
      )
    })
  }, [messages, messagesFilter, messagesSearch])

  const unreadMessagesCount = useMemo(() => {
    return messages.filter((m) => !m.is_read).length
  }, [messages])

  // Déconnexion Supabase
  const handleSignOut = async (): Promise<void> => {
    await portfolioService.signOutSupabase()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="pt-20 pb-28 md:pt-24 md:pb-16 min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      <div className="container-custom max-w-6xl">
        {/* ============================================================== */}
        {/* TOP BAR ÉPURÉE (En-tête SaaS Moderne)                           */}
        {/* ============================================================== */}
        <header className="flex items-center justify-between gap-4 pb-5 border-b border-zinc-200 dark:border-zinc-800/80 mb-6">
          {/* Titre discret à gauche avec indicateur en direct du statut actuel */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className={`size-2 rounded-full ${
                    profile?.availability_status === 'employed'
                      ? 'bg-indigo-500 animate-pulse'
                      : profile?.availability_status === 'unavailable'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500 animate-pulse'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[11px] font-mono font-medium text-zinc-500 dark:text-zinc-400">
                  {profile?.status_label || 'Connecté'}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">•</span>
                <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 hidden sm:inline">
                  Admin Studio
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Tableau de Bord
              </h1>
            </div>
          </div>

          {/* Outils à droite : Actualiser, Mode Sombre/Clair, Cloche Messages, Déconnexion */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Bouton Actualiser */}
            <button
              type="button"
              onClick={loadAllData}
              disabled={loading}
              className="size-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-all cursor-pointer shadow-xs"
              title="Rafraîchir les données"
              aria-label="Actualiser"
            >
              <Icon name="refresh" className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* 1. Sélecteur de Thème (Light / Dark Mode) avec icône Soleil/Lune */}
            <button
              type="button"
              onClick={toggleTheme}
              className="size-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-all cursor-pointer shadow-xs"
              title={theme === 'dark' ? 'Basculer en mode clair' : 'Basculer en mode sombre'}
              aria-label="Basculer le thème"
            >
              <Icon
                name={theme === 'dark' ? 'sun' : 'moon'}
                className="size-4.5 transition-transform duration-300 hover:rotate-45"
              />
            </button>

            {/* 2. Icône Cloche (Messagerie) avec pastille rouge dynamique */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="relative size-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-all cursor-pointer shadow-xs"
              title="Ouvrir le panneau de messagerie"
              aria-label="Notifications messagerie"
            >
              <Icon name="bell" className="size-4.5" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold font-mono flex items-center justify-center shadow-xs animate-pulse">
                  {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                </span>
              )}
            </button>

            {/* 3. Bouton Déconnexion (LogOut) */}
            <button
              type="button"
              onClick={handleSignOut}
              className="size-9 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-all cursor-pointer shadow-xs"
              title="Déconnexion sécurisée"
              aria-label="Se déconnecter"
            >
              <Icon name="logout" className="size-4" />
            </button>
          </div>
        </header>

        {/* Toast de notification */}
        {toast && (
          <div
            className={`mb-6 p-3 rounded-lg border text-xs font-mono flex items-center gap-2.5 transition-all shadow-xs ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
            }`}
          >
            <Icon name={toast.type === 'success' ? 'check' : 'alert'} className="size-4" />
            <span>{toast.text}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* NAVIGATION DESKTOP PAR ONGLETS (Style Vercel / Linear)          */}
        {/* ============================================================== */}
        <nav
          aria-label="Onglets d'administration"
          className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-zinc-200/60 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/80 mb-8"
        >
          {/* A. Vue d'ensemble */}
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Icon name="analytics" className="size-3.5 text-indigo-500" />
            <span>Vue d'ensemble</span>
          </button>

          {/* B. Projets */}
          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Icon name="projects" className="size-3.5 text-indigo-500" />
            <span>Projets ({projects.length})</span>
          </button>

          {/* C. Compétences */}
          <button
            type="button"
            onClick={() => setActiveTab('skills')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              activeTab === 'skills'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Icon name="skills" className="size-3.5 text-indigo-500" />
            <span>Compétences ({skills.length})</span>
          </button>

          {/* D. Profil & Disponibilité */}
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Icon name="user" className="size-3.5 text-indigo-500" />
            <span>Profil & Statut</span>
          </button>

          {/* E. Messagerie (Ouvre également le Drawer ou l'onglet) */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all cursor-pointer ml-auto"
          >
            <div className="relative flex items-center">
              <Icon name="messageSquare" className="size-3.5 text-indigo-500" />
              {unreadMessagesCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold font-mono animate-pulse">
                  {unreadMessagesCount}
                </span>
              )}
            </div>
            <span>Messages Directs</span>
          </button>
        </nav>

        {/* ============================================================== */}
        {/* A. ONGLET VUE D'ENSEMBLE & ANALYTICS (Recharts + CountUp)      */}
        {/* ============================================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* 4 Cartes d'indicateurs avec effet CountUp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Carte 1 : Total Visites avec Tendance */}
              <div className="glass-card p-5 border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Total Visites
                  </span>
                  <div className="size-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Icon name="analytics" className="size-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
                    <CountUp end={analytics.totalViews} />
                  </span>
                  <span
                    className={`text-xs font-mono font-medium flex items-center gap-0.5 ${
                      analytics.viewsTrendPercent >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    <Icon name="trending" className="size-3" />
                    <span>
                      {analytics.viewsTrendPercent >= 0
                        ? `+${analytics.viewsTrendPercent}%`
                        : `${analytics.viewsTrendPercent}%`}
                    </span>
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono mt-1">
                  sur les {analyticsRange} derniers jours
                </p>
              </div>

              {/* Carte 2 : Messages reçus avec CountUp */}
              <div
                onClick={() => setIsDrawerOpen(true)}
                className="glass-card p-5 border-zinc-200 dark:border-zinc-800 cursor-pointer hover:border-indigo-400/50 transition-colors group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Messages Reçus
                  </span>
                  <div className="relative size-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon name="messageSquare" className="size-4" />
                    {unreadMessagesCount > 0 && (
                      <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-rose-500 animate-ping" />
                    )}
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
                    <CountUp end={messages.length} />
                  </span>
                  {unreadMessagesCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-[10px] font-mono font-bold">
                      {unreadMessagesCount} non lus
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 font-mono mt-1">
                  cliquez pour ouvrir le panneau
                </p>
              </div>

              {/* Carte 3 : Projets à la une */}
              <div className="glass-card p-5 border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Projets à la une
                  </span>
                  <div className="size-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Icon name="sparkles" className="size-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
                    <CountUp end={projects.filter((p) => p.is_featured).length} />
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">/ {projects.length} projets</span>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono mt-1">
                  sélectionnés en page d'accueil
                </p>
              </div>

              {/* Carte 4 : État des Projets */}
              <div className="glass-card p-5 border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    État des Projets
                  </span>
                  <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Icon name="projects" className="size-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                    <CountUp end={projects.filter((p) => p.status === 'in_progress').length} />
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">en cours</span>
                  <span className="text-zinc-400 dark:text-zinc-600 font-mono">|</span>
                  <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    <CountUp end={projects.filter((p) => p.status !== 'in_progress').length} />
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">terminés</span>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono mt-1">avancement global</p>
              </div>
            </div>

            {/* Graphique Recharts Interactif */}
            <div className="glass-card p-6 border-zinc-200 dark:border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Évolution de l'Audience & Messagerie
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Suivi quotidien des consultations de pages et des messages directs reçus.
                  </p>
                </div>

                <div className="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setAnalyticsRange(7)}
                    className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                      analyticsRange === 7
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-medium'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    7 jours
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalyticsRange(30)}
                    className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                      analyticsRange === 30
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-medium'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    30 jours
                  </button>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={analytics.chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="visitesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="messagesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={theme === 'dark' ? '#27272a' : '#e4e4e7'}
                    />
                    <XAxis
                      dataKey="date"
                      stroke={theme === 'dark' ? '#71717a' : '#a1a1aa'}
                      fontSize={11}
                      fontFamily="monospace"
                    />
                    <YAxis
                      stroke={theme === 'dark' ? '#71717a' : '#a1a1aa'}
                      fontSize={11}
                      fontFamily="monospace"
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff',
                        borderColor: theme === 'dark' ? '#27272a' : '#e4e4e7',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: theme === 'dark' ? '#f4f4f5' : '#18181b',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="visites"
                      name="Visites (page_views)"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#visitesGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="messages"
                      name="Messages (Canal 2)"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#messagesGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-6 mt-4 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-indigo-500" />
                  <span>Pages Vues (visites)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-emerald-500" />
                  <span>Messages Reçus</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* B. ONGLET PROJETS (CRUD COMPLET)                               */}
        {/* ============================================================== */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Gestion des Projets
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Ajoutez, modifiez ou supprimez vos réalisations.
                </p>
              </div>
              <button
                type="button"
                onClick={openProjectCreate}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs font-mono transition-all cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <Icon name="plus" className="size-4" />
                <span>Nouveau Projet</span>
              </button>
            </div>

            {/* Liste des projets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="glass-card p-5 border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-4"
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
                      {p.summary}
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
                      <button
                        type="button"
                        onClick={() => openProjectEdit(p)}
                        className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-xs transition-colors cursor-pointer"
                        title="Modifier le projet"
                      >
                        <Icon name="pencil" className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(p)}
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

            {/* Modal de Projet */}
            {projectModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
                <div className="glass-card max-w-2xl w-full p-6 sm:p-8 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 my-8 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {editingProject ? 'Modifier le Projet' : 'Ajouter un Projet'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setProjectModalOpen(false)}
                      className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleProjectSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                          Titre *
                        </label>
                        <input
                          type="text"
                          required
                          value={projectForm.title}
                          onChange={(e) => {
                            const val = e.target.value
                            setProjectForm({
                              ...projectForm,
                              title: val,
                              slug:
                                !editingProject && !projectForm.slug
                                  ? val
                                      .toLowerCase()
                                      .replace(/[^a-z0-9]+/g, '-')
                                      .replace(/^-|-$/g, '')
                                  : projectForm.slug,
                            })
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                          Slug *
                        </label>
                        <input
                          type="text"
                          required
                          value={projectForm.slug}
                          onChange={(e) => setProjectForm({ ...projectForm, slug: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                        Accroche (Tagline) *
                      </label>
                      <input
                        type="text"
                        required
                        value={projectForm.tagline}
                        onChange={(e) => setProjectForm({ ...projectForm, tagline: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                          Catégorie
                        </label>
                        <select
                          value={projectForm.category}
                          onChange={(e) =>
                            setProjectForm({
                              ...projectForm,
                              category: e.target.value as 'Full-Stack' | 'Frontend' | 'APIs',
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
                          Statut
                        </label>
                        <select
                          value={projectForm.status}
                          onChange={(e) =>
                            setProjectForm({
                              ...projectForm,
                              status: e.target.value as ProjectStatusType,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="completed">Terminé</option>
                          <option value="in_progress">En cours</option>
                          <option value="archived">Archivé</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                        Résumé (affiché en carte) *
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={projectForm.summary}
                        onChange={(e) => setProjectForm({ ...projectForm, summary: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                        Description complète
                      </label>
                      <textarea
                        rows={4}
                        value={projectForm.description}
                        onChange={(e) =>
                          setProjectForm({ ...projectForm, description: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                          URL Démo
                        </label>
                        <input
                          type="url"
                          value={projectForm.demo_url}
                          onChange={(e) =>
                            setProjectForm({ ...projectForm, demo_url: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                          URL Code Source
                        </label>
                        <input
                          type="url"
                          value={projectForm.repo_url}
                          onChange={(e) =>
                            setProjectForm({ ...projectForm, repo_url: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                        URL Image de couverture
                      </label>
                      <input
                        type="url"
                        value={projectForm.image_url}
                        onChange={(e) =>
                          setProjectForm({ ...projectForm, image_url: e.target.value })
                        }
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                          Ordre d'affichage
                        </label>
                        <input
                          type="number"
                          value={projectForm.display_order}
                          onChange={(e) =>
                            setProjectForm({
                              ...projectForm,
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
                            checked={projectForm.is_featured}
                            onChange={(e) =>
                              setProjectForm({ ...projectForm, is_featured: e.target.checked })
                            }
                            className="size-4 rounded accent-indigo-600"
                          />
                          <span>Afficher à la une</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Technologies & Compétences associées
                      </label>
                      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800">
                        {skills.map((s) => {
                          const isSel = projectForm.selectedSkills.includes(s.name)
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setProjectForm({
                                  ...projectForm,
                                  selectedSkills: isSel
                                    ? projectForm.selectedSkills.filter((x) => x !== s.name)
                                    : [...projectForm.selectedSkills, s.name],
                                })
                              }}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-mono cursor-pointer transition-colors ${
                                isSel
                                  ? 'bg-indigo-600 text-white font-medium'
                                  : 'bg-zinc-200 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                              }`}
                            >
                              {s.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setProjectModalOpen(false)}
                        className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-mono cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-semibold cursor-pointer shadow-md shadow-indigo-600/20"
                      >
                        {editingProject ? 'Enregistrer' : 'Créer'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* C. ONGLET COMPÉTENCES (CRUD COMPLET)                           */}
        {/* ============================================================== */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Gestion des Compétences
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Gérez l'ensemble de votre stack technique.
                </p>
              </div>
              <button
                type="button"
                onClick={openSkillCreate}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs font-mono transition-all cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <Icon name="plus" className="size-4" />
                <span>Ajouter une compétence</span>
              </button>
            </div>

            {/* Grille des compétences */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {skills.map((s) => (
                <div
                  key={s.id}
                  className="glass-card p-4 border-zinc-200 dark:border-zinc-800 flex flex-col justify-between"
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
                      onClick={() => openSkillEdit(s)}
                      className="p-1 rounded bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-xs transition-colors cursor-pointer"
                    >
                      <Icon name="pencil" className="size-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSkill(s)}
                      className="p-1 rounded bg-zinc-100 dark:bg-zinc-900 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 border border-zinc-200 dark:border-zinc-800 text-xs transition-colors cursor-pointer"
                    >
                      <Icon name="trash" className="size-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Compétence */}
            {skillModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                <div className="glass-card max-w-md w-full p-6 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {editingSkill ? 'Modifier la compétence' : 'Ajouter une compétence'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSkillModalOpen(false)}
                      className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSkillSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                        Nom *
                      </label>
                      <input
                        type="text"
                        required
                        value={skillForm.name}
                        onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                          Catégorie
                        </label>
                        <select
                          value={skillForm.category}
                          onChange={(e) =>
                            setSkillForm({
                              ...skillForm,
                              category: e.target.value as SkillCategoryType,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="frontend">Frontend</option>
                          <option value="backend">Backend</option>
                          <option value="database">Database & Cloud</option>
                          <option value="tools">Outils & DevOps</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                          Nom Icône
                        </label>
                        <input
                          type="text"
                          value={skillForm.icon}
                          onChange={(e) => setSkillForm({ ...skillForm, icon: e.target.value })}
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
                          value={skillForm.display_order}
                          onChange={(e) =>
                            setSkillForm({
                              ...skillForm,
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
                            checked={skillForm.is_featured}
                            onChange={(e) =>
                              setSkillForm({ ...skillForm, is_featured: e.target.checked })
                            }
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
                        value={skillForm.description}
                        onChange={(e) =>
                          setSkillForm({ ...skillForm, description: e.target.value })
                        }
                        placeholder="Brève description..."
                        className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setSkillModalOpen(false)}
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
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* D. ONGLET PROFIL & DISPONIBILITÉ                               */}
        {/* ============================================================== */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-3xl">
            {/* Carte de contrôle du statut de disponibilité à 3 options */}
            <div className="glass-card p-6 border-zinc-200 dark:border-zinc-800">
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                Statut de Disponibilité Public
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
                Sélectionnez l'un des 3 états ci-dessous. Le badge sur la page d'accueil sera instantanément mis à jour.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {/* 1. Disponible (Vert pulsant) */}
                <button
                  type="button"
                  onClick={() => handleUpdateAvailability('available')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-2 ${
                    profileForm.availability_status === 'available'
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

                {/* 2. En poste (Bleu/Violet discret) */}
                <button
                  type="button"
                  onClick={() => handleUpdateAvailability('employed')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-2 ${
                    profileForm.availability_status === 'employed'
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

                {/* 3. Non disponible (Ambre) */}
                <button
                  type="button"
                  onClick={() => handleUpdateAvailability('unavailable')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-2 ${
                    profileForm.availability_status === 'unavailable'
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
                  value={profileForm.status_label}
                  onChange={(e) => setProfileForm({ ...profileForm, status_label: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Formulaire des bios et réseaux */}
            <form
              onSubmit={handleProfileSubmit}
              className="glass-card p-6 border-zinc-200 dark:border-zinc-800 space-y-5"
            >
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Informations & Bios
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                    Alias / Surnom
                  </label>
                  <input
                    type="text"
                    value={profileForm.alias}
                    onChange={(e) => setProfileForm({ ...profileForm, alias: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                    Rôle
                  </label>
                  <input
                    type="text"
                    value={profileForm.role}
                    onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                  Bio courte (Section Hero) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={profileForm.short_bio}
                  onChange={(e) => setProfileForm({ ...profileForm, short_bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                  Bio détaillée (Section À propos — séparez les paragraphes par une ligne vide) *
                </label>
                <textarea
                  rows={5}
                  required
                  value={profileForm.full_bio_text}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, full_bio_text: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none resize-y leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                    URL GitHub
                  </label>
                  <input
                    type="url"
                    value={profileForm.github_url}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, github_url: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                    URL LinkedIn
                  </label>
                  <input
                    type="url"
                    value={profileForm.linkedin_url}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, linkedin_url: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                    URL X (Twitter)
                  </label>
                  <input
                    type="url"
                    value={profileForm.twitter_url}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, twitter_url: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-700 dark:text-zinc-300 mb-1">
                    URL Facebook
                  </label>
                  <input
                    type="url"
                    value={profileForm.facebook_url}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, facebook_url: e.target.value })
                    }
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
        )}
      </div>

      {/* ============================================================== */}
      {/* SLIDE-OVER DRAWER (Panneau Latéral Fluide pour la Messagerie)   */}
      {/* ============================================================== */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        role="dialog"
        aria-label="Messagerie Directe"
        aria-modal="true"
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white dark:bg-zinc-900 shadow-2xl border-l border-zinc-200 dark:border-zinc-800 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Icon name="bell" className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Messages Directs
                </h2>
                {unreadMessagesCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold animate-pulse">
                    {unreadMessagesCount} non lu{unreadMessagesCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Canal 2 (site)</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(false)}
            className="size-8 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center text-sm cursor-pointer transition-colors"
            aria-label="Fermer le panneau"
          >
            ✕
          </button>
        </div>

        {/* Drawer Controls : Réception switch + Filtres + Recherche */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 space-y-3">
          {/* Switch Réception */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
              Réception des messages :
            </span>
            <button
              type="button"
              onClick={handleToggleAcceptMessages}
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                profile?.accept_direct_messages !== false
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/40'
              }`}
            >
              <span
                className={`size-2 rounded-full ${
                  profile?.accept_direct_messages !== false ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              <span>{profile?.accept_direct_messages !== false ? 'Actif' : 'Suspendu'}</span>
            </button>
          </div>

          {/* Filtres & Recherche */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="inline-flex rounded-lg bg-zinc-200/70 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setMessagesFilter('all')}
                className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                  messagesFilter === 'all'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-medium'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Tous ({messages.length})
              </button>
              <button
                type="button"
                onClick={() => setMessagesFilter('unread')}
                className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                  messagesFilter === 'unread'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-medium'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Non lus ({unreadMessagesCount})
              </button>
            </div>

            <div className="relative flex-1 max-w-[170px]">
              <input
                type="text"
                value={messagesSearch}
                onChange={(e) => setMessagesSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none font-sans"
              />
              {messagesSearch && (
                <button
                  type="button"
                  onClick={() => setMessagesSearch('')}
                  className="absolute right-2 top-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Messages List (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {filteredMessages.length === 0 ? (
            <div className="py-12 text-center">
              <div className="size-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-2.5">
                <Icon name="messageSquare" className="size-5" />
              </div>
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {messagesSearch
                  ? 'Aucun résultat pour cette recherche'
                  : messagesFilter === 'unread'
                  ? 'Aucun message non lu. Tout est à jour !'
                  : 'Aucun message reçu pour le moment.'}
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const formattedDate = new Intl.DateTimeFormat('fr-FR', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date(msg.created_at))

              const cleanPhone = (msg.phone || '').replace(/[^0-9+]/g, '')
              const whatsappUrl = cleanPhone.startsWith('+')
                ? `https://wa.me/${cleanPhone.replace('+', '')}`
                : `https://wa.me/33${cleanPhone.replace(/^0/, '')}`

              return (
                <article
                  key={msg.id}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    !msg.is_read
                      ? 'border-indigo-500/40 bg-indigo-500/5 dark:bg-zinc-800/80 shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40'
                  }`}
                >
                  {/* Top Row : Nom, Badge lu/non-lu, Date */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {msg.name}
                        </h4>
                        {!msg.is_read && (
                          <span className="size-2 rounded-full bg-indigo-500 animate-pulse" />
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                        {formattedDate}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleRead(msg)}
                        className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 text-xs transition-colors cursor-pointer"
                        title={msg.is_read ? 'Marquer comme non lu' : 'Marquer comme lu'}
                      >
                        <Icon name={msg.is_read ? 'eyeOff' : 'check'} className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg)}
                        className="p-1 rounded hover:bg-rose-500/20 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs transition-colors cursor-pointer"
                        title="Supprimer définitivement"
                      >
                        <Icon name="trash" className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Coordonnées : Email et Téléphone */}
                  <div className="space-y-1 mb-2.5 text-xs font-mono">
                    <div className="text-zinc-600 dark:text-zinc-400 break-all flex items-center gap-1.5">
                      <Icon name="mail" className="size-3 text-indigo-500 shrink-0" />
                      <span>{msg.email}</span>
                    </div>
                    {msg.phone && (
                      <div className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                        <Icon name="phone" className="size-3 text-emerald-500 shrink-0" />
                        <span>{msg.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Contenu du message */}
                  <div className="p-3 rounded-lg bg-white dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed font-sans mb-3">
                    {msg.message}
                  </div>

                  {/* 3 Boutons d'Action Rapide en 1 clic */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* WhatsApp */}
                    <a
                      href={msg.phone ? whatsappUrl : '#'}
                      target={msg.phone ? '_blank' : undefined}
                      rel={msg.phone ? 'noopener noreferrer' : undefined}
                      onClick={(e) => {
                        if (!msg.phone) {
                          e.preventDefault()
                          alert('Aucun numéro de téléphone renseigné.')
                        }
                      }}
                      className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-[11px] font-mono transition-all ${
                        msg.phone
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 opacity-60 cursor-not-allowed border border-transparent'
                      }`}
                      title={msg.phone ? 'Ouvrir WhatsApp' : 'Téléphone non fourni'}
                    >
                      <Icon name="messageSquare" className="size-3" />
                      <span>WhatsApp</span>
                    </a>

                    {/* Appeler */}
                    <a
                      href={msg.phone ? `tel:${msg.phone}` : '#'}
                      onClick={(e) => {
                        if (!msg.phone) {
                          e.preventDefault()
                          alert('Aucun numéro de téléphone renseigné.')
                        }
                      }}
                      className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-[11px] font-mono transition-all ${
                        msg.phone
                          ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 opacity-60 cursor-not-allowed border border-transparent'
                      }`}
                      title={msg.phone ? 'Composer le numéro' : 'Téléphone non fourni'}
                    >
                      <Icon name="phone" className="size-3" />
                      <span>Appeler</span>
                    </a>

                    {/* Email */}
                    <a
                      href={`mailto:${msg.email}?subject=Suite à votre message sur le portfolio Angy.dev`}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-[11px] font-mono bg-zinc-200/70 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 transition-all"
                    >
                      <Icon name="mail" className="size-3" />
                      <span>Email</span>
                    </a>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </aside>

      {/* ============================================================== */}
      {/* ERGONOMIE MOBILE : FIXED BOTTOM NAVIGATION BAR                 */}
      {/* ============================================================== */}
      <nav
        aria-label="Navigation mobile d'administration"
        className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 flex justify-around items-center py-2 px-2 shadow-lg transition-colors"
      >
        {/* 1. Dashboard / Stats */}
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
            activeTab === 'analytics'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <Icon name="analytics" className="size-4.5" />
          <span>Dashboard</span>
        </button>

        {/* 2. Projets */}
        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
            activeTab === 'projects'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <Icon name="projects" className="size-4.5" />
          <span>Projets</span>
        </button>

        {/* 3. Compétences */}
        <button
          type="button"
          onClick={() => setActiveTab('skills')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
            activeTab === 'skills'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <Icon name="skills" className="size-4.5" />
          <span>Skills</span>
        </button>

        {/* 4. Profil */}
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
            activeTab === 'profile'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <Icon name="user" className="size-4.5" />
          <span>Profil</span>
        </button>
      </nav>
    </div>
  )
}
