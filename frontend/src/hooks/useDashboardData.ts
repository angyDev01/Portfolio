import { useState, useEffect, useCallback } from 'react'
import { portfolioService } from '../services/portfolioService'
import type {
  DbProfile,
  DbProject,
  DbSkill,
  ContactMessage,
  AnalyticsStats,
  AnalyticsRange,
  AvailabilityStatusType,
  SkillCategoryType,
  ProjectCategoryType,
  ProjectStatusType,
  AnnouncementWithComments,
  PollWithResults,
} from '../types/database'
import type { SaveAnnouncementInput } from '../services/announcementService'
import type { CreatePollInput } from '../services/pollService'
import {
  type BannerPosition,
  stripBannerPosition,
  withBannerPosition,
} from '../utils/bannerPosition'

export interface ProjectFormData {
  title: string
  slug: string
  tagline: string
  category: ProjectCategoryType
  status: ProjectStatusType
  summary: string
  description: string
  cover_image_url: string | null
  demo_url: string | null
  repo_url: string | null
  is_featured: boolean
  display_order: number
}

export interface ToastState {
  type: 'success' | 'error'
  text: string
}

export function useDashboardData() {
  const [loading, setLoading] = useState<boolean>(true)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [profile, setProfile] = useState<DbProfile | null>(null)
  const [projects, setProjects] = useState<DbProject[]>([])
  const [skills, setSkills] = useState<DbSkill[]>([])
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [analyticsRange, setAnalyticsRange] = useState<AnalyticsRange>(7)
  const [analytics, setAnalytics] = useState<AnalyticsStats>({
    totalViews: 0,
    views7d: 0,
    viewsTrendPercent: 0,
    totalMessages: 0,
    unreadMessages: 0,
    featuredProjects: 0,
    inProgressProjects: 0,
    completedProjects: 0,
    conversionRate: 0,
    topPages: [],
    skillCategoryStats: [],
    chartData: [],
  })

  const [savingProject, setSavingProject] = useState<boolean>(false)
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false)
  const [uploadingBanner, setUploadingBanner] = useState<boolean>(false)
  const [announcements, setAnnouncements] = useState<AnnouncementWithComments[]>([])
  const [polls, setPolls] = useState<PollWithResults[]>([])

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    setToast({ type, text })
  }, [])

  // Chargement global des données (hors changement de plage Analytics)
  const loadAllData = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const [profData, projsData, sksData, msgsRes, annAdminRes, pollsDetailed] =
        await Promise.all([
          portfolioService.getProfile(),
          portfolioService.getProjects(),
          portfolioService.getSkills(),
          portfolioService.getAdminMessages(),
          portfolioService.getAnnouncementsAdmin(),
          portfolioService.getPollsWithResultsDetailed(),
        ])

      if (profData) {
        setProfile(profData)
      }
      setProjects(projsData)
      setSkills(sksData)
      if (msgsRes.ok) {
        setMessages(msgsRes.messages)
      }
      setAnnouncements(annAdminRes.items)
      setPolls(pollsDetailed.polls)
    } catch (err) {
      console.error('Error loading admin data:', err)
      showToast('error', 'Erreur lors du chargement des données.')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // Chargement indépendant des statistiques Analytics (ne recharge pas tout le dashboard)
  useEffect(() => {
    let active = true
    portfolioService
      .getAnalyticsStats(analyticsRange)
      .then((anRes) => {
        if (active) setAnalytics(anRes)
      })
      .catch((err) => {
        console.error('Error loading analytics:', err)
      })
    return () => {
      active = false
    }
  }, [analyticsRange])

  // ==========================================
  // GESTION DU PROFIL & STATUT
  // ==========================================

  const updateAvailability = useCallback(
    async (status: AvailabilityStatusType): Promise<boolean> => {
      let defaultLabel = 'Disponible pour de nouvelles opportunités'
      let isAvail = true
      if (status === 'employed') {
        defaultLabel = 'En poste / Actuellement en mission'
        isAvail = false
      } else if (status === 'unavailable') {
        defaultLabel = 'Non disponible pour le moment'
        isAvail = false
      }

      const res = await portfolioService.updateProfile({
        availability_status: status,
        status_label: defaultLabel,
        is_available: isAvail,
      })

      if (res.ok) {
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
        showToast('success', `Statut mis à jour : ${defaultLabel}`)
        return true
      } else {
        showToast('error', res.error || 'Erreur mise à jour statut.')
        return false
      }
    },
    [showToast]
  )

  const updateProfile = useCallback(
    async (payload: Partial<DbProfile>): Promise<boolean> => {
      const res = await portfolioService.updateProfile(payload)
      if (res.ok) {
        showToast('success', 'Profil mis à jour avec succès.')
        const updated = await portfolioService.getProfile()
        if (updated) setProfile(updated)
        return true
      } else {
        showToast('error', res.error || 'Erreur lors de la mise à jour du profil.')
        return false
      }
    },
    [showToast]
  )

  const uploadAvatar = useCallback(
    async (file: File): Promise<boolean> => {
      const previousAvatarUrl = profile?.avatar_url
      setUploadingAvatar(true)
      try {
        const res = await portfolioService.uploadMedia(file, 'avatars')
        if (!res.ok || !res.url) {
          showToast('error', res.error || 'Erreur lors du téléversement de l’avatar.')
          return false
        }

        const publicUrl = res.url
        const saveRes = await portfolioService.updateProfile({ avatar_url: publicUrl })
        if (!saveRes.ok) {
          showToast('error', saveRes.error || 'Erreur lors de la sauvegarde de l’avatar.')
          return false
        }

        setProfile((prev) =>
          prev ? { ...prev, avatar_url: publicUrl } : ({ avatar_url: publicUrl } as DbProfile)
        )

        if (previousAvatarUrl && previousAvatarUrl !== publicUrl) {
          await portfolioService.deleteMedia(previousAvatarUrl)
        }

        showToast('success', 'Photo de profil mise à jour et enregistrée !')
        return true
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur inattendue lors de l’upload.'
        showToast('error', msg)
        return false
      } finally {
        setUploadingAvatar(false)
      }
    },
    [profile?.avatar_url, showToast]
  )

  const removeAvatar = useCallback(async (): Promise<boolean> => {
    const previousAvatarUrl = profile?.avatar_url
    const saveRes = await portfolioService.updateProfile({ avatar_url: '' })
    if (saveRes.ok) {
      setProfile((prev) => (prev ? { ...prev, avatar_url: '' } : null))
      if (previousAvatarUrl) {
        await portfolioService.deleteMedia(previousAvatarUrl)
      }
      showToast('success', 'Photo de profil retirée avec succès.')
      return true
    } else {
      showToast('error', saveRes.error || 'Erreur lors du retrait de la photo.')
      return false
    }
  }, [profile?.avatar_url, showToast])

  const uploadBanner = useCallback(
    async (file: File): Promise<boolean> => {
      const previousBannerUrl = profile?.banner_url
      setUploadingBanner(true)
      try {
        const res = await portfolioService.uploadMedia(file, 'banners')
        if (!res.ok || !res.url) {
          showToast('error', res.error || 'Erreur lors du téléversement de la bannière.')
          return false
        }

        const publicUrl = res.url
        const saveRes = await portfolioService.updateProfile({ banner_url: publicUrl })
        if (!saveRes.ok) {
          showToast('error', saveRes.error || 'Erreur lors de la sauvegarde de la bannière.')
          return false
        }

        setProfile((prev) =>
          prev ? { ...prev, banner_url: publicUrl } : ({ banner_url: publicUrl } as DbProfile)
        )

        if (previousBannerUrl && stripBannerPosition(previousBannerUrl) !== stripBannerPosition(publicUrl)) {
          await portfolioService.deleteMedia(previousBannerUrl)
        }

        showToast('success', 'Bannière de couverture mise à jour !')
        return true
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur inattendue lors de l’upload.'
        showToast('error', msg)
        return false
      } finally {
        setUploadingBanner(false)
      }
    },
    [profile?.banner_url, showToast]
  )

  const removeBanner = useCallback(async (): Promise<boolean> => {
    const previousBannerUrl = profile?.banner_url
    const saveRes = await portfolioService.updateProfile({ banner_url: '' })
    if (saveRes.ok) {
      setProfile((prev) => (prev ? { ...prev, banner_url: '' } : null))
      if (previousBannerUrl) {
        await portfolioService.deleteMedia(previousBannerUrl)
      }
      showToast('success', 'Bannière retirée avec succès.')
      return true
    } else {
      showToast('error', saveRes.error || 'Erreur lors du retrait de la bannière.')
      return false
    }
  }, [profile?.banner_url, showToast])

  const updateBannerPosition = useCallback(
    async (position: BannerPosition): Promise<boolean> => {
      if (!profile?.banner_url) return false
      const updatedUrl = withBannerPosition(profile.banner_url, position)
      if (updatedUrl === profile.banner_url) return true

      const previousUrl = profile.banner_url
      setProfile((prev) => (prev ? { ...prev, banner_url: updatedUrl } : prev))

      const saveRes = await portfolioService.updateProfile({ banner_url: updatedUrl })
      if (!saveRes.ok) {
        setProfile((prev) => (prev ? { ...prev, banner_url: previousUrl } : prev))
        showToast('error', saveRes.error || 'Erreur lors de la mise à jour du cadrage.')
        return false
      }

      showToast('success', 'Cadrage de la bannière enregistré !')
      return true
    },
    [profile?.banner_url, showToast]
  )

  const toggleAcceptMessages = useCallback(async (): Promise<boolean> => {
    const currentStatus = profile?.accept_direct_messages !== false
    const newStatus = !currentStatus

    setProfile((prev) => (prev ? { ...prev, accept_direct_messages: newStatus } : null))

    const res = await portfolioService.updateProfile({
      accept_direct_messages: newStatus,
    })

    if (res.ok) {
      showToast(
        'success',
        newStatus
          ? 'Réception des messages directs activée.'
          : 'Réception des messages directs suspendue (formulaire masqué sur le site).'
      )
      return true
    } else {
      setProfile((prev) => (prev ? { ...prev, accept_direct_messages: currentStatus } : null))
      showToast('error', 'Impossible de changer le statut de réception.')
      return false
    }
  }, [profile?.accept_direct_messages, showToast])

  // ==========================================
  // GESTION DES PROJETS
  // ==========================================

  const saveProject = useCallback(
    async (
      editingId: string | null,
      projectData: ProjectFormData,
      selectedSkills: string[],
      newCoverFile: File | null
    ): Promise<boolean> => {
      setSavingProject(true)
      try {
        let finalCoverUrl = projectData.cover_image_url

        if (newCoverFile) {
          const uploadRes = await portfolioService.uploadMedia(newCoverFile, 'projects')
          if (!uploadRes.ok || !uploadRes.url) {
            showToast(
              'error',
              uploadRes.error || 'Erreur lors du téléversement de la capture du projet.'
            )
            return false
          }
          finalCoverUrl = uploadRes.url
        }

        const images = finalCoverUrl ? [finalCoverUrl] : []
        const finalProjectData = {
          ...projectData,
          cover_image_url: finalCoverUrl,
          images,
        }

        if (editingId) {
          const res = await portfolioService.updateProject(
            editingId,
            finalProjectData,
            selectedSkills
          )
          if (res.ok) {
            showToast('success', 'Projet modifié avec succès.')
            const updated = await portfolioService.getProjects()
            setProjects(updated)
            return true
          } else {
            showToast('error', res.error || 'Erreur modification projet.')
            return false
          }
        } else {
          const res = await portfolioService.createProject(finalProjectData, selectedSkills)
          if (res.ok) {
            showToast('success', 'Projet créé avec succès.')
            const updated = await portfolioService.getProjects()
            setProjects(updated)
            return true
          } else {
            showToast('error', res.error || 'Erreur création projet.')
            return false
          }
        }
      } finally {
        setSavingProject(false)
      }
    },
    [showToast]
  )

  const deleteProject = useCallback(
    async (p: DbProject): Promise<boolean> => {
      const confirmDel = window.confirm(`Supprimer définitivement le projet "${p.title}" ?`)
      if (!confirmDel) return false

      const res = await portfolioService.deleteProject(p.id)
      if (res.ok) {
        showToast('success', 'Projet supprimé.')
        setProjects((prev) => prev.filter((item) => item.id !== p.id))
        return true
      } else {
        showToast('error', res.error || 'Erreur suppression projet.')
        return false
      }
    },
    [showToast]
  )

  // ==========================================
  // GESTION DES COMPÉTENCES
  // ==========================================

  const saveSkill = useCallback(
    async (
      editingId: string | null,
      skillData: {
        name: string
        category: SkillCategoryType
        icon: string
        description?: string
        display_order: number
        is_featured: boolean
      }
    ): Promise<boolean> => {
      const normalizedCategory = (
        skillData.category ? skillData.category.toLowerCase().trim() : 'frontend'
      ) as SkillCategoryType

      const payload = {
        name: skillData.name.trim(),
        category: normalizedCategory,
        icon: skillData.icon.trim() || 'code',
        description: skillData.description?.trim() || undefined,
        display_order: Number(skillData.display_order) || 0,
        is_featured: skillData.is_featured,
      }

      if (editingId) {
        const res = await portfolioService.updateSkill(editingId, payload)
        if (res.ok) {
          showToast('success', 'Compétence mise à jour avec succès.')
          const updated = await portfolioService.getSkills()
          setSkills(updated)
          return true
        } else {
          showToast('error', res.error || 'Erreur modification compétence.')
          return false
        }
      } else {
        const res = await portfolioService.createSkill(payload)
        if (res.ok) {
          showToast('success', 'Compétence ajoutée avec succès.')
          const updated = await portfolioService.getSkills()
          setSkills(updated)
          return true
        } else {
          showToast('error', res.error || 'Erreur création compétence.')
          return false
        }
      }
    },
    [showToast]
  )

  const deleteSkill = useCallback(
    async (s: DbSkill): Promise<boolean> => {
      const confirmDel = window.confirm(`Supprimer la compétence "${s.name}" ?`)
      if (!confirmDel) return false

      const res = await portfolioService.deleteSkill(s.id)
      if (res.ok) {
        showToast('success', 'Compétence supprimée.')
        setSkills((prev) => prev.filter((item) => item.id !== s.id))
        return true
      } else {
        showToast('error', res.error || 'Erreur suppression compétence.')
        return false
      }
    },
    [showToast]
  )

  // ==========================================
  // GESTION DES MESSAGES
  // ==========================================

  const toggleMessageRead = useCallback(
    async (msg: ContactMessage): Promise<void> => {
      const newStatus = !msg.is_read
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, is_read: newStatus } : m))
      )

      const res = await portfolioService.setMessageReadStatus(msg.id, newStatus)
      if (!res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, is_read: msg.is_read } : m))
        )
        showToast('error', 'Erreur mise à jour statut lecture.')
      }
    },
    [showToast]
  )

  const deleteMessage = useCallback(
    async (msg: ContactMessage): Promise<boolean> => {
      const confirmDel = window.confirm(
        `Supprimer définitivement le message de ${msg.name} ?`
      )
      if (!confirmDel) return false

      setMessages((prev) => prev.filter((m) => m.id !== msg.id))
      const res = await portfolioService.deleteMessage(msg.id)
      if (res.ok) {
        showToast('success', 'Message supprimé.')
        return true
      } else {
        showToast('error', 'Erreur lors de la suppression.')
        portfolioService.getAdminMessages().then((r) => {
          if (r.ok) setMessages(r.messages)
        })
        return false
      }
    },
    [showToast]
  )

  // ==========================================
  // GESTION DES ANNONCES, COMMENTAIRES & SONDAGES
  // ==========================================

  const saveAnnouncement = useCallback(
    async (
      editingId: string | null,
      input: SaveAnnouncementInput,
      coverFile: File | null
    ): Promise<boolean> => {
      let finalCoverUrl = input.cover_image_url ?? null
      if (coverFile) {
        const uploadRes = await portfolioService.uploadMedia(coverFile, 'announcements')
        if (!uploadRes.ok || !uploadRes.url) {
          showToast('error', uploadRes.error || "Erreur téléversement image d'annonce.")
          return false
        }
        finalCoverUrl = uploadRes.url
      }

      const payload: SaveAnnouncementInput = { ...input, cover_image_url: finalCoverUrl }
      const res = editingId
        ? await portfolioService.updateAnnouncement(editingId, payload)
        : await portfolioService.createAnnouncement(payload)

      if (res.ok) {
        showToast('success', editingId ? 'Annonce mise à jour.' : 'Annonce publiée.')
        const adminAnn = await portfolioService.getAnnouncementsAdmin()
        setAnnouncements(adminAnn.items)
        return true
      }
      showToast('error', res.error || 'Erreur enregistrement annonce.')
      return false
    },
    [showToast]
  )

  const deleteAnnouncement = useCallback(
    async (id: string, title: string): Promise<boolean> => {
      if (!window.confirm(`Supprimer définitivement l'annonce "${title}" ?`)) return false
      const res = await portfolioService.deleteAnnouncement(id)
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id))
        showToast('success', 'Annonce supprimée.')
        return true
      }
      showToast('error', res.error || 'Erreur suppression annonce.')
      return false
    },
    [showToast]
  )

  const toggleCommentApproval = useCallback(
    async (commentId: string, isApproved: boolean): Promise<void> => {
      const res = await portfolioService.setCommentApproval(commentId, isApproved)
      if (res.ok) {
        setAnnouncements((prev) =>
          prev.map((a) => ({
            ...a,
            comments: a.comments.map((c) =>
              c.id === commentId ? { ...c, is_approved: isApproved } : c
            ),
          }))
        )
        showToast('success', isApproved ? 'Commentaire approuvé.' : 'Commentaire masqué.')
      } else {
        showToast('error', res.error || 'Erreur modération commentaire.')
      }
    },
    [showToast]
  )

  const deleteAnnouncementComment = useCallback(
    async (commentId: string): Promise<void> => {
      const res = await portfolioService.deleteAnnouncementComment(commentId)
      if (res.ok) {
        setAnnouncements((prev) =>
          prev.map((a) => ({
            ...a,
            comments: a.comments.filter((c) => c.id !== commentId),
          }))
        )
        showToast('success', 'Commentaire supprimé.')
      } else {
        showToast('error', res.error || 'Erreur suppression commentaire.')
      }
    },
    [showToast]
  )

  const createPoll = useCallback(
    async (input: CreatePollInput): Promise<boolean> => {
      const res = await portfolioService.createPoll(input)
      if (res.ok) {
        showToast('success', 'Sondage créé et publié.')
        setPolls(await portfolioService.getPollsWithResults())
        return true
      }
      showToast('error', res.error || 'Erreur création sondage.')
      return false
    },
    [showToast]
  )

  const togglePollActive = useCallback(
    async (pollId: string, isActive: boolean): Promise<void> => {
      const res = await portfolioService.togglePollActive(pollId, isActive)
      if (res.ok) {
        setPolls((prev) => prev.map((p) => (p.id === pollId ? { ...p, is_active: isActive } : p)))
        showToast('success', isActive ? 'Sondage rouvert.' : 'Sondage clôturé.')
      } else {
        showToast('error', res.error || 'Erreur mise à jour sondage.')
      }
    },
    [showToast]
  )

  const deletePoll = useCallback(
    async (pollId: string, question: string): Promise<boolean> => {
      if (!window.confirm(`Supprimer le sondage "${question}" et ses votes ?`)) return false
      const res = await portfolioService.deletePoll(pollId)
      if (res.ok) {
        setPolls((prev) => prev.filter((p) => p.id !== pollId))
        showToast('success', 'Sondage supprimé.')
        return true
      }
      showToast('error', res.error || 'Erreur suppression sondage.')
      return false
    },
    [showToast]
  )

  return {
    loading,
    toast,
    setToast,
    profile,
    projects,
    skills,
    messages,
    announcements,
    polls,
    analytics,
    analyticsRange,
    setAnalyticsRange,
    savingProject,
    uploadingAvatar,
    uploadingBanner,
    loadAllData,
    updateAvailability,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    uploadBanner,
    removeBanner,
    updateBannerPosition,
    toggleAcceptMessages,
    saveProject,
    deleteProject,
    saveSkill,
    deleteSkill,
    toggleMessageRead,
    deleteMessage,
    saveAnnouncement,
    deleteAnnouncement,
    toggleCommentApproval,
    deleteAnnouncementComment,
    createPoll,
    togglePollActive,
    deletePoll,
  }
}
