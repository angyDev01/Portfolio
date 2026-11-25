import { supabase } from '../lib/supabase'
import type { PollWithResults } from '../types/database'
import { getOrCreateVisitorId } from '../utils/visitorTracker'
import { isMissingSchemaError } from './errors'

export type VoteStatus = 'ok' | 'already_voted' | 'closed' | 'rate_limited' | 'invalid'

const VOTE_STATUSES: readonly VoteStatus[] = [
  'ok',
  'already_voted',
  'closed',
  'rate_limited',
  'invalid',
]

export const VOTE_STATUS_MESSAGES: Record<VoteStatus, string> = {
  ok: 'Merci, votre vote est enregistré.',
  already_voted: 'Vous avez déjà voté sur ce sondage.',
  closed: 'Ce sondage vient de se clôturer.',
  rate_limited: 'Beaucoup de votes en même temps. Réessayez dans un instant.',
  invalid: 'Vote invalide. Rechargez la page puis réessayez.',
}

/**
 * Interprète la réponse JSON de la RPC cast_poll_vote.
 * L'option retournée par le serveur est la seule source de vérité.
 */
export function parseVoteResponse(data: unknown): {
  status: VoteStatus
  votedOptionId: string | null
} {
  if (typeof data === 'boolean') {
    return {
      status: data ? 'ok' : 'already_voted',
      votedOptionId: null,
    }
  }
  let parsed: unknown = data
  if (typeof data === 'string') {
    try {
      parsed = JSON.parse(data)
    } catch {
      return { status: 'invalid', votedOptionId: null }
    }
  }
  if (!parsed || typeof parsed !== 'object') return { status: 'invalid', votedOptionId: null }
  const raw = parsed as { status?: unknown; voted_option_id?: unknown }
  const status = VOTE_STATUSES.includes(raw.status as VoteStatus)
    ? (raw.status as VoteStatus)
    : 'invalid'
  const votedOptionId = typeof raw.voted_option_id === 'string' ? raw.voted_option_id : null
  return { status, votedOptionId }
}

export function computeOptionPercentage(votesCount: number, totalVotes: number): number {
  if (totalVotes <= 0 || votesCount <= 0) return 0
  return Math.round((votesCount / totalVotes) * 100)
}

export function isPollOpen(poll: Pick<PollWithResults, 'is_active' | 'closes_at'>): boolean {
  if (!poll.is_active) return false
  if (!poll.closes_at) return true
  return new Date(poll.closes_at).getTime() > Date.now()
}

export interface CreatePollInput {
  question: string
  description?: string | null
  closes_at?: string | null
  options: string[]
}

export const MIN_POLL_OPTIONS = 2
export const MAX_POLL_OPTIONS = 6

export const pollService = {
  async getPollsWithResultsDetailed(): Promise<{
    polls: PollWithResults[]
    migrationMissing: boolean
  }> {
    try {
      const { data, error } = await supabase.rpc('get_polls_with_results', {
        p_visitor_id: getOrCreateVisitorId(),
      })

      if (error) {
        return { polls: [], migrationMissing: isMissingSchemaError(error) }
      }
      if (!Array.isArray(data)) return { polls: [], migrationMissing: false }

      const polls = (data as PollWithResults[]).map((poll) => ({
        ...poll,
        options: Array.isArray(poll.options) ? poll.options : [],
      }))
      return { polls, migrationMissing: false }
    } catch (err) {
      console.error('Error fetching polls:', err)
      return { polls: [], migrationMissing: false }
    }
  },

  async getPollsWithResults(): Promise<PollWithResults[]> {
    return (await this.getPollsWithResultsDetailed()).polls
  },

  async castVote(
    pollId: string,
    optionId: string
  ): Promise<{
    ok: boolean
    status: VoteStatus | 'error'
    votedOptionId: string | null
    message: string
  }> {
    try {
      const { data, error } = await supabase.rpc('cast_poll_vote', {
        p_poll_id: pollId,
        p_option_id: optionId,
        p_visitor_id: getOrCreateVisitorId(),
      })

      if (error) {
        return {
          ok: false,
          status: 'error',
          votedOptionId: null,
          message: 'Vote impossible pour le moment. Veuillez réessayer.',
        }
      }

      const { status, votedOptionId } = parseVoteResponse(data)
      return {
        ok: status === 'ok' || status === 'already_voted',
        status,
        votedOptionId,
        message: VOTE_STATUS_MESSAGES[status],
      }
    } catch (err) {
      console.error('Error casting vote:', err)
      return {
        ok: false,
        status: 'error',
        votedOptionId: null,
        message: 'Vote impossible pour le moment. Veuillez réessayer.',
      }
    }
  },

  async createPoll(input: CreatePollInput): Promise<{ ok: boolean; error?: string }> {
    const cleanOptions = input.options.map((o) => o.trim()).filter(Boolean)
    if (!input.question.trim() || cleanOptions.length < MIN_POLL_OPTIONS) {
      return {
        ok: false,
        error: 'Une question et au moins 2 options sont requises.',
      }
    }
    if (cleanOptions.length > MAX_POLL_OPTIONS) {
      return { ok: false, error: `Un sondage accepte au maximum ${MAX_POLL_OPTIONS} options.` }
    }

    try {
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert([
          {
            question: input.question.trim(),
            description: input.description?.trim() || null,
            closes_at: input.closes_at || null,
            is_active: true,
          },
        ])
        .select('id')
        .single()

      if (pollError || !poll) {
        return { ok: false, error: pollError?.message || 'Erreur création sondage' }
      }

      const optionRows = cleanOptions.map((label, index) => ({
        poll_id: poll.id,
        label,
        display_order: index,
      }))

      const { error: optError } = await supabase.from('poll_options').insert(optionRows)
      if (optError) {
        await supabase.from('polls').delete().eq('id', poll.id)
        return { ok: false, error: optError.message }
      }

      return { ok: true }
    } catch (err: unknown) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Erreur création sondage',
      }
    }
  },

  async togglePollActive(
    pollId: string,
    isActive: boolean
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('polls')
        .update({ is_active: isActive })
        .eq('id', pollId)
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    } catch (err: unknown) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Erreur mise à jour sondage',
      }
    }
  },

  async deletePoll(pollId: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('polls').delete().eq('id', pollId)
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    } catch (err: unknown) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Erreur suppression sondage',
      }
    }
  },
}
