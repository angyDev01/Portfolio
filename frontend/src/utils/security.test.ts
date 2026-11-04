import { describe, it, expect } from 'vitest'
import {
  sanitizeUrl,
  isSafeUrl,
  sanitizePlainText,
  directMessageSchema,
  emailContactSchema,
} from './security'

describe('Sécurité & Audit Anti-XSS : Validation des URLs', () => {
  it('autorise les protocoles légitimes (https, http, mailto, tel, chemins relatifs, ancres)', () => {
    expect(isSafeUrl('https://github.com/angyDev01')).toBe(true)
    expect(sanitizeUrl('https://github.com/angyDev01')).toBe('https://github.com/angyDev01')

    expect(isSafeUrl('http://localhost:5173')).toBe(true)
    expect(sanitizeUrl('http://localhost:5173')).toBe('http://localhost:5173')

    expect(isSafeUrl('mailto:contact@angy.dev')).toBe(true)
    expect(sanitizeUrl('mailto:contact@angy.dev')).toBe('mailto:contact@angy.dev')

    expect(isSafeUrl('tel:+2250700000000')).toBe(true)
    expect(sanitizeUrl('tel:+2250700000000')).toBe('tel:+2250700000000')

    expect(isSafeUrl('/projets')).toBe(true)
    expect(sanitizeUrl('/projets')).toBe('/projets')

    expect(isSafeUrl('#contact')).toBe(true)
    expect(sanitizeUrl('#contact')).toBe('#contact')
  })

  it('bloque formellement les schémas dangereux (javascript:, data:, vbscript:)', () => {
    const maliciousUrls = [
      'javascript:alert("XSS")',
      'JAVASCRIPT:alert(document.cookie)',
      'javascript://%0aalert(1)',
      'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
      'vbscript:msgbox("test")',
      '//evil-phishing.com/steal-creds',
      '   javascript:void(0)   ',
    ]

    for (const url of maliciousUrls) {
      expect(isSafeUrl(url)).toBe(false)
      expect(sanitizeUrl(url)).toBe('#')
      expect(sanitizeUrl(url, '/safe-fallback')).toBe('/safe-fallback')
    }
  })

  it('gère correctement les valeurs nulles, indéfinies ou vides', () => {
    expect(isSafeUrl('')).toBe(false)
    expect(isSafeUrl(null)).toBe(false)
    expect(isSafeUrl(undefined)).toBe(false)
    expect(sanitizeUrl(null)).toBe('#')
    expect(sanitizeUrl(undefined)).toBe('#')
    expect(sanitizeUrl('')).toBe('#')
  })
})

describe('Nettoyage du texte brut (sanitizePlainText)', () => {
  it('élimine toute balise HTML / XML injectée', () => {
    const dirty = '<script>alert("hack")</script>Bonjour <b>monde</b> !'
    expect(sanitizePlainText(dirty)).toBe('alert("hack")Bonjour monde !')
  })

  it('supprime les caractères de contrôle non imprimables', () => {
    const textWithControls = 'Hello\u0000\u0007World'
    expect(sanitizePlainText(textWithControls)).toBe('HelloWorld')
  })
})

describe('Validation des Entrées : directMessageSchema (Canal 2 Supabase)', () => {
  const validData = {
    name: 'Jean Angoa',
    email: 'yaojeanangoa@gmail.com',
    phone: '+225 07 00 00 00 00',
    message: 'Bonjour, je souhaite échanger sur une opportunité de projet.',
  }

  it('valide avec succès un payload conforme', () => {
    const result = directMessageSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Jean Angoa')
      expect(result.data.email).toBe('yaojeanangoa@gmail.com')
      expect(result.data.phone).toBe('+225 07 00 00 00 00')
    }
  })

  it('nettoie les balises HTML dans le nom et le message', () => {
    const payloadWithXss = {
      ...validData,
      name: '<script>alert(1)</script> Angy Dev',
      message: '<img src=x onerror=alert(2)>Message important',
    }
    const result = directMessageSchema.safeParse(payloadWithXss)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).not.toContain('<script>')
      expect(result.data.message).not.toContain('<img')
    }
  })

  it('rejette les emails invalides', () => {
    const invalidEmails = ['invalid-email', 'test@', 'test@.com', '@domain.com', 'test..test@domain.com']
    for (const email of invalidEmails) {
      const res = directMessageSchema.safeParse({ ...validData, email })
      expect(res.success).toBe(false)
    }
  })

  it('rejette les numéros de téléphone non conformes', () => {
    const invalidPhones = [
      '123', // trop court (< 6)
      'phone_avec_lettres_abc',
      '<script>alert(1)</script>',
      '012345678901234567890123456789123', // trop long (> 30)
      '++??**$$##',
    ]
    for (const phone of invalidPhones) {
      const res = directMessageSchema.safeParse({ ...validData, phone })
      expect(res.success).toBe(false)
    }
  })

  it('rejette les messages dépassant la limite autorisée (2000 caractères)', () => {
    const hugeMessage = 'A'.repeat(2001)
    const res = directMessageSchema.safeParse({ ...validData, message: hugeMessage })
    expect(res.success).toBe(false)
  })

  it('rejette les noms dépassant 100 caractères', () => {
    const hugeName = 'A'.repeat(101)
    const res = directMessageSchema.safeParse({ ...validData, name: hugeName })
    expect(res.success).toBe(false)
  })

  it('rejette les soumissions avec des champs vides', () => {
    const res = directMessageSchema.safeParse({
      name: '   ',
      email: '',
      phone: '',
      message: '',
    })
    expect(res.success).toBe(false)
  })
})

describe('Validation des Entrées : emailContactSchema (Canal 1)', () => {
  it('valide avec succès un payload conforme', () => {
    const valid = {
      name: 'Client Pro',
      email: 'client@company.com',
      subject: 'Proposition de mission React',
      message: 'Bonjour, nous souhaiterions collaborer.',
    }
    const res = emailContactSchema.safeParse(valid)
    expect(res.success).toBe(true)
  })

  it('rejette un objet trop long ou vide', () => {
    const invalid = {
      name: 'Client Pro',
      email: 'client@company.com',
      subject: 'A'.repeat(151),
      message: 'Bonjour',
    }
    const res = emailContactSchema.safeParse(invalid)
    expect(res.success).toBe(false)
  })
})

