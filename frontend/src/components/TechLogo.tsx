import { createElement, type ReactElement, type ComponentType } from 'react'
import { TECH_ICON_PATHS, type TechIconName } from '../data/techIconPaths'
import Icon from './Icon'

export interface TechSvgProps {
  className?: string
  style?: React.CSSProperties
  size?: number | string
}

export interface TechDetails {
  icon: ComponentType<TechSvgProps>
  color: string
  label: string
}

function createTechIcon(name: TechIconName): ComponentType<TechSvgProps> {
  const def = TECH_ICON_PATHS[name]
  return function TechSvgIcon({ className = '', style, size = '1em' }: TechSvgProps): ReactElement {
    return (
      <svg
        stroke="currentColor"
        fill="currentColor"
        strokeWidth="0"
        viewBox={def.viewBox}
        height={size}
        width={size}
        className={className}
        style={style}
        aria-hidden="true"
        focusable="false"
        xmlns="http://www.w3.org/2000/svg"
      >
        {def.children.map((node, index) => createElement(node.tag, { ...node.attr, key: index }))}
      </svg>
    )
  }
}

const TECH_MAP: Record<string, TechDetails> = {
  python: { icon: createTechIcon('SiPython'), color: '#3776AB', label: 'Python' },
  javascript: { icon: createTechIcon('SiJavascript'), color: '#F7DF1E', label: 'JavaScript' },
  js: { icon: createTechIcon('SiJavascript'), color: '#F7DF1E', label: 'JavaScript' },
  typescript: { icon: createTechIcon('SiTypescript'), color: '#3178C6', label: 'TypeScript' },
  ts: { icon: createTechIcon('SiTypescript'), color: '#3178C6', label: 'TypeScript' },
  django: { icon: createTechIcon('SiDjango'), color: '#44B78B', label: 'Django' },
  react: { icon: createTechIcon('SiReact'), color: '#61DAFB', label: 'React' },
  reactjs: { icon: createTechIcon('SiReact'), color: '#61DAFB', label: 'React' },
  nodejs: { icon: createTechIcon('SiNodedotjs'), color: '#68A063', label: 'Node.js' },
  node: { icon: createTechIcon('SiNodedotjs'), color: '#68A063', label: 'Node.js' },
  tailwindcss: { icon: createTechIcon('SiTailwindcss'), color: '#06B6D4', label: 'Tailwind CSS' },
  tailwind: { icon: createTechIcon('SiTailwindcss'), color: '#06B6D4', label: 'Tailwind CSS' },
  git: { icon: createTechIcon('SiGit'), color: '#F05032', label: 'Git' },
  github: { icon: createTechIcon('SiGithub'), color: '#A0AEC0', label: 'GitHub' },
  docker: { icon: createTechIcon('SiDocker'), color: '#2496ED', label: 'Docker' },
  postgresql: { icon: createTechIcon('SiPostgresql'), color: '#4169E1', label: 'PostgreSQL' },
  postgres: { icon: createTechIcon('SiPostgresql'), color: '#4169E1', label: 'PostgreSQL' },
  sql: { icon: createTechIcon('SiPostgresql'), color: '#4169E1', label: 'SQL' },
  supabase: { icon: createTechIcon('SiSupabase'), color: '#3ECF8E', label: 'Supabase' },
  vite: { icon: createTechIcon('SiVite'), color: '#646CFF', label: 'Vite' },
  nextjs: { icon: createTechIcon('SiNextdotjs'), color: '#E2E8F0', label: 'Next.js' },
  next: { icon: createTechIcon('SiNextdotjs'), color: '#E2E8F0', label: 'Next.js' },
  html: { icon: createTechIcon('SiHtml5'), color: '#E34F26', label: 'HTML5' },
  html5: { icon: createTechIcon('SiHtml5'), color: '#E34F26', label: 'HTML5' },
  css: { icon: createTechIcon('SiCss'), color: '#1572B6', label: 'CSS3' },
  css3: { icon: createTechIcon('SiCss'), color: '#1572B6', label: 'CSS3' },
  express: { icon: createTechIcon('SiExpress'), color: '#CBD5E1', label: 'Express.js' },
  expressjs: { icon: createTechIcon('SiExpress'), color: '#CBD5E1', label: 'Express.js' },
  mongodb: { icon: createTechIcon('SiMongodb'), color: '#47A248', label: 'MongoDB' },
  mongo: { icon: createTechIcon('SiMongodb'), color: '#47A248', label: 'MongoDB' },
  redis: { icon: createTechIcon('SiRedis'), color: '#FF4438', label: 'Redis' },
  mysql: { icon: createTechIcon('SiMysql'), color: '#4479A1', label: 'MySQL' },
  sqlite: { icon: createTechIcon('SiSqlite'), color: '#003B57', label: 'SQLite' },
  fastapi: { icon: createTechIcon('SiFastapi'), color: '#009688', label: 'FastAPI' },
  flask: { icon: createTechIcon('SiFlask'), color: '#94A3B8', label: 'Flask' },
  linux: { icon: createTechIcon('SiLinux'), color: '#FCC624', label: 'Linux' },
  postman: { icon: createTechIcon('SiPostman'), color: '#FF6C37', label: 'Postman' },
  vercel: { icon: createTechIcon('SiVercel'), color: '#E2E8F0', label: 'Vercel' },
  netlify: { icon: createTechIcon('SiNetlify'), color: '#00C7B7', label: 'Netlify' },
  figma: { icon: createTechIcon('SiFigma'), color: '#F24E1E', label: 'Figma' },
  graphql: { icon: createTechIcon('SiGraphql'), color: '#E10098', label: 'GraphQL' },
  prisma: { icon: createTechIcon('SiPrisma'), color: '#5A67D8', label: 'Prisma' },
  jest: { icon: createTechIcon('SiJest'), color: '#C21325', label: 'Jest' },
  vitest: { icon: createTechIcon('SiVitest'), color: '#FCC72B', label: 'Vitest' },
  redux: { icon: createTechIcon('SiRedux'), color: '#764ABC', label: 'Redux' },
  sass: { icon: createTechIcon('SiSass'), color: '#CC6699', label: 'Sass' },
  scss: { icon: createTechIcon('SiSass'), color: '#CC6699', label: 'SCSS' },
  bootstrap: { icon: createTechIcon('SiBootstrap'), color: '#7952B3', label: 'Bootstrap' },
  cloudflare: { icon: createTechIcon('SiCloudflare'), color: '#F38020', label: 'Cloudflare' },
  webpack: { icon: createTechIcon('SiWebpack'), color: '#8DD6F9', label: 'Webpack' },
  nginx: { icon: createTechIcon('SiNginx'), color: '#009639', label: 'Nginx' },
  php: { icon: createTechIcon('SiPhp'), color: '#777BB4', label: 'PHP' },
  laravel: { icon: createTechIcon('SiLaravel'), color: '#FF2D20', label: 'Laravel' },
  cplusplus: { icon: createTechIcon('SiCplusplus'), color: '#00599C', label: 'C++' },
  cpp: { icon: createTechIcon('SiCplusplus'), color: '#00599C', label: 'C++' },
  go: { icon: createTechIcon('SiGo'), color: '#00ADD8', label: 'Go' },
  golang: { icon: createTechIcon('SiGo'), color: '#00ADD8', label: 'Go' },
  rust: { icon: createTechIcon('SiRust'), color: '#DEA584', label: 'Rust' },
  gcp: { icon: createTechIcon('SiGooglecloud'), color: '#4285F4', label: 'Google Cloud' },
  googlecloud: { icon: createTechIcon('SiGooglecloud'), color: '#4285F4', label: 'Google Cloud' },
}

