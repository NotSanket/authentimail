import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

export function AnalysisFailure({ message, onRetry, onReturn }: { message: string; onRetry: () => void; onReturn: () => void }) {
  return (
    <motion.section
      layoutId="analysis-surface"
      className="analysis-failure"
      initial={{ opacity: 0, scale: 0.992 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      aria-labelledby="analysis-failure-title"
    >
      <div className="failure-topline"><span className="eyebrow"><span className="failure-dot" /> Analysis interrupted</span><span className="mono">NO REPORT CREATED</span></div>
      <div className="failure-content">
        <span className="failure-icon"><AlertTriangle /></span>
        <span className="section-index">ANALYSIS SERVICE</span>
        <h2 id="analysis-failure-title">Unable to complete<br />this analysis.</h2>
        <p>{message}</p>
        <div className="failure-actions">
          <motion.button whileTap={{ scale: 0.975 }} className="button button-primary" type="button" onClick={onRetry}><RefreshCw /> Retry analysis</motion.button>
          <button className="button button-secondary" type="button" onClick={onReturn}><ArrowLeft /> Return to analyzer</button>
        </div>
        <p className="failure-privacy">The submitted content is not persisted by AUTHENTIMAIL.</p>
      </div>
    </motion.section>
  )
}
