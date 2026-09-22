import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, FileText, Link2, LockKeyhole, Sparkles } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScanningSequence } from '../../components/scanner/ScanningSequence'
import { PageTransition } from '../../components/ui/PageTransition'
import { analysisService } from '../../services/analysisService'

const demoMessage = `Dear Customer,

We detected unusual activity on your Microsoft account. Your access will be suspended within 24 hours unless you verify your account immediately.

Confirm your login credentials using the secure account link below.

Security Team`

export function Analyze() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const canAnalyze = Boolean(message.trim() || url.trim())

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!message.trim() && !url.trim()) {
      setError('Add a message or URL to begin the analysis.')
      return
    }
    setError('')
    setScanning(true)
    const result = await analysisService.analyze({ message, url: url.trim() || undefined })
    navigate(`/report/${result.scan_id}`, { state: { result } })
  }

  return (
    <PageTransition>
      <section className="analyze-page section-shell">
        <AnimatePresence mode="popLayout" initial={false}>
          {scanning ? <ScanningSequence key="scanner" messageLength={message.trim().length} hasUrl={Boolean(url.trim())} /> : (
            <motion.div key="form" className="analyze-layout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }} transition={{ duration: 0.32 }}>
              <div className="analyze-intro">
                <span className="section-index">THREAT ANALYZER / 01</span>
                <h1>Inspect the message.<br /><span>Trace the threat.</span></h1>
                <p>Submit the original message, the destination link, or both. AUTHENTIMAIL will correlate the observable signals into an explainable risk profile.</p>
                <div className="privacy-note"><LockKeyhole /><div><strong>Analysis stays local in this phase.</strong><span>Inputs are processed by a deterministic development engine and are not transmitted.</span></div></div>
              </div>
              <motion.form layoutId="analysis-surface" className="analysis-console" onSubmit={handleSubmit} noValidate transition={{ layout: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }}>
                <div className="console-header"><span><span className="live-dot" /> New analysis</span><span className="mono">SESSION / UNSAVED</span></div>
                <div className="field-group">
                  <label htmlFor="message"><span><FileText /> Email or message content</span><em>Optional if URL provided</em></label>
                  <textarea id="message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Paste suspicious email or message content here..." rows={13} spellCheck="false" />
                  <div className="field-meta"><span>{message.length.toLocaleString()} characters</span><button type="button" onClick={() => setMessage(demoMessage)}><Sparkles /> Load demonstration message</button></div>
                </div>
                <div className="field-group">
                  <label htmlFor="url"><span><Link2 /> Destination URL</span><em>Optional</em></label>
                  <input id="url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/login" />
                </div>
                {error && <motion.p className="form-error" role="alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.p>}
                <div className="console-submit"><div className="console-readiness"><span className={canAnalyze ? 'ready-dot is-ready' : 'ready-dot'} /><p>{canAnalyze ? 'Input ready for deterministic threat analysis.' : 'Add a message or destination URL to begin.'}</p></div><motion.button whileTap={canAnalyze ? { scale: 0.975 } : undefined} className="button button-primary" type="submit" disabled={!canAnalyze}>Analyze threat <ArrowRight /></motion.button></div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </PageTransition>
  )
}
