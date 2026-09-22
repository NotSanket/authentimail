import { AnimatePresence, motion } from 'framer-motion'
import { Check, FileInput, Link2, MessageSquareText, Radar, ScanLine, Waypoints } from 'lucide-react'
import { useEffect, useState } from 'react'

const stages = [
  { label: 'Normalizing message envelope', detail: 'Structuring submitted content for consistent inspection', icon: FileInput, channel: 'email' },
  { label: 'Extracting observable signals', detail: 'Locating language, identity, and destination entities', icon: ScanLine, channel: 'email' },
  { label: 'Inspecting link structure', detail: 'Evaluating scheme, hostname, and domain characteristics', icon: Link2, channel: 'url' },
  { label: 'Evaluating message intent', detail: 'Checking urgency, credential, and impersonation patterns', icon: MessageSquareText, channel: 'email' },
  { label: 'Correlating indicators', detail: 'Combining evidence across available signal channels', icon: Waypoints, channel: 'core' },
  { label: 'Assembling risk profile', detail: 'Generating an explainable verdict and evidence trail', icon: Radar, channel: 'output' },
]

export function ScanningSequence({ messageLength, hasUrl, isTakingLonger }: { messageLength: number; hasUrl: boolean; isTakingLonger: boolean }) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => setActive((value) => Math.min(value + 1, stages.length - 1)), 540)
    return () => window.clearInterval(interval)
  }, [])

  const progress = ((active + 1) / stages.length) * 100
  return (
    <motion.div layoutId="analysis-surface" className="scanner-screen" initial={{ opacity: 0.5, scale: 0.992 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}>
      <div className="scanner-topline"><span className="eyebrow"><span className="live-dot" /> Analysis in progress</span><span className="mono">AUTHENTIMAIL API PIPELINE</span></div>
      <div className="scanner-main">
        <div className={`scanner-architecture stage-${stages[active].channel}`} aria-hidden="true">
          <div className="scanner-source source-email"><i />EMAIL SIGNAL<strong>{messageLength.toLocaleString()} CHARS</strong></div>
          <div className="scanner-track track-a"><span /></div>
          <div className="scanner-core"><Radar /><span>ANALYSIS<br />CORE</span><i /></div>
          <div className="scanner-track track-b"><span /></div>
          <div className={`scanner-source source-url${hasUrl ? '' : ' source-muted'}`}><i />URL SIGNAL<strong>{hasUrl ? 'SUPPLIED' : 'NOT SUPPLIED'}</strong></div>
          <div className="scanner-down"><span /></div>
          <div className="scanner-output"><i />RISK PROFILE<strong>PENDING</strong></div>
        </div>
        <div className="scanner-status">
          <div className="scanner-status-head"><span className="section-index">ANALYSIS PIPELINE</span><span className="mono">STAGE {String(active + 1).padStart(2, '0')} / {String(stages.length).padStart(2, '0')}</span></div>
          <AnimatePresence mode="wait">
            <motion.div className="scanner-current" key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.24 }}><h2>{stages[active].label}</h2><p>{stages[active].detail}</p></motion.div>
          </AnimatePresence>
          <div className="scan-progress"><motion.span animate={{ width: `${progress}%` }} transition={{ ease: 'easeOut' }} /></div>
          {isTakingLonger && <motion.p className="scanner-waiting" role="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>The analysis service is still processing the submitted signals. No additional progress is being inferred.</motion.p>}
          <ol>
            {stages.map((stage, index) => {
              const Icon = stage.icon
              return <li key={stage.label} className={index < active ? 'complete' : index === active ? 'active' : ''}><span>{index < active ? <Check /> : <Icon />}</span>{stage.label}<em>{index < active ? 'complete' : index === active ? 'active' : 'queued'}</em></li>
            })}
          </ol>
        </div>
      </div>
    </motion.div>
  )
}
