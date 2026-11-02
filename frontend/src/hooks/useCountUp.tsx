import { useEffect, useState } from 'react'

/**
 * Hook d'animation numérique (CountUp) avec courbe d'accélération ease-out douce.
 *
 * @param target Valeur numérique finale à atteindre
 * @param duration Durée de l'animation en millisecondes (par défaut 1200ms)
 * @returns La valeur numérique courante animée
 */
export function useCountUp(target: number, duration: number = 1200): number {
  const [count, setCount] = useState<number>(0)

  useEffect(() => {
    let startTimestamp: number | null = null
    const startValue = 0

    if (target <= 0) {
      setCount(0)
      return
    }

    let animationFrameId: number

    const step = (timestamp: number): void => {
      if (!startTimestamp) startTimestamp = timestamp
      const elapsed = timestamp - startTimestamp
      const progress = Math.min(elapsed / duration, 1)

      // Courbe ease-out cubic douce : f(t) = 1 - (1 - t)^3
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (target - startValue) * easeOut)

      setCount(current)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step)
      } else {
        setCount(target)
      }
    }

    animationFrameId = requestAnimationFrame(step)

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [target, duration])

  return count
}

/**
 * Composant helper CountUp pour affichage direct d'un nombre animé
 */
export function CountUp({ end, duration = 1200 }: { end: number; duration?: number }) {
  const value = useCountUp(end, duration)
  return <>{value}</>
}
