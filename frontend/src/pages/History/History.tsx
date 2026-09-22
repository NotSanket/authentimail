import { ArrowRight, Clock3, History as HistoryIcon, ScanSearch } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageTransition } from '../../components/ui/PageTransition'

export function History() {
  return <PageTransition><section className="placeholder-page section-shell"><div className="placeholder-copy"><span className="section-index">ANALYSIS ARCHIVE / COMING NEXT</span><h1>Every investigation,<br /><span>one evidence trail.</span></h1><p>Scan history will provide a searchable timeline of messages, destinations, verdict changes, and exported reports once persistent storage is connected.</p><Link to="/analyze" className="button button-primary">Run an analysis <ArrowRight /></Link></div><div className="placeholder-visual"><div className="future-header"><HistoryIcon /><span>RECENT INVESTIGATIONS</span><span className="mono">PERSISTENCE OFFLINE</span></div>{[0, 1, 2].map((index) => <div className="future-row" key={index}><Clock3 /><span /><span /><ScanSearch /></div>)}</div></section></PageTransition>
}
