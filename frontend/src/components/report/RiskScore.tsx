import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect } from 'react'
import type { RiskStatus } from '../../types/analysis'
import { formatVerdict } from '../../utils/format'

export function RiskScore({ score, verdict }: { score: number; verdict: RiskStatus }) {
  const value = useMotionValue(0)
  const rounded = useTransform(value, (latest) => Math.round(latest))

  useEffect(() => {
    const controls = animate(value, score, { duration: 1.25, ease: [0.22, 1, 0.36, 1] })
    return controls.stop
  }, [score, value])

  return (
    <div className={`risk-score risk-${verdict}`} style={{ '--score': `${score * 3.6}deg` } as React.CSSProperties}>
      <div className="risk-score-inner">
        <span className="risk-label">Threat risk score</span>
        <motion.strong>{rounded}</motion.strong>
        <span className="risk-verdict">{formatVerdict(verdict)}</span>
      </div>
    </div>
  )
}
