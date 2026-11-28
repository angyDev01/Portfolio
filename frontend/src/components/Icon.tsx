import type { ReactElement, SVGProps } from 'react'
import {
  ArrowRight,
  ArrowUp,
  Check,
  Code,
  Copy,
  ExternalLink,
  Mail,
  Menu,
  Sparkles,
  X as CloseIcon,
  Send,
  Phone,
  MessageSquare,
  Trash2,
  Eye,
  EyeOff,
  RotateCw,
  User,
  Plus,
  Pencil,
  BarChart3,
  FolderKanban,
  Award,
  TrendingUp,
  LogOut,
  ShieldCheck,
  AlertCircle,
  Sun,
  Moon,
  Bell,
  Calendar,
  Megaphone,
  Image as ImageIcon,
  CheckCircle2,
  Share2,
  Download,
  Link2,
  type LucideIcon,
} from 'lucide-react'

export type IconName =
  | 'github'
  | 'mail'
  | 'external'
  | 'code'
  | 'arrowRight'
  | 'arrowUp'
  | 'copy'
  | 'check'
  | 'menu'
  | 'close'
  | 'sparkles'
  | 'send'
  | 'phone'
  | 'messageSquare'
  | 'trash'
  | 'eye'
  | 'eyeOff'
  | 'refresh'
  | 'user'
  | 'plus'
  | 'pencil'
  | 'analytics'
  | 'projects'
  | 'skills'
  | 'trending'
  | 'logout'
  | 'shield'
  | 'alert'
  | 'sun'
  | 'moon'
  | 'bell'
  | 'calendar'
  | 'megaphone'
  | 'image'
  | 'checkCircle'
  | 'share'
  | 'download'
  | 'link'

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

const ICON_MAP: Record<IconName, LucideIcon | CustomIcon> = {
  github: GithubIcon,
  mail: Mail,
  external: ExternalLink,
  code: Code,
  arrowRight: ArrowRight,
  arrowUp: ArrowUp,
  copy: Copy,
  check: Check,
  menu: Menu,
  close: CloseIcon,
  sparkles: Sparkles,
  send: Send,
  phone: Phone,
  messageSquare: MessageSquare,
  trash: Trash2,
  eye: Eye,
  eyeOff: EyeOff,
  refresh: RotateCw,
  user: User,
  plus: Plus,
  pencil: Pencil,
  analytics: BarChart3,
  projects: FolderKanban,
  skills: Award,
  trending: TrendingUp,
  logout: LogOut,
  shield: ShieldCheck,
  alert: AlertCircle,
  sun: Sun,
  moon: Moon,
  bell: Bell,
  calendar: Calendar,
  megaphone: Megaphone,
  image: ImageIcon,
  checkCircle: CheckCircle2,
  share: Share2,
  download: Download,
  link: Link2,
}

interface IconProps {
  name: IconName
  className?: string
}

export default function Icon({ name, className = 'size-5' }: IconProps): ReactElement {
  const Component = ICON_MAP[name]
  return <Component className={className} aria-hidden="true" focusable="false" />
}
