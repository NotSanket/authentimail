import { motion } from 'framer-motion'
import { AlertCircle, ArrowRight, CheckCircle2, ChevronRight, CircleDot, Download, Mail, Share2, ShieldCheck, SlidersHorizontal, Unplug } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { RiskScore } from '../../components/report/RiskScore'
import { SignalMap } from '../../components/report/SignalMap'
import { PageTransition } from '../../components/ui/PageTransition'
import { StatusPill } from '../../components/ui/StatusPill'
import { getStoredReport } from '../../services/analysisService'
import type { AnalysisResponse } from '../../types/analysis'
import { formatTimestamp, formatVerdict } from '../../utils/format'

const severityIcons = {
  critical: AlertCircle, high: AlertCircle, medium: CircleDot, low: CircleDot, safe: CheckCircle2,
}

export function Report() {
  const { scanId = '' } = useParams()
  const location = useLocation()
  const result = (location.state as { result?: AnalysisResponse } | null)?.result ?? getStoredReport(scanId)

  if (!result) {
    return (
      <PageTransition>
        <section className="missing-report section-shell"><Unplug /><span className="section-index">REPORT UNAVAILABLE</span><h1>This scan is not in the current session.</h1><p>Reports are currently stored only for the active browser session.</p><Link to="/analyze" className="button button-primary">Run new analysis <ArrowRight /></Link></section>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <section className="report-page section-shell">
        <div className="report-header">
          <div><span className="eyebrow"><span className="live-dot" /> Analysis complete</span><h1>Threat intelligence report</h1><div className="report-id"><span className="mono">{result.scan_id}</span><i />{formatTimestamp(result.created_at)}</div></div>
          <div className="report-actions"><button aria-label="Download report" title="Export coming in a future phase"><Download /></button><button aria-label="Share report" title="Sharing coming in a future phase"><Share2 /></button><Link to="/analyze" className="button button-secondary">New analysis <ArrowRight /></Link></div>
        </div>

        <div className="report-overview">
          <div className="score-panel"><RiskScore score={result.risk_score} verdict={result.verdict} /><p>{result.risk_score >= 75 ? 'Multiple high-impact signals align with a probable phishing attempt. Avoid interacting with the message or destination.' : result.risk_score >= 45 ? 'Suspicious signals were detected. Verify the sender and destination through a trusted channel.' : 'No strong phishing pattern was established, but independent verification is still recommended.'}</p></div>
          <div className="detector-panel">
            <div className="detector-heading"><span className="section-index">DETECTOR SUMMARY</span><span className="mono">2 CHANNELS</span></div>
            <DetectorRow icon={Mail} label="Email risk" score={result.detectors.email.score} status={result.detectors.email.status} />
            <DetectorRow icon={SlidersHorizontal} label="URL risk" score={result.detectors.url.score} status={result.detectors.url.status} note={result.metadata.domain ? undefined : 'Not provided'} />
            <div className="detector-verdict"><ShieldCheck /><div><span>Overall verdict</span><strong>{formatVerdict(result.verdict)}</strong></div><StatusPill status={result.verdict} /></div>
          </div>
        </div>

        <div className="report-content">
          <section className="indicator-section">
            <div className="content-heading"><div><span className="section-index">DETECTED SIGNALS</span><h2>What influenced the result</h2></div><span className="indicator-count">{result.indicators.length.toString().padStart(2, '0')}</span></div>
            <div className="indicator-list">
              {result.indicators.map((indicator, index) => {
                const Icon = severityIcons[indicator.severity]
                return (
                  <motion.article className={`indicator indicator-${indicator.severity}`} key={indicator.type} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.07 }}>
                    <span className="indicator-icon"><Icon /></span><StatusPill status={indicator.severity} /><div><h3>{indicator.message}</h3><p>Source: {indicator.source} · Signal: {indicator.type.replaceAll('_', ' ')}</p></div><ChevronRight />
                  </motion.article>
                )
              })}
            </div>
          </section>
          <aside className="technical-panel">
            <span className="section-index">TECHNICAL CONTEXT</span>
            <dl>
              <div><dt>Scan ID</dt><dd className="mono">{result.scan_id}</dd></div>
              <div><dt>Ruleset</dt><dd className="mono">{result.metadata.analysis_version}</dd></div>
              <div><dt>Domain</dt><dd className="mono">{result.metadata.domain ?? '—'}</dd></div>
              <div><dt>Links observed</dt><dd>{result.metadata.links_observed}</dd></div>
              <div><dt>Message size</dt><dd>{result.metadata.message_characters} chars</dd></div>
              <div><dt>Generated</dt><dd>{formatTimestamp(result.created_at)}</dd></div>
            </dl>
            <div className="technical-note"><AlertCircle /><p>This development report uses deterministic local rules. It is a threat triage aid, not a final security determination.</p></div>
          </aside>
        </div>
        <SignalMap result={result} />
      </section>
    </PageTransition>
  )
}

function DetectorRow({ icon: Icon, label, score, status, note }: { icon: typeof Mail; label: string; score: number; status: AnalysisResponse['verdict']; note?: string }) {
  return (
    <div className="detector-row"><span className="detector-icon"><Icon /></span><div><span>{label}</span><strong>{note ?? formatVerdict(status)}</strong><div className="detector-bar"><motion.i initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1, delay: 0.3 }} /></div></div><em>{note ? '—' : score}</em></div>
  )
}
