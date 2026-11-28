import { useEffect, useState, type ReactElement } from 'react'
import type { PollWithResults } from '../../types/database'
import { computeOptionPercentage, isPollOpen } from '../../services/pollService'
import { portfolioService } from '../../services/portfolioService'
import Icon from '../Icon'
import RichText from '../RichText'
import ShareButton from '../ShareButton'

interface PollCardProps {
  poll: PollWithResults
  headingLevel?: 'h2' | 'h3'
  onVoted?: () => void
}

export default function PollCard({ poll, headingLevel = 'h3', onVoted }: PollCardProps): ReactElement {
  const HeadingTag = headingLevel
  const [localPoll, setLocalPoll] = useState<PollWithResults>(poll)
  const [votingOptionId, setVotingOptionId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'info' | 'error'; text: string } | null>(null)

  useEffect(() => {
    setLocalPoll(poll)
  }, [poll])

  const open = isPollOpen(localPoll)
  const hasVoted = Boolean(localPoll.voted_option_id)
  const showResults = hasVoted || !open

  const handleVote = async (optionId: string): Promise<void> => {
    if (!open || hasVoted || votingOptionId) return
    setVotingOptionId(optionId)
    setFeedback(null)

    const res = await portfolioService.castVote(localPoll.id, optionId)
    setVotingOptionId(null)

    if (!res.ok) {
      setFeedback({ type: 'error', text: res.message || 'Vote impossible pour le moment.' })
      return
    }

    const recordedChoice = res.votedOptionId || optionId
    const isNewVote = res.status === 'ok'

    setLocalPoll((prev) => ({
      ...prev,
      voted_option_id: recordedChoice,
      total_votes: isNewVote ? prev.total_votes + 1 : prev.total_votes,
      options: prev.options.map((opt) =>
        opt.id === recordedChoice && isNewVote
          ? { ...opt, votes_count: opt.votes_count + 1 }
          : opt
      ),
    }))

    if (res.status === 'already_voted') {
      setFeedback({
        type: 'info',
        text: 'Votre vote avait déjà été enregistré pour ce sondage.',
      })
    }
    onVoted?.()
  }

  return (
    <article className="rounded-xl bg-surface border border-line p-6 transition-colors space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo">
            <span
              className={`size-2 rounded-full ${open ? 'bg-mango' : 'bg-muted/50'}`}
              aria-hidden="true"
            />
            {open ? 'Sondage ouvert' : 'Sondage clôturé'}
          </span>
          <HeadingTag className="text-lg font-semibold text-ink tracking-[-0.015em]">
            {localPoll.question}
          </HeadingTag>
        </div>
      </div>

      {localPoll.description && (
        <p className="text-sm text-muted leading-[1.55] whitespace-pre-line">
          <RichText text={localPoll.description} />
        </p>
      )}

      <div className="space-y-2.5" role="group" aria-label={localPoll.question}>
        {localPoll.options.map((option) => {
          const pct = computeOptionPercentage(option.votes_count, localPoll.total_votes)
          const isUserChoice = localPoll.voted_option_id === option.id
          const isSubmittingThis = votingOptionId === option.id

          return (
            <button
              key={option.id}
              type="button"
              disabled={!open || hasVoted || Boolean(votingOptionId)}
              onClick={() => handleVote(option.id)}
              className={`relative w-full min-h-[44px] text-left rounded-lg border px-4 py-3 overflow-hidden transition-colors ${isUserChoice
                  ? 'border-indigo bg-paper'
                  : open && !hasVoted
                    ? 'border-line bg-paper hover:border-indigo cursor-pointer'
                    : 'border-line bg-paper'
                }`}
            >
              {showResults && (
                <span
                  aria-hidden="true"
                  className={`absolute inset-y-0 left-0 transition-all duration-300 ${isUserChoice ? 'bg-indigo/15' : 'bg-line/50'
                    }`}
                  style={{ width: `${pct}%` }}
                />
              )}

              <span className="relative z-10 flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 font-medium text-ink">
                  {isUserChoice && (
                    <Icon name="checkCircle" className="size-4 text-indigo shrink-0" />
                  )}
                  <span>{isSubmittingThis ? 'Enregistrement...' : option.label}</span>
                </span>

                {showResults && (
                  <span className="text-xs font-mono text-muted shrink-0">
                    {pct}% ({option.votes_count})
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {feedback && (
        <p
          role="status"
          className={`text-xs ${feedback.type === 'error'
              ? 'text-red-600 dark:text-red-400'
              : 'text-indigo'
            }`}
        >
          {feedback.text}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted pt-1">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            {localPoll.total_votes} participation{localPoll.total_votes > 1 ? 's' : ''}
          </span>
          {localPoll.closes_at && (
            <span>
              Clôture :{' '}
              {new Intl.DateTimeFormat('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }).format(new Date(localPoll.closes_at))}
            </span>
          )}
        </div>

        <ShareButton
          compact
          item={{
            kind: 'poll',
            id: localPoll.id,
            title: localPoll.question,
            description: localPoll.description || undefined,
            badge: open ? 'Sondage ouvert' : 'Sondage clôturé',
            metaItems: localPoll.options.map((o) => o.label),
          }}
        />
      </div>
    </article>
  )
}
