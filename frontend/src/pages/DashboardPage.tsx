import { useState, useMemo, type ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { portfolioService } from '../services/portfolioService'
import Icon from '../components/Icon'
import { useDashboardData } from '../hooks/useDashboardData'

import DashboardHeader from '../components/dashboard/DashboardHeader'
import DashboardTabsNav, { type AdminTab } from '../components/dashboard/DashboardTabsNav'
import DashboardMobileNav from '../components/dashboard/DashboardMobileNav'
import AnalyticsTab from '../components/dashboard/AnalyticsTab'
import ProjectsTab from '../components/dashboard/ProjectsTab'
import SkillsTab from '../components/dashboard/SkillsTab'
import ProfileTab from '../components/dashboard/ProfileTab'
import MessagesDrawer from '../components/dashboard/MessagesDrawer'

export default function DashboardPage(): ReactElement {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics')
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)

  const {
    loading,
    toast,
    profile,
    projects,
    skills,
    messages,
    analytics,
    analyticsRange,
    setAnalyticsRange,
    savingProject,
    uploadingAvatar,
    loadAllData,
    updateAvailability,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    toggleAcceptMessages,
    saveProject,
    deleteProject,
    saveSkill,
    deleteSkill,
    toggleMessageRead,
    deleteMessage,
  } = useDashboardData()

  // Calcul des messages non lus
  const unreadMessagesCount = useMemo(() => {
    return messages.filter((m) => !m.is_read).length
  }, [messages])

  // Déconnexion
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
        <DashboardHeader
          profile={profile}
          loading={loading}
          unreadMessagesCount={unreadMessagesCount}
          onRefresh={loadAllData}
          onOpenMessages={() => setIsDrawerOpen(true)}
          onSignOut={handleSignOut}
        />

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
        <DashboardTabsNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          projectsCount={projects.length}
          skillsCount={skills.length}
          unreadMessagesCount={unreadMessagesCount}
          onOpenMessages={() => setIsDrawerOpen(true)}
        />

        {/* ============================================================== */}
        {/* CONTENU PRINCIPAL SELON L'ONGLET ACTIF                         */}
        {/* ============================================================== */}
        {activeTab === 'analytics' && (
          <AnalyticsTab
            analytics={analytics}
            analyticsRange={analyticsRange}
            setAnalyticsRange={setAnalyticsRange}
            projects={projects}
            messages={messages}
            unreadMessagesCount={unreadMessagesCount}
            onOpenMessages={() => setIsDrawerOpen(true)}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsTab
            projects={projects}
            skills={skills}
            savingProject={savingProject}
            onSaveProject={saveProject}
            onDeleteProject={deleteProject}
          />
        )}

        {activeTab === 'skills' && (
          <SkillsTab
            skills={skills}
            onSaveSkill={saveSkill}
            onDeleteSkill={deleteSkill}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            profile={profile}
            uploadingAvatar={uploadingAvatar}
            onUpdateAvailability={updateAvailability}
            onUpdateProfile={updateProfile}
            onUploadAvatar={uploadAvatar}
            onRemoveAvatar={removeAvatar}
          />
        )}
      </div>

      {/* ============================================================== */}
      {/* SLIDE-OVER DRAWER (Panneau Latéral Fluide pour la Messagerie)   */}
      {/* ============================================================== */}
      <MessagesDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        profile={profile}
        messages={messages}
        unreadMessagesCount={unreadMessagesCount}
        onToggleAcceptMessages={toggleAcceptMessages}
        onToggleRead={toggleMessageRead}
        onDeleteMessage={deleteMessage}
      />

      {/* ============================================================== */}
      {/* ERGONOMIE MOBILE : FIXED BOTTOM NAVIGATION BAR                 */}
      {/* ============================================================== */}
      <DashboardMobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadMessagesCount={unreadMessagesCount}
        onOpenMessages={() => setIsDrawerOpen(true)}
      />
    </div>
  )
}