/**
 * Fallback élégant si techno inconnue
 */
function DefaultCodeIcon({ className, style, size }: TechSvgProps): ReactElement {
  return (
    <span
      className={className}
      style={{
        ...style,
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name="code" className="size-full" />
    </span>
  )
}

/**
 * Normalise un nom de technologie pour trouver son logo officiel et sa couleur
 */
export function getTechDetails(rawName: string): TechDetails {
  if (!rawName) {
    return { icon: DefaultCodeIcon, color: '#6366F1', label: '' }
  }

  const clean = rawName.toLowerCase().replace(/[\s\-_.]/g, '')

  if (TECH_MAP[clean]) {
    return TECH_MAP[clean]
  }

  for (const [key, details] of Object.entries(TECH_MAP)) {
    if (clean.includes(key) || key.includes(clean)) {
      return details
    }
  }

  return {
    icon: DefaultCodeIcon,
    color: '#6366F1',
    label: rawName,
  }
}

export interface TechLogoProps {
  name: string
  className?: string
  style?: React.CSSProperties
  size?: number | string
  colored?: boolean
}

/**
 * Composant de rendu du logo officiel d'une technologie
 */
export default function TechLogo({
  name,
  className = '',
  style = {},
  size,
  colored = true,
}: TechLogoProps): ReactElement {
  const { icon: Component, color } = getTechDetails(name)

  const finalStyle: React.CSSProperties = {
    ...style,
    ...(colored ? { color } : {}),
  }

  return <Component className={className} style={finalStyle} size={size} />
}
