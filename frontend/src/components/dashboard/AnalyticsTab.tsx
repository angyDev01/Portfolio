import { useState, type ReactElement } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'
import Icon from '../Icon'
import { CountUp } from '../../hooks/useCountUp'
import { useTheme } from '../../context/ThemeContext'
import type { AnalyticsStats, AnalyticsRange, DbProject, ContactMessage } from '../../types/database'

interface AnalyticsTabProps {
  analytics: AnalyticsStats
  analyticsRange: AnalyticsRange
  setAnalyticsRange: (range: AnalyticsRange) => void
  projects: DbProject[]
  messages: ContactMessage[]
  unreadMessagesCount: number
  onOpenMessages: () => void
}

export default function AnalyticsTab({
  analytics,
  analyticsRange,
  setAnalyticsRange,
  projects,
  messages,
  unreadMessagesCount,
  onOpenMessages,
}: AnalyticsTabProps): ReactElement {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [exporting, setExporting] = useState<boolean>(false)

  // Export CSV sécurisé via Blob avec échappement et révocation d'URL
  const handleExportCSV = (): void => {
    setExporting(true)
    try {
      const escapeCell = (value: string | number): string => {
        const str = String(value)
        return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
      }
      const headers = ['Date', 'Visiteurs Uniques', 'Messages Reçus']
      const rows = analytics.chartData.map((d) => [d.date, d.visites, d.messages])
      const csvBody = [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n')

      const blob = new Blob([`\uFEFF${csvBody}`], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `analytics_angydev_${analyticsRange}d.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setTimeout(() => setExporting(false), 500)
    }
  }

  const completedProjectsCount = projects.filter((p) => p.status !== 'in_progress').length
  const inProgressProjectsCount = projects.filter((p) => p.status === 'in_progress').length
  const featuredProjectsCount = projects.filter((p) => p.is_featured).length

  const displayPages = analytics.topPages

  // Palette pour le Donut
  const COLORS = ['#6366f1', '#10b981', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6', '#a1a1aa']

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* 4 CARTES D'INDICATEURS CLÉS (KPIs)                             */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Carte 1 : Visiteurs Uniques */}
        <div className="glass-card p-5 border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Visiteurs Uniques
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
              className={`text-xs font-mono font-medium flex items-center gap-0.5 ${analytics.viewsTrendPercent >= 0
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

        {/* Carte 2 : Messages reçus */}
        <div
          onClick={onOpenMessages}
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
                {unreadMessagesCount} non lu{unreadMessagesCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 font-mono mt-1">
            cliquez pour ouvrir le panneau
          </p>
        </div>

        {/* Carte 3 : Taux de Conversion */}
        <div className="glass-card p-5 border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Taux d'Engagement
            </span>
            <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Icon name="sparkles" className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {analytics.conversionRate}%
            </span>
            <span className="text-xs text-zinc-500 font-mono">visiteurs $\rightarrow$ contacts</span>
          </div>
          <p className="text-[11px] text-zinc-500 font-mono mt-1">
            taux de contact direct calculé
          </p>
        </div>

        {/* Carte 4 : État des Projets */}
        <div className="glass-card p-5 border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Projets ({projects.length})
            </span>
            <div className="size-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Icon name="projects" className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
              <CountUp end={inProgressProjectsCount} />
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">en cours</span>
            <span className="text-zinc-400 dark:text-zinc-600 font-mono">|</span>
            <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              <CountUp end={completedProjectsCount} />
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">terminés</span>
          </div>
          <p className="text-[11px] text-zinc-500 font-mono mt-1">
            dont {featuredProjectsCount} à la une
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* GRAPHIQUE PRINCIPAL : AUDIENCE & MESSAGERIE (Recharts)         */}
      {/* ============================================================== */}
      <div className="glass-card p-6 border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Évolution de l'Audience & Messagerie
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Suivi quotidien des visiteurs uniques et des messages directs reçus.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Bouton Export CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-mono transition-colors shadow-xs cursor-pointer"
              title="Exporter les données au format CSV"
            >
              <Icon name="code" className="size-3.5" />
              <span>{exporting ? 'Export...' : 'Export CSV'}</span>
            </button>

            {/* Sélecteur de période étendu (7j, 14j, 30j, 90j) */}
            <div className="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 text-xs font-mono">
              {([7, 14, 30, 90] as AnalyticsRange[]).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setAnalyticsRange(range)}
                  className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${analyticsRange === range
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-medium'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                >
                  {range}j
                </button>
              ))}
            </div>
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
                stroke={isDark ? '#27272a' : '#e4e4e7'}
              />
              <XAxis
                dataKey="date"
                stroke={isDark ? '#71717a' : '#a1a1aa'}
                fontSize={11}
                fontFamily="monospace"
              />
              <YAxis
                stroke={isDark ? '#71717a' : '#a1a1aa'}
                fontSize={11}
                fontFamily="monospace"
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#18181b' : '#ffffff',
                  borderColor: isDark ? '#27272a' : '#e4e4e7',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: isDark ? '#f4f4f5' : '#18181b',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Area
                type="monotone"
                dataKey="visites"
                name="Visiteurs Uniques"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#visitesGradient)"
              />
              <Area
                type="monotone"
                dataKey="messages"
                name="Messages Reçus"
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
            <span>Visiteurs Uniques</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            <span>Messages Reçus</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* GRILLE ANALYTIQUE SECONDAIRE : DONUT STACK & BAR CHART PAGES   */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique A : Répartition des Compétences par Stack (Donut) */}
        <div className="glass-card p-6 border-zinc-200 dark:border-zinc-800">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Icon name="skills" className="size-4 text-indigo-500" />
              <span>Répartition de la Stack Technique</span>
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Proportion des compétences répertoriées par catégorie.
            </p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {analytics.skillCategoryStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.skillCategoryStats}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {analytics.skillCategoryStats.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#18181b' : '#ffffff',
                      borderColor: isDark ? '#27272a' : '#e4e4e7',
                      borderRadius: '0.5rem',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs font-mono text-zinc-400">Aucune compétence analysée</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            {analytics.skillCategoryStats.map((cat, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: cat.color || COLORS[idx % COLORS.length] }}
                />
                <span>
                  {cat.name} ({cat.count})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Graphique B : Pages & Sections les Plus Visitées */}
        <div className="glass-card p-6 border-zinc-200 dark:border-zinc-800">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Icon name="trending" className="size-4 text-emerald-500" />
              <span>Pages & Vues Populaires</span>
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Volumes de trafic par chemin d'URL sur le portfolio.
            </p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {displayPages.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={displayPages}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke={isDark ? '#27272a' : '#e4e4e7'}
                  />
                  <XAxis
                    type="number"
                    stroke={isDark ? '#71717a' : '#a1a1aa'}
                    fontSize={11}
                    fontFamily="monospace"
                    allowDecimals={false}
                  />
                  <YAxis
                    dataKey="path"
                    type="category"
                    stroke={isDark ? '#71717a' : '#a1a1aa'}
                    fontSize={11}
                    fontFamily="monospace"
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#18181b' : '#ffffff',
                      borderColor: isDark ? '#27272a' : '#e4e4e7',
                      borderRadius: '0.5rem',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Bar dataKey="count" name="Visites" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs font-mono text-zinc-400">
                Aucune visite enregistrée sur cette période
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mt-2">
            <span>Rangs d'audience</span>
            <span>Total : {analytics.totalViews} visites enregistrées</span>
          </div>
        </div>
      </div>
    </div>
  )
}
