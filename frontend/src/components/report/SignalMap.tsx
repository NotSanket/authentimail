import { AlertTriangle, AtSign, Globe2, KeyRound, Link2, Radar, Zap } from 'lucide-react'
import type { AnalysisResponse } from '../../types/analysis'

export function SignalMap({ result }: { result: AnalysisResponse }) {
  const emailSignals = result.indicators.filter((item) => item.source === 'email').slice(0, 3)
  const urlSignals = result.indicators.filter((item) => item.source === 'url').slice(0, 3)

  return (
    <div className="signal-map">
      <div className="map-heading"><div><span className="section-index">SIGNAL CORRELATION</span><h2>Evidence path</h2></div><span className="mono">{result.scan_id.toUpperCase()}</span></div>
      <div className="map-stage">
        <div className="map-column map-inputs">
          <div className="map-origin"><AtSign /><div><strong>Email</strong><span>{result.metadata.message_characters} characters</span></div></div>
          <div className="map-origin"><Globe2 /><div><strong>URL</strong><span>{result.metadata.domain ?? 'Not supplied'}</span></div></div>
        </div>
        <div className="map-column map-signals">
          {(emailSignals.length ? emailSignals : [{ type: 'message_baseline', message: 'Message baseline evaluated' }]).map((item, index) => (
            <div className="map-signal" key={item.type}><span>{index === 0 ? <KeyRound /> : <Zap />}</span><p>{item.message}</p><i /></div>
          ))}
          {(urlSignals.length ? urlSignals : [{ type: 'url_baseline', message: 'No external URL supplied' }]).map((item, index) => (
            <div className="map-signal" key={item.type}><span>{index === 0 ? <Link2 /> : <AlertTriangle />}</span><p>{item.message}</p><i /></div>
          ))}
        </div>
        <div className="map-engine"><div className="engine-ring"><Radar /><i /></div><strong>RISK<br />ENGINE</strong><span>correlated</span></div>
        <div className="map-result"><strong>{result.risk_score}</strong><span>{result.verdict.replace('_', ' ')}</span></div>
      </div>
      <div className="map-legend"><span><i className="legend-line" /> Relationship</span><span><i className="legend-node" /> Observed signal</span><span><i className="legend-core" /> Correlation point</span></div>
    </div>
  )
}
