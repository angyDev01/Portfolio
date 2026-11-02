import type { ReactElement, SVGProps } from 'react'
import {
  ArrowRight,
  Check,
  Code,
  Copy,
  ExternalLink,
  Mail,
  Menu,
  MonitorSmartphone,
  Server,
  Sparkles,
  Wrench,
  X as CloseIcon,
  Send,
  Phone,
  MessageSquare,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
  RotateCw,
  Inbox,
  User,
  Plus,
  Pencil,
  BarChart3,
  FolderKanban,
  Award,
  TrendingUp,
  LogOut,
  Settings,
  ShieldCheck,
  AlertCircle,
  Database,
  type LucideIcon,
} from 'lucide-react'

export type IconName =
  | 'github'
  | 'linkedin'
  | 'x'
  | 'facebook'
  | 'mail'
  | 'external'
  | 'code'
  | 'arrowRight'
  | 'copy'
  | 'check'
  | 'menu'
  | 'close'
  | 'sparkles'
  | 'frontend'
  | 'backend'
  | 'tools'
  | 'database'
  | 'send'
  | 'phone'
  | 'messageSquare'
  | 'trash'
  | 'eye'
  | 'eyeOff'
  | 'checkCircle'
  | 'lock'
  | 'refresh'
  | 'inbox'
  | 'user'
  | 'plus'
  | 'pencil'
  | 'analytics'
  | 'projects'
  | 'skills'
  | 'trending'
  | 'logout'
  | 'settings'
  | 'shield'
  | 'alert'

type CustomIcon = (props: SVGProps<SVGSVGElement>) => ReactElement

const GithubIcon: CustomIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

const LinkedinIcon: CustomIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

const TwitterXIcon: CustomIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
  </svg>
)

const FacebookIcon: CustomIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
)

const ICON_MAP: Record<IconName, LucideIcon | CustomIcon> = {
  github: GithubIcon,
  linkedin: LinkedinIcon,
  x: TwitterXIcon,
  facebook: FacebookIcon,
  mail: Mail,
  external: ExternalLink,
  code: Code,
  arrowRight: ArrowRight,
  copy: Copy,
  check: Check,
  menu: Menu,
  close: CloseIcon,
  sparkles: Sparkles,
  frontend: MonitorSmartphone,
  backend: Server,
  tools: Wrench,
  database: Database,
  send: Send,
  phone: Phone,
  messageSquare: MessageSquare,
  trash: Trash2,
  eye: Eye,
  eyeOff: EyeOff,
  checkCircle: CheckCircle2,
  lock: Lock,
  refresh: RotateCw,
  inbox: Inbox,
  user: User,
  plus: Plus,
  pencil: Pencil,
  analytics: BarChart3,
  projects: FolderKanban,
  skills: Award,
  trending: TrendingUp,
  logout: LogOut,
  settings: Settings,
  shield: ShieldCheck,
  alert: AlertCircle,
}

interface IconProps {
  name: IconName
  className?: string
}

export default function Icon({ name, className = 'size-5' }: IconProps): ReactElement {
  const Component = ICON_MAP[name]
  return <Component className={className} aria-hidden="true" focusable="false" />
}
