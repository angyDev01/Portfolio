import { describe, it, expect } from 'vitest'
import { computeOptionPercentage, isPollOpen, parseVoteResponse } from './pollService'
import { parseCommentResponse } from './announcementService'
import { announcementCommentSchema, hasUnallowedLink } from '../utils/security'
import { validateImageFile } from '../utils/mediaValidation'
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '../utils/dateTime'

describe('pollService helpers', () => {
  it('calcule correctement les pourcentages des options', () => {
    expect(computeOptionPercentage(0, 0)).toBe(0)
    expect(computeOptionPercentage(3, 10)).toBe(30)
    expect(computeOptionPercentage(2, 3)).toBe(67)
  })

  it('vérifie si un sondage est ouvert selon is_active et closes_at', () => {
    expect(isPollOpen({ is_active: true, closes_at: null })).toBe(true)
    expect(isPollOpen({ is_active: false, closes_at: null })).toBe(false)
    expect(isPollOpen({ is_active: true, closes_at: '2099-01-01T00:00:00Z' })).toBe(true)
    expect(isPollOpen({ is_active: true, closes_at: '2020-01-01T00:00:00Z' })).toBe(false)
  })

  it('interprète la réponse JSON de la RPC cast_poll_vote', () => {
    expect(parseVoteResponse({ status: 'ok', voted_option_id: 'opt-1' })).toEqual({
      status: 'ok',
      votedOptionId: 'opt-1',
    })
    expect(parseVoteResponse({ status: 'already_voted', voted_option_id: 'opt-2' })).toEqual({
      status: 'already_voted',
      votedOptionId: 'opt-2',
    })
    expect(parseVoteResponse('{"status": "closed", "voted_option_id": null}')).toEqual({
      status: 'closed',
      votedOptionId: null,
    })
    expect(parseVoteResponse(true)).toEqual({
      status: 'ok',
      votedOptionId: null,
    })
    expect(parseVoteResponse(false)).toEqual({
      status: 'already_voted',
      votedOptionId: null,
    })
    expect(parseVoteResponse(null)).toEqual({
      status: 'invalid',
      votedOptionId: null,
    })
  })
})

describe('announcementService parseCommentResponse', () => {
  it('interprète correctement les statuts de réponse de modération et publication', () => {
    const mockComment = {
      id: 'c-1',
      announcement_id: 'a-1',
      author_name: 'Bob',
      content: 'Bravo !',
      is_approved: true,
      created_at: '2026-11-20T00:00:00Z',
    }
    expect(parseCommentResponse({ status: 'ok', comment: mockComment })).toEqual({
      status: 'ok',
      comment: mockComment,
    })
    expect(parseCommentResponse({ status: 'pending' })).toEqual({
      status: 'pending',
      comment: null,
    })
    expect(parseCommentResponse({ status: 'link_rejected' })).toEqual({
      status: 'link_rejected',
      comment: null,
    })
    expect(parseCommentResponse({ status: 'rate_limited' })).toEqual({
      status: 'rate_limited',
      comment: null,
    })
    expect(parseCommentResponse('invalid')).toEqual({
      status: 'invalid',
      comment: null,
    })
  })
})

describe('announcementCommentSchema & Sécurité liens', () => {
  it('supprime les caractères de contrôle et valide un commentaire correct', () => {
    const res = announcementCommentSchema.safeParse({
      author_name: 'Alice\u0000 \t',
      content: 'Super projet, bon courage ! <3',
    })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.author_name).toBe('Alice')
      expect(res.data.content).toBe('Super projet, bon courage ! <3')
    }
  })

  it('rejette un commentaire trop court ou vide', () => {
    const res = announcementCommentSchema.safeParse({
      author_name: 'A',
      content: '   ',
    })
    expect(res.success).toBe(false)
  })

  it('détecte et rejette la présence de liens dans les commentaires', () => {
    expect(hasUnallowedLink('Visitez https://spam.com pour gagner')).toBe(true)
    expect(hasUnallowedLink('Regarde www.example.org')).toBe(true)
    expect(hasUnallowedLink('Test sans aucun lien web')).toBe(false)

    const schemaRes = announcementCommentSchema.safeParse({
      author_name: 'Bob',
      content: 'Visitez https://malicious.com',
    })
    expect(schemaRes.success).toBe(false)
  })
})

describe('mediaValidation', () => {
  it('accepte les formats images valides et dérive l extension depuis le type MIME', () => {
    const res = validateImageFile({ type: 'image/jpeg', size: 1024 * 1024 })
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.ext).toBe('jpg')
    }
  })

  it('refuse expressément les fichiers SVG (risque XSS)', () => {
    const res = validateImageFile({ type: 'image/svg+xml', size: 2048 })
    expect(res.ok).toBe(false)
  })

  it('refuse les fichiers dépassant la taille limite', () => {
    const res = validateImageFile({ type: 'image/png', size: 6 * 1024 * 1024 })
    expect(res.ok).toBe(false)
  })
})

describe('dateTime helpers', () => {
  it('convertit convenablement un ISO UTC en valeur datetime-local et réciproquement', () => {
    const iso = '2026-11-20T14:30:00.000Z'
    const localVal = toDatetimeLocalValue(iso)
    expect(localVal).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)

    const backToIso = fromDatetimeLocalValue(localVal)
    expect(backToIso).toBeTruthy()
    expect(new Date(backToIso!).getTime()).toBe(new Date(localVal).getTime())
  })

  it('gère les valeurs nulles ou invalides avec tolérance', () => {
    expect(toDatetimeLocalValue(null)).toBe('')
    expect(toDatetimeLocalValue('invalid')).toBe('')
    expect(fromDatetimeLocalValue('')).toBeNull()
    expect(fromDatetimeLocalValue(null)).toBeNull()
  })
})
