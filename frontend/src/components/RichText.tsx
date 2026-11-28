import { Fragment, type MouseEvent, type ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { parseRichText } from '../utils/richText'
import Icon from './Icon'

interface RichTextProps {
  text?: string | null
  className?: string
  linkClassName?: string
  showExternalIcon?: boolean
  openExternalInNewTab?: boolean
  stopPropagation?: boolean
}

const DEFAULT_LINK_CLS =
  'text-indigo hover:text-indigo-hover underline decoration-indigo/40 hover:decoration-indigo underline-offset-4 font-medium break-words transition-colors'

/**
 * Rend un texte enrichi avec des liens cliquables sécurisés (URLs brutes et [Libellé](url))
 * sans aucun dangerouslySetInnerHTML.
 */
export default function RichText({
  text,
  className,
  linkClassName = DEFAULT_LINK_CLS,
  showExternalIcon = true,
  openExternalInNewTab = false,
  stopPropagation = false,
}: RichTextProps): ReactElement | null {
  if (!text) return null

  const segments = parseRichText(text)
  if (segments.length === 0) return null

  const handleLinkClick = stopPropagation
    ? (event: MouseEvent<HTMLAnchorElement>) => {
        event.stopPropagation()
      }
    : undefined

  const content = segments.map((seg, index) => {
    if (seg.type === 'text') {
      return <Fragment key={index}>{seg.text}</Fragment>
    }

    if (seg.isInternal) {
      return (
        <Link
          key={index}
          to={seg.href}
          onClick={handleLinkClick}
          className={linkClassName}
        >
          {seg.label}
        </Link>
      )
    }

    if (seg.isExternalHttp) {
      return (
        <a
          key={index}
          href={seg.href}
          target={openExternalInNewTab ? '_blank' : undefined}
          rel={openExternalInNewTab ? 'noopener noreferrer' : undefined}
          onClick={handleLinkClick}
          className={linkClassName}
        >
          <span>{seg.label}</span>
          {showExternalIcon && (
            <Icon
              name="external"
              className="inline-block size-3 ml-0.5 align-[-0.1em] opacity-75 shrink-0"
            />
          )}
        </a>
      )
    }

    return (
      <a
        key={index}
        href={seg.href}
        onClick={handleLinkClick}
        className={linkClassName}
      >
        {seg.label}
      </a>
    )
  })

  return className ? <span className={className}>{content}</span> : <>{content}</>
}
