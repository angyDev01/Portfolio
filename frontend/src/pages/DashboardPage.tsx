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

type AdminTab = 'analytics' | 'projects' | 'skills' | 'profile' | 'messages'

export default function DashboardPage(): ReactElement {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics')

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
      is_available: isAvail,
      status_label: defaultLabel,
    })

    if (res.ok) {
      setToast({ type: 'success', text: `Statut mis à jour : "${defaultLabel}".` })
      portfolioService.getProfile().then((p) => {
        if (p) setProfile(p)
      })
    } else {
      setToast({ type: 'error', text: res.error || 'Erreur mise à jour statut.' })
    }
  }

  const handleToggleAcceptMessages = async (): Promise<void> => {
    if (!profile) return
    const newAccept = !profile.accept_direct_messages
    setProfile({ ...profile, accept_direct_messages: newAccept })

    const res = await portfolioService.updateProfile({
      accept_direct_messages: newAccept,
    })

    if (res.ok) {
      setToast({
        type: 'success',
        text: newAccept
          ? 'Réception des messages directs activée.'
          : 'Réception des messages directs suspendue.',
      })
    } else {
      setProfile({ ...profile, accept_direct_messages: !newAccept })
      setToast({ type: 'error', text: 'Impossible de changer la réception des messages.' })
    }
  }

  const handleProfileSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    const paragraphs = profileForm.full_bio_text
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean)

    const res = await portfolioService.updateProfile({
      name: profileForm.name.trim(),
      alias: profileForm.alias.trim(),
      role: profileForm.role.trim(),
      short_bio: profileForm.short_bio.trim(),
      full_bio: paragraphs,
      github_url: profileForm.github_url.trim(),
      linkedin_url: profileForm.linkedin_url.trim(),
      twitter_url: profileForm.twitter_url.trim(),
      facebook_url: profileForm.facebook_url.trim(),
      availability_status: profileForm.availability_status,
      status_label: profileForm.status_label.trim(),
    })

    if (res.ok) {
      setToast({ type: 'success', text: 'Profil mis à jour avec succès.' })
      const updated = await portfolioService.getProfile()
      if (updated) setProfile(updated)
    } else {
      setToast({ type: 'error', text: res.error || 'Erreur enregistrement profil.' })
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
    // Résolution des compétences associées
    const matchedSkillIds = skills
      .filter((s) => p.skills.includes(s.name))
      .map((s) => s.id)

    setProjectForm({
      title: p.title,
      slug: p.slug,
      tagline: p.tagline,
      category: p.category,
      status: p.status || 'completed',
      summary: p.summary,
      description: p.description,
      demo_url: p.demo_url || '',
      repo_url: p.repo_url || '',
      image_url: p.images?.[0] || '',
      is_featured: p.is_featured,
      display_order: p.display_order,
      selectedSkills: matchedSkillIds,
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
    navigate('/', { replace: true })
  }

  return (
    <div className="pt-24 pb-24 md:pt-32 min-h-screen bg-zinc-950 text-zinc-100">
      <div className="container-custom max-w-6xl">
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs font-mono font-medium text-indigo-400 uppercase tracking-widest">
                Supabase Auth Authenticated
              </p>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-100">
              Tableau de Bord Administrateur
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Supervision complète du portfolio, projets, compétences et messagerie directe.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadAllData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 text-xs font-mono transition-all cursor-pointer"
              title="Rafraîchir toutes les données"
            >
              <Icon name="refresh" className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-300 text-xs font-mono transition-all cursor-pointer"
            >
              <Icon name="logout" className="size-3.5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        {/* Toast de notification */}
        {toast && (
          <div
            className={`mb-6 p-3 rounded-lg border text-xs font-mono flex items-center gap-2.5 transition-all ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <Icon name={toast.type === 'success' ? 'check' : 'alert'} className="size-4" />
            <span>{toast.text}</span>
          </div>
        )}

        {/* NAVIGATION PAR ONGLETS */}
        <nav
          aria-label="Onglets d'administration"
          className="flex items-center gap-2 border-b border-zinc-800 pb-4 mb-8 overflow-x-auto no-scrollbar"
        >
          {/* A. Vue d'ensemble */}
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-mono transition-all shrink-0 cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-zinc-800 text-white border border-zinc-700/80 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Icon name="analytics" className="size-4 text-indigo-400" />
            <span>Vue d'ensemble & Analytics</span>
          </button>

          {/* B. Projets */}
          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-mono transition-all shrink-0 cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-zinc-800 text-white border border-zinc-700/80 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Icon name="projects" className="size-4 text-indigo-400" />
            <span>Projets ({projects.length})</span>
          </button>

          {/* C. Compétences */}
          <button
            type="button"
            onClick={() => setActiveTab('skills')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-mono transition-all shrink-0 cursor-pointer ${
              activeTab === 'skills'
                ? 'bg-zinc-800 text-white border border-zinc-700/80 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Icon name="skills" className="size-4 text-indigo-400" />
            <span>Compétences ({skills.length})</span>
          </button>

          {/* D. Profil & Disponibilité */}
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-mono transition-all shrink-0 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-zinc-800 text-white border border-zinc-700/80 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Icon name="user" className="size-4 text-indigo-400" />
            <span>Profil & Disponibilité</span>
          </button>

          {/* E. Messagerie Interne avec Badge Rouge Dynamique */}
          <button
            type="button"
            onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-mono transition-all shrink-0 cursor-pointer relative ${
              activeTab === 'messages'
                ? 'bg-zinc-800 text-white border border-zinc-700/80 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <div className="relative flex items-center">
              <Icon name="messageSquare" className="size-4 text-indigo-400" />
              {unreadMessagesCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold font-mono animate-pulse">
                  {unreadMessagesCount}
                </span>
              )}
            </div>
            <span>Messagerie Directe</span>
          </button>
        </nav>

        {/* ============================================================== */}
        {/* A. ONGLET VUE D'ENSEMBLE & ANALYTICS (Recharts)                */}
        {/* ============================================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* 4 Cartes d'indicateurs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Carte 1 : Total Visites avec Tendance */}
              <div className="glass-card p-5 border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    Total Visites
                  </span>
                  <div className="size-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Icon name="analytics" className="size-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-zinc-100">
                    {analytics.totalViews}
                  </span>
                  <span
                    className={`text-xs font-mono font-medium flex items-center gap-0.5 ${
                      analytics.viewsTrendPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    <Icon name="trending" className="size-3" />
                    <span>{analytics.viewsTrendPercent >= 0 ? `+${analytics.viewsTrendPercent}%` : `${analytics.viewsTrendPercent}%`}</span>
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono mt-1">sur les {analyticsRange} derniers jours</p>
              </div>

              {/* Carte 2 : Messages reçus avec badge d'alerte */}
              <div className="glass-card p-5 border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    Messages Reçus
                  </span>
                  <div className="relative size-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Icon name="messageSquare" className="size-4" />
                    {unreadMessagesCount > 0 && (
                      <span className="absolute -top-1 -right-1 size-3 rounded-full bg-rose-500 animate-ping" />
                    )}
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-zinc-100">
                    {messages.length}
                  </span>
                  {unreadMessagesCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-bold">
                      {unreadMessagesCount} non lus
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 font-mono mt-1">via Canal 2 (site)</p>
              </div>

              {/* Carte 3 : Projets à la une */}
              <div className="glass-card p-5 border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    Projets à la une
                  </span>
                  <div className="size-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Icon name="sparkles" className="size-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-zinc-100">
                    {projects.filter((p) => p.is_featured).length}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">/ {projects.length} projets</span>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono mt-1">affichés sur la page d'accueil</p>
              </div>

              {/* Carte 4 : Projets en cours vs terminés */}
              <div className="glass-card p-5 border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    État des Projets
                  </span>
                  <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Icon name="projects" className="size-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-indigo-400">
                    {projects.filter((p) => p.status === 'in_progress').length}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">en cours</span>
                  <span className="text-zinc-600 font-mono">|</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">
                    {projects.filter((p) => p.status !== 'in_progress').length}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">terminés</span>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono mt-1">avancement global</p>
              </div>
            </div>

            {/* Graphique Recharts Interactif */}
            <div className="glass-card p-6 border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100">
                    Évolution de l'Audience & Messagerie
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Suivi quotidien des consultations de pages et des soumissions de messages.
                  </p>
                </div>

                <div className="inline-flex rounded-lg bg-zinc-900 border border-zinc-800 p-1 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setAnalyticsRange(7)}
                    className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                      analyticsRange === 7
                        ? 'bg-zinc-800 text-zinc-100 font-medium'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    7 jours
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalyticsRange(30)}
                    className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                      analyticsRange === 30
                        ? 'bg-zinc-800 text-zinc-100 font-medium'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    30 jours
                  </button>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="visitesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="messagesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={11} fontFamily="monospace" />
                    <YAxis stroke="#71717a" fontSize={11} fontFamily="monospace" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: '#f4f4f5',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="visites"
                      name="Visites (page_views)"
                      stroke="#818cf8"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#visitesGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="messages"
                      name="Messages (Canal 2)"
                      stroke="#34d399"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#messagesGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-6 mt-4 text-xs font-mono text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-indigo-400" />
                  <span>Pages Vues (visites)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-emerald-400" />
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
                <h2 className="text-xl font-bold text-zinc-100">Gestion des Projets</h2>
                <p className="text-xs text-zinc-400">Ajoutez, modifiez ou supprimez vos réalisations.</p>
              </div>
              <button
                type="button"
                onClick={openProjectCreate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-xs font-mono transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                <Icon name="plus" className="size-4" />
                <span>Nouveau Projet</span>
              </button>
            </div>

            {/* Liste des projets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((p) => (
                <div key={p.id} className="glass-card p-5 border-zinc-800 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                            p.status === 'in_progress'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {p.status === 'in_progress' ? 'En cours' : 'Terminé'}
                        </span>
                        {p.is_featured && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            ★ À la une
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500">#{p.display_order}</span>
                    </div>

                    <h3 className="text-base font-bold text-zinc-100 mb-1">{p.title}</h3>
                    <p className="text-xs text-indigo-300 font-mono mb-2">{p.tagline}</p>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">{p.summary}</p>

                    <div className="flex flex-wrap gap-1.5">
                      {p.skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60 mt-2">
                    <span className="text-[11px] font-mono text-zinc-500">{p.category}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openProjectEdit(p)}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs transition-colors cursor-pointer"
                        title="Modifier le projet"
                      >
                        <Icon name="pencil" className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(p)}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 border border-zinc-800 text-xs transition-colors cursor-pointer"
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
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
                <div className="glass-card max-w-2xl w-full p-6 sm:p-8 border-zinc-700 my-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-zinc-100">
                      {editingProject ? 'Modifier le Projet' : 'Ajouter un Projet'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setProjectModalOpen(false)}
                      className="text-zinc-400 hover:text-zinc-200 text-lg cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleProjectSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-zinc-300 mb-1">Titre *</label>
                        <input
                          type="text"
                          required
                          value={projectForm.title}
                          onChange={(e) => {
                            const val = e.target.value
                            setProjectForm({
                              ...projectForm,
                              title: val,
                              slug: projectForm.slug || val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                            })
                          }}
                          placeholder="Ex: SaaS Analytics Hub"
                          className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-zinc-300 mb-1">Slug (URL) *</label>
                        <input
                          type="text"
                          required
                          value={projectForm.slug}
                          onChange={(e) => setProjectForm({ ...projectForm, slug: e.target.value })}
                          placeholder="saas-analytics-hub"
                          className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-zinc-300 mb-1">Description courte (Tagline) *</label>
                      <input
                        type="text"
                        required
                        value={projectForm.tagline}
                        onChange={(e) => setProjectForm({ ...projectForm, tagline: e.target.value })}
                        placeholder="Plateforme cloud d'analyse de métriques en temps réel"
                        className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-zinc-300 mb-1">Catégorie</label>
                        <select
                          value={projectForm.category}
                          onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none"
                        >
                          <option value="Full-Stack">Full-Stack</option>
                          <option value="Frontend">Frontend</option>
                          <option value="APIs">APIs</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-zinc-300 mb-1">Statut *</label>
                        <select
                          value={projectForm.status}
                          onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value as ProjectStatusType })}
                          className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none"
                        >
                          <option value="completed">Terminé</option>
                          <option value="in_progress">En cours</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-zinc-300 mb-1">Ordre</label>
                        <input
                          type="number"
                          value={projectForm.display_order}
                          onChange={(e) => setProjectForm({ ...projectForm, display_order: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-zinc-300 mb-1">Lien Démo (URL)</label>
                        <input
                          type="url"
                          value={projectForm.demo_url}
                          onChange={(e) => setProjectForm({ ...projectForm, demo_url: e.target.value })}
                          placeholder="https://demo.angy.dev"
                          className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-zinc-300 mb-1">Lien GitHub (URL)</label>
                        <input
                          type="url"
                          value={projectForm.repo_url}
                          onChange={(e) => setProjectForm({ ...projectForm, repo_url: e.target.value })}
                          placeholder="https://github.com/..."
                          className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-zinc-300 mb-1">Image (URL)</label>
                        <input
                          type="text"
                          value={projectForm.image_url}
                          onChange={(e) => setProjectForm({ ...projectForm, image_url: e.target.value })}
                          placeholder="/assets/projects/..."
                          className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-zinc-300 mb-1">Résumé court *</label>
                      <textarea
                        rows={2}
                        required
                        value={projectForm.summary}
                        onChange={(e) => setProjectForm({ ...projectForm, summary: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none resize-y"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-zinc-300 mb-1">Description détaillée *</label>
                      <textarea
                        rows={3}
                        required
                        value={projectForm.description}
                        onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none resize-y"
                      />
                    </div>

                    {/* Sélection des compétences liées */}
                    <div>
                      <label className="block text-xs font-mono text-zinc-300 mb-2">
                        Compétences associées
                      </label>
                      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                        {skills.map((s) => {
                          const isSelected = projectForm.selectedSkills.includes(s.id)
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                const next = isSelected
                                  ? projectForm.selectedSkills.filter((id) => id !== s.id)
                                  : [...projectForm.selectedSkills, s.id]
                                setProjectForm({ ...projectForm, selectedSkills: next })
                              }}
                              className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-500 text-white font-semibold'
                                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                              }`}
                            >
                              {s.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-zinc-300">
                        <input
                          type="checkbox"
                          checked={projectForm.is_featured}
                          onChange={(e) => setProjectForm({ ...projectForm, is_featured: e.target.checked })}
                          className="size-4 rounded accent-indigo-500"
                        />
                        <span>Mettre à la une sur la Home (is_featured)</span>
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setProjectModalOpen(false)}
                        className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-mono cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-mono font-semibold cursor-pointer shadow-lg shadow-indigo-500/20"
                      >
                        {editingProject ? 'Enregistrer les modifications' : 'Créer le projet'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* C. ONGLET COMPÉTENCES (SKILLS)                                 */}
        {/* ============================================================== */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-100">Gestion des Compétences</h2>
                <p className="text-xs text-zinc-400">Gérez votre palette technologique et outils.</p>
              </div>
              <button
                type="button"
                onClick={openSkillCreate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-xs font-mono transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                <Icon name="plus" className="size-4" />
                <span>Nouvelle Compétence</span>
              </button>
            </div>

            {/* Grille des compétences */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {skills.map((s) => (
                <div key={s.id} className="glass-card p-4 border-zinc-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 truncate">
                    <div className="size-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <Icon name={(s.icon as any) || 'code'} className="size-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-100 truncate">{s.name}</span>
                        {s.is_featured && (
                          <span className="size-1.5 rounded-full bg-indigo-400" title="Featured" />
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                        {s.category} • #{s.display_order}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openSkillEdit(s)}
                      className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-xs transition-colors cursor-pointer"
                      title="Modifier"
                    >
                      <Icon name="pencil" className="size-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSkill(s)}
                      className="p-1 rounded bg-zinc-900 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 border border-zinc-800 text-xs transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <Icon name="trash" className="size-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Compétence */}
            {skillModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="glass-card max-w-md w-full p-6 border-zinc-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-zinc-100">
                      {editingSkill ? 'Modifier la Compétence' : 'Ajouter une Compétence'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSkillModalOpen(false)}
                      className="text-zinc-400 hover:text-zinc-200 text-lg cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSkillSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono text-zinc-300 mb-1">Nom *</label>
                      <input
                        type="text"
                        required
                        value={skillForm.name}
                        onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                        placeholder="Ex: React, TypeScript, Docker..."
                        className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-mono text-zinc-300 mb-1">Catégorie</label>
                        <select
                          value={skillForm.category}
                          onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value as SkillCategoryType })}
                          className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none"
                        >
                          <option value="frontend">Frontend</option>
                          <option value="backend">Backend</option>
                          <option value="database">Database</option>
                          <option value="tools">Tools</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-zinc-300 mb-1">Nom Icône</label>
                        <input
                          type="text"
                          value={skillForm.icon}
                          onChange={(e) => setSkillForm({ ...skillForm, icon: e.target.value })}
                          placeholder="code, frontend, database..."
                          className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-mono text-zinc-300 mb-1">Ordre</label>
                        <input
                          type="number"
                          value={skillForm.display_order}
                          onChange={(e) => setSkillForm({ ...skillForm, display_order: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-zinc-300">
                          <input
                            type="checkbox"
                            checked={skillForm.is_featured}
                            onChange={(e) => setSkillForm({ ...skillForm, is_featured: e.target.checked })}
                            className="size-4 rounded accent-indigo-500"
                          />
                          <span>À la une</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-zinc-300 mb-1">Description (optionnelle)</label>
                      <input
                        type="text"
                        value={skillForm.description}
                        onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })}
                        placeholder="Brève description..."
                        className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setSkillModalOpen(false)}
                        className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-mono cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-mono font-semibold cursor-pointer shadow-lg shadow-indigo-500/20"
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
        {/* D. ONGLET PROFIL & DISPONIBILITÉ (3 Statuts)                   */}
        {/* ============================================================== */}
        {activeTab === 'profile' && (
          <div className="space-y-8 max-w-3xl">
            {/* Carte de contrôle du statut de disponibilité à 3 options */}
            <div className="glass-card p-6 border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-100 mb-1">
                Statut de Disponibilité Public
              </h2>
              <p className="text-xs text-zinc-400 mb-5">
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
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="relative flex size-2.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                      Disponible
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
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
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="relative flex size-2.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-indigo-500" />
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-400 uppercase">
                      En poste
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Badge bleu/violet discret : actuellement en mission ou en emploi.
                  </p>
                </button>

                {/* 3. Non disponible (Ambre / Gris) */}
                <button
                  type="button"
                  onClick={() => handleUpdateAvailability('unavailable')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-2 ${
                    profileForm.availability_status === 'unavailable'
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                      Non disponible
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Badge ambre : indisponible pour le moment ou en congé.
                  </p>
                </button>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                  Libellé personnalisé affiché dans le badge Hero
                </label>
                <input
                  type="text"
                  value={profileForm.status_label}
                  onChange={(e) => setProfileForm({ ...profileForm, status_label: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Formulaire des bios et réseaux */}
            <form onSubmit={handleProfileSubmit} className="glass-card p-6 border-zinc-800 space-y-5">
              <h2 className="text-lg font-bold text-zinc-100">Informations & Bios</h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1">Nom complet *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1">Alias / Surnom</label>
                  <input
                    type="text"
                    value={profileForm.alias}
                    onChange={(e) => setProfileForm({ ...profileForm, alias: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1">Rôle</label>
                  <input
                    type="text"
                    value={profileForm.role}
                    onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1">
                  Bio courte (Section Hero) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={profileForm.short_bio}
                  onChange={(e) => setProfileForm({ ...profileForm, short_bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1">
                  Bio détaillée (Section À propos — séparez les paragraphes par une ligne vide) *
                </label>
                <textarea
                  rows={6}
                  required
                  value={profileForm.full_bio_text}
                  onChange={(e) => setProfileForm({ ...profileForm, full_bio_text: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none resize-y leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1">URL GitHub</label>
                  <input
                    type="url"
                    value={profileForm.github_url}
                    onChange={(e) => setProfileForm({ ...profileForm, github_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1">URL LinkedIn</label>
                  <input
                    type="url"
                    value={profileForm.linkedin_url}
                    onChange={(e) => setProfileForm({ ...profileForm, linkedin_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1">URL X (Twitter)</label>
                  <input
                    type="url"
                    value={profileForm.twitter_url}
                    onChange={(e) => setProfileForm({ ...profileForm, twitter_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1">URL Facebook</label>
                  <input
                    type="url"
                    value={profileForm.facebook_url}
                    onChange={(e) => setProfileForm({ ...profileForm, facebook_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-800">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-xs font-mono transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
                >
                  Enregistrer les modifications du Profil
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* E. ONGLET MESSAGERIE INTERNE (Canal 2 Direct)                  */}
        {/* ============================================================== */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            {/* Header avec bouton commutateur d'activation/suspension des messages directs */}
            <div className="glass-card p-5 border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-zinc-100">
                    Messagerie Directe (Canal 2)
                  </h2>
                  {unreadMessagesCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold">
                      {unreadMessagesCount} non lus
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Messages transmis instantanément par les visiteurs depuis le site public.
                </p>
              </div>

              {/* Bouton commutateur : Activer / Suspendre la réception de messages directs */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-zinc-300">
                  Réception directe :
                </span>
                <button
                  type="button"
                  onClick={handleToggleAcceptMessages}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    profile?.accept_direct_messages !== false
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  <span
                    className={`size-2 rounded-full ${
                      profile?.accept_direct_messages !== false ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                  <span>
                    {profile?.accept_direct_messages !== false ? 'Actif' : 'Suspendu'}
                  </span>
                </button>
              </div>
            </div>

            {/* Barre de filtres et recherche */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="inline-flex rounded-lg bg-zinc-900 border border-zinc-800 p-1 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setMessagesFilter('all')}
                  className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                    messagesFilter === 'all'
                      ? 'bg-zinc-800 text-zinc-100 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Tous ({messages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMessagesFilter('unread')}
                  className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors flex items-center gap-1.5 ${
                    messagesFilter === 'unread'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>Non lus</span>
                  {unreadMessagesCount > 0 && (
                    <span className="size-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {unreadMessagesCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMessagesFilter('read')}
                  className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                    messagesFilter === 'read'
                      ? 'bg-zinc-800 text-zinc-100 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Lus ({messages.length - unreadMessagesCount})
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={messagesSearch}
                  onChange={(e) => setMessagesSearch(e.target.value)}
                  placeholder="Rechercher nom, email, tél, message..."
                  className="w-full sm:w-64 px-3 py-1.5 text-xs rounded-lg bg-zinc-950/80 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-400 focus:outline-none font-sans"
                />
                {messagesSearch && (
                  <button
                    type="button"
                    onClick={() => setMessagesSearch('')}
                    className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Liste des messages */}
            {filteredMessages.length === 0 ? (
              <div className="glass-card p-12 text-center border-dashed border-zinc-800">
                <div className="size-12 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 flex items-center justify-center mx-auto mb-3">
                  <Icon name="messageSquare" className="size-6" />
                </div>
                <h3 className="text-base font-semibold text-zinc-200 mb-1">
                  {messagesSearch
                    ? 'Aucun message ne correspond à votre recherche.'
                    : messagesFilter === 'unread'
                    ? 'Aucun message non lu. Tout est traité !'
                    : 'Aucun message reçu via le Canal 2.'}
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Les messages envoyés par les visiteurs depuis la section contact apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMessages.map((msg) => {
                  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                  }).format(new Date(msg.created_at))

                  const cleanPhone = (msg.phone || '').replace(/[^0-9+]/g, '')
                  const whatsappUrl = cleanPhone.startsWith('+')
                    ? `https://wa.me/${cleanPhone.replace('+', '')}`
                    : `https://wa.me/33${cleanPhone.replace(/^0/, '')}`

                  return (
                    <article
                      key={msg.id}
                      className={`glass-card p-5 sm:p-6 transition-all duration-200 ${
                        !msg.is_read
                          ? 'border-indigo-500/40 bg-zinc-900/90 shadow-md shadow-indigo-500/5'
                          : 'border-zinc-800/80 bg-zinc-900/40'
                      }`}
                    >
                      {/* En-tête : Nom, Statut, Date */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-800/60 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-300 font-mono font-bold text-sm">
                            {msg.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-zinc-100">{msg.name}</h3>
                              {!msg.is_read ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  <span className="size-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                  Non lu
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-zinc-400 bg-zinc-800 border border-zinc-700">
                                  <Icon name="check" className="size-2.5" />
                                  Lu
                                </span>
                              )}
                            </div>
                            <time dateTime={msg.created_at} className="text-xs font-mono text-zinc-400">
                              {formattedDate}
                            </time>
                          </div>
                        </div>

                        {/* Actions : Marquer lu / non lu et Supprimer */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleToggleRead(msg)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                              msg.is_read
                                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                                : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-medium'
                            }`}
                          >
                            <Icon name={msg.is_read ? 'eyeOff' : 'check'} className="size-3.5" />
                            <span>{msg.is_read ? 'Marquer non lu' : 'Marquer comme lu'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg)}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 border border-zinc-800 text-xs transition-colors cursor-pointer"
                            title="Supprimer définitivement"
                          >
                            <Icon name="trash" className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 3 BOUTONS D'ACTION RAPIDE EN 1 CLIC (WhatsApp, Appeler, Email) */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                        {/* 1. WhatsApp */}
                        <a
                          href={msg.phone ? whatsappUrl : '#'}
                          target={msg.phone ? '_blank' : undefined}
                          rel={msg.phone ? 'noopener noreferrer' : undefined}
                          onClick={(e) => {
                            if (!msg.phone) {
                              e.preventDefault()
                              alert('Aucun numéro de téléphone renseigné pour ce contact.')
                            }
                          }}
                          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-mono transition-all ${
                            msg.phone
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 cursor-pointer'
                              : 'bg-zinc-900 text-zinc-500 border border-zinc-800 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <Icon name="messageSquare" className="size-3.5" />
                          <span>WhatsApp en 1 clic</span>
                        </a>

                        {/* 2. Appeler */}
                        <a
                          href={msg.phone ? `tel:${msg.phone}` : '#'}
                          onClick={(e) => {
                            if (!msg.phone) {
                              e.preventDefault()
                              alert('Aucun numéro de téléphone renseigné pour ce contact.')
                            }
                          }}
                          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-mono transition-all ${
                            msg.phone
                              ? 'bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 cursor-pointer'
                              : 'bg-zinc-900 text-zinc-500 border border-zinc-800 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <Icon name="phone" className="size-3.5" />
                          <span>Appeler ({msg.phone || 'Non renseigné'})</span>
                        </a>

                        {/* 3. Email */}
                        <a
                          href={`mailto:${msg.email}?subject=Suite à votre message sur le portfolio Angy.dev`}
                          className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-mono bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition-all cursor-pointer"
                        >
                          <Icon name="mail" className="size-3.5" />
                          <span>Email ({msg.email})</span>
                        </a>
                      </div>

                      {/* Corps du message */}
                      <div className="rounded-lg bg-zinc-950/60 border border-zinc-800/60 p-4">
                        <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
                          Message complet :
                        </p>
                        <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed font-sans">
                          {msg.message}
                        </p>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
