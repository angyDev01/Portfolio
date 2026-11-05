import type { ReactElement, ComponentType } from 'react'
import {
  SiPython,
  SiJavascript,
  SiTypescript,
  SiDjango,
  SiReact,
  SiNodedotjs,
  SiTailwindcss,
  SiGit,
  SiGithub,
  SiDocker,
  SiPostgresql,
  SiSupabase,
  SiVite,
  SiNextdotjs,
  SiHtml5,
  SiCss,
  SiExpress,
  SiMongodb,
  SiRedis,
  SiMysql,
  SiFastapi,
  SiFlask,
  SiLinux,
  SiPostman,
  SiVercel,
  SiNetlify,
  SiFigma,
  SiGraphql,
  SiPrisma,
  SiJest,
  SiVitest,
  SiRedux,
  SiSass,
  SiBootstrap,
  SiSqlite,
  SiCloudflare,
  SiWebpack,
  SiNginx,
  SiPhp,
  SiLaravel,
  SiCplusplus,
  SiGo,
  SiRust,
  SiGooglecloud,
} from 'react-icons/si'
import Icon from './Icon'

export interface TechDetails {
  icon: ComponentType<{ className?: string; style?: React.CSSProperties; size?: number | string }>
  color: string
  label: string
}

const TECH_MAP: Record<string, { icon: ComponentType<{ className?: string; style?: React.CSSProperties; size?: number | string }>; color: string; label: string }> = {
  python: { icon: SiPython, color: '#3776AB', label: 'Python' },
  javascript: { icon: SiJavascript, color: '#F7DF1E', label: 'JavaScript' },
  js: { icon: SiJavascript, color: '#F7DF1E', label: 'JavaScript' },
  typescript: { icon: SiTypescript, color: '#3178C6', label: 'TypeScript' },
  ts: { icon: SiTypescript, color: '#3178C6', label: 'TypeScript' },
  django: { icon: SiDjango, color: '#44B78B', label: 'Django' },
  react: { icon: SiReact, color: '#61DAFB', label: 'React' },
  reactjs: { icon: SiReact, color: '#61DAFB', label: 'React' },
  nodejs: { icon: SiNodedotjs, color: '#68A063', label: 'Node.js' },
  node: { icon: SiNodedotjs, color: '#68A063', label: 'Node.js' },
  tailwindcss: { icon: SiTailwindcss, color: '#06B6D4', label: 'Tailwind CSS' },
  tailwind: { icon: SiTailwindcss, color: '#06B6D4', label: 'Tailwind CSS' },
  git: { icon: SiGit, color: '#F05032', label: 'Git' },
  github: { icon: SiGithub, color: '#A0AEC0', label: 'GitHub' },
  docker: { icon: SiDocker, color: '#2496ED', label: 'Docker' },
  postgresql: { icon: SiPostgresql, color: '#4169E1', label: 'PostgreSQL' },
  postgres: { icon: SiPostgresql, color: '#4169E1', label: 'PostgreSQL' },
  sql: { icon: SiPostgresql, color: '#4169E1', label: 'SQL' },
  supabase: { icon: SiSupabase, color: '#3ECF8E', label: 'Supabase' },
  vite: { icon: SiVite, color: '#646CFF', label: 'Vite' },
  nextjs: { icon: SiNextdotjs, color: '#E2E8F0', label: 'Next.js' },
  next: { icon: SiNextdotjs, color: '#E2E8F0', label: 'Next.js' },
  html: { icon: SiHtml5, color: '#E34F26', label: 'HTML5' },
  html5: { icon: SiHtml5, color: '#E34F26', label: 'HTML5' },
  css: { icon: SiCss, color: '#1572B6', label: 'CSS3' },
  css3: { icon: SiCss, color: '#1572B6', label: 'CSS3' },
  express: { icon: SiExpress, color: '#CBD5E1', label: 'Express.js' },
  expressjs: { icon: SiExpress, color: '#CBD5E1', label: 'Express.js' },
  mongodb: { icon: SiMongodb, color: '#47A248', label: 'MongoDB' },
  mongo: { icon: SiMongodb, color: '#47A248', label: 'MongoDB' },
  redis: { icon: SiRedis, color: '#FF4438', label: 'Redis' },
  mysql: { icon: SiMysql, color: '#4479A1', label: 'MySQL' },
  sqlite: { icon: SiSqlite, color: '#003B57', label: 'SQLite' },
  fastapi: { icon: SiFastapi, color: '#009688', label: 'FastAPI' },
  flask: { icon: SiFlask, color: '#94A3B8', label: 'Flask' },
  linux: { icon: SiLinux, color: '#FCC624', label: 'Linux' },
  postman: { icon: SiPostman, color: '#FF6C37', label: 'Postman' },
  vercel: { icon: SiVercel, color: '#E2E8F0', label: 'Vercel' },
  netlify: { icon: SiNetlify, color: '#00C7B7', label: 'Netlify' },
  figma: { icon: SiFigma, color: '#F24E1E', label: 'Figma' },
  graphql: { icon: SiGraphql, color: '#E10098', label: 'GraphQL' },
  prisma: { icon: SiPrisma, color: '#5A67D8', label: 'Prisma' },
  jest: { icon: SiJest, color: '#C21325', label: 'Jest' },
  vitest: { icon: SiVitest, color: '#FCC72B', label: 'Vitest' },
  redux: { icon: SiRedux, color: '#764ABC', label: 'Redux' },
  sass: { icon: SiSass, color: '#CC6699', label: 'Sass' },
  scss: { icon: SiSass, color: '#CC6699', label: 'SCSS' },
  bootstrap: { icon: SiBootstrap, color: '#7952B3', label: 'Bootstrap' },
  cloudflare: { icon: SiCloudflare, color: '#F38020', label: 'Cloudflare' },
  webpack: { icon: SiWebpack, color: '#8DD6F9', label: 'Webpack' },
  nginx: { icon: SiNginx, color: '#009639', label: 'Nginx' },
  php: { icon: SiPhp, color: '#777BB4', label: 'PHP' },
  laravel: { icon: SiLaravel, color: '#FF2D20', label: 'Laravel' },
  cplusplus: { icon: SiCplusplus, color: '#00599C', label: 'C++' },
  cpp: { icon: SiCplusplus, color: '#00599C', label: 'C++' },
  go: { icon: SiGo, color: '#00ADD8', label: 'Go' },
  golang: { icon: SiGo, color: '#00ADD8', label: 'Go' },
  rust: { icon: SiRust, color: '#DEA584', label: 'Rust' },
  gcp: { icon: SiGooglecloud, color: '#4285F4', label: 'Google Cloud' },
  googlecloud: { icon: SiGooglecloud, color: '#4285F4', label: 'Google Cloud' },
}

/**
 * Fallback élégant si techno inconnue
 */
function DefaultCodeIcon({
  className,
  style,
  size,
}: {
  className?: string
  style?: React.CSSProperties
  size?: number | string
}): ReactElement {
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

  // Recherche directe
  if (TECH_MAP[clean]) {
    return TECH_MAP[clean]
  }

  // Recherche par inclusion
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
