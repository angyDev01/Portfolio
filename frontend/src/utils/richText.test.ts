import { describe, expect, it } from 'vitest'
import {
  insertMarkdownLink,
  normalizeRichLinkUrl,
  parseRichText,
  resolveInternalPortfolioPath,
  stripRichLinks,
} from './richText'

describe('richText', () => {
  describe('normalizeRichLinkUrl', () => {
    it('accepte les schémas autorisés et normalise www.', () => {
      expect(normalizeRichLinkUrl('https://example.com/demo')).toBe('https://example.com/demo')
      expect(normalizeRichLinkUrl('http://example.com')).toBe('http://example.com')
      expect(normalizeRichLinkUrl('www.example.com/test')).toBe('https://www.example.com/test')
      expect(normalizeRichLinkUrl('/projets')).toBe('/projets')
      expect(normalizeRichLinkUrl('#contact')).toBe('#contact')
      expect(normalizeRichLinkUrl('mailto:contact@example.com')).toBe('mailto:contact@example.com')
      expect(normalizeRichLinkUrl('tel:+22507000000')).toBe('tel:+22507000000')
    })

    it('rejette les URLs vides ou dangereuses', () => {
      expect(normalizeRichLinkUrl('')).toBeNull()
      expect(normalizeRichLinkUrl('   ')).toBeNull()
      expect(normalizeRichLinkUrl('www.')).toBeNull()
      expect(normalizeRichLinkUrl('javascript:alert(1)')).toBeNull()
      expect(normalizeRichLinkUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
      expect(normalizeRichLinkUrl('//evil.com')).toBeNull()
    })
  })

  describe('resolveInternalPortfolioPath', () => {
    it('convertit les URLs du domaine du portfolio en chemins internes sûrs', () => {
      expect(resolveInternalPortfolioPath('https://portfolio-vs28.vercel.app')).toBe('/')
      expect(
        resolveInternalPortfolioPath('https://portfolio-vs28.vercel.app/projets?projet=omnipulse#top')
      ).toBe('/projets?projet=omnipulse#top')
      expect(
        resolveInternalPortfolioPath('http://localhost:5173/contact', 'http://localhost:5173')
      ).toBe('/contact')
      expect(resolveInternalPortfolioPath('/actualites')).toBe('/actualites')
    })

    it('retourne null pour les domaines externes, protocoles relatifs ou non-HTTP', () => {
      expect(resolveInternalPortfolioPath('https://github.com/angyDev01')).toBeNull()
      expect(resolveInternalPortfolioPath('//evil.com/test')).toBeNull()
      expect(resolveInternalPortfolioPath('mailto:contact@example.com')).toBeNull()
      expect(resolveInternalPortfolioPath('tel:+22507000000')).toBeNull()
      expect(resolveInternalPortfolioPath('#projets')).toBeNull()
    })
  })

  describe('parseRichText', () => {
    it('gère les entrées vides ou sans lien', () => {
      expect(parseRichText(null)).toEqual([])
      expect(parseRichText(undefined)).toEqual([])
      expect(parseRichText('')).toEqual([])
      expect(parseRichText('Texte simple sans lien.')).toEqual([
        { type: 'text', text: 'Texte simple sans lien.' },
      ])
    })

    it('détecte les URLs brutes avec ponctuation finale et parenthèses équilibrées', () => {
      expect(parseRichText('Voir https://example.com/app, ou (www.demo.fr).')).toEqual([
        { type: 'text', text: 'Voir ' },
        {
          type: 'link',
          label: 'https://example.com/app',
          href: 'https://example.com/app',
          isInternal: false,
          isExternalHttp: true,
        },
        { type: 'text', text: ', ou (' },
        {
          type: 'link',
          label: 'www.demo.fr',
          href: 'https://www.demo.fr',
          isInternal: false,
          isExternalHttp: true,
        },
        { type: 'text', text: ').' },
      ])

      expect(
        parseRichText('Doc : https://fr.wikipedia.org/wiki/React_(bibliotheque)!')
      ).toEqual([
        { type: 'text', text: 'Doc : ' },
        {
          type: 'link',
          label: 'https://fr.wikipedia.org/wiki/React_(bibliotheque)',
          href: 'https://fr.wikipedia.org/wiki/React_(bibliotheque)',
          isInternal: false,
          isExternalHttp: true,
        },
        { type: 'text', text: '!' },
      ])
    })

    it('parse les liens nommés externes, internes et ancres', () => {
      expect(
        parseRichText(
          'Consultez [le portfolio](https://portfolio-vs28.vercel.app), [la démo](https://example.com), [mes projets](/projets) ou [écrire](mailto:hi@example.com).'
        )
      ).toEqual([
        { type: 'text', text: 'Consultez ' },
        {
          type: 'link',
          label: 'le portfolio',
          href: '/',
          isInternal: true,
          isExternalHttp: false,
        },
        { type: 'text', text: ', ' },
        {
          type: 'link',
          label: 'la démo',
          href: 'https://example.com',
          isInternal: false,
          isExternalHttp: true,
        },
        { type: 'text', text: ', ' },
        {
          type: 'link',
          label: 'mes projets',
          href: '/projets',
          isInternal: true,
          isExternalHttp: false,
        },
        { type: 'text', text: ' ou ' },
        {
          type: 'link',
          label: 'écrire',
          href: 'mailto:hi@example.com',
          isInternal: false,
          isExternalHttp: false,
        },
        { type: 'text', text: '.' },
      ])
    })

    it('conserve en texte brut les liens utilisant un schéma XSS ou protocole relatif', () => {
      expect(parseRichText('Test [Cliquez](javascript:alert(1)) fin')).toEqual([
        { type: 'text', text: 'Test [Cliquez](javascript:alert(1)) fin' },
      ])
      expect(parseRichText('[X](data:text/html,abc) et [Y](//evil.com)')).toEqual([
        { type: 'text', text: '[X](data:text/html,abc) et [Y](//evil.com)' },
      ])
      expect(parseRichText('motcolléhttps://example.com')).toEqual([
        { type: 'text', text: 'motcolléhttps://example.com' },
      ])
    })
  })

  describe('stripRichLinks', () => {
    it('remplace [Libellé](url) par le libellé lisible et conserve les URLs brutes', () => {
      expect(
        stripRichLinks('Découvrez [la démo en ligne](https://example.com) et [les projets](/projets).')
      ).toBe('Découvrez la démo en ligne et les projets.')
      expect(stripRichLinks('Accès : https://example.com')).toBe('Accès : https://example.com')
    })
  })

  describe('insertMarkdownLink', () => {
    it('insère un lien nommé en remplaçant la sélection et normalise www.', () => {
      const res = insertMarkdownLink('Voir mon site bientôt.', 5, 13, 'mon site', 'www.mon-site.dev')
      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(res.nextValue).toBe('Voir [mon site](https://www.mon-site.dev) bientôt.')
        expect(res.nextCursor).toBe('Voir [mon site](https://www.mon-site.dev)'.length)
      }
    })

    it('insère l’URL directe lorsque le libellé est vide', () => {
      const res = insertMarkdownLink('Lien : ', 7, 7, '   ', '/contact')
      expect(res.ok).toBe(true)
      if (res.ok) {
        expect(res.nextValue).toBe('Lien : /contact')
        expect(res.nextCursor).toBe('Lien : /contact'.length)
      }
    })

    it('retourne une erreur claire si la cible est invalide', () => {
      const res = insertMarkdownLink('Texte', 0, 0, 'Test', 'javascript:alert(1)')
      expect(res.ok).toBe(false)
    })
  })
})
