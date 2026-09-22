import { Activity, ArrowUpRight, BarChart3, Radar } from 'lucide-react'
import { PageTransition } from '../../components/ui/PageTransition'

export function Analytics() {
  return <PageTransition><section className="placeholder-page section-shell"><div className="placeholder-copy"><span className="section-index">THREAT ANALYTICS / PLANNED</span><h1>See how deception<br /><span>changes over time.</span></h1><p>Aggregate intelligence will surface recurring lures, risky destinations, signal frequency, and changes in threat posture across your analysis history.</p><div className="future-tags"><span>Signal trends</span><span>Domain clusters</span><span>Verdict distribution</span></div></div><div className="analytics-visual"><div className="chart-top"><div><BarChart3 /><span>RISK TREND</span></div><span className="mono">30 DAYS</span></div><div className="chart-bars">{[32, 48, 42, 66, 53, 78, 71, 88, 64, 81].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div><div className="chart-footer"><span><Activity /> THREAT VELOCITY</span><strong>+14.8% <ArrowUpRight /></strong></div><Radar className="chart-watermark" /></div></section></PageTransition>
}
