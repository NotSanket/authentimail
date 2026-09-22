import { motion } from 'framer-motion'
import { ArrowRight, Braces, Fingerprint, Link2, Mail, Network, ScanSearch } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageTransition } from '../../components/ui/PageTransition'
import { ThreatNetwork } from '../../components/three/ThreatNetwork'

const reveal = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65 } },
}

export function Dashboard() {
  return (
    <PageTransition>
      <section className="hero section-shell">
        <div className="hero-grid" aria-hidden="true" />
        <motion.div className="hero-copy" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.09 } } }}>
          <motion.div variants={reveal} className="hero-brandline"><strong>AUTHENTI<span>MAIL</span></strong><em>PHISHING INTELLIGENCE</em></motion.div>
          <motion.div variants={reveal} className="eyebrow"><span className="live-dot" /> Threat intelligence system · Online</motion.div>
          <motion.h1 variants={reveal}>Trace the signals.<br /><span>Expose deception.</span></motion.h1>
          <motion.p variants={reveal} className="hero-lede">AUTHENTIMAIL correlates message language, link structure, domain behavior, and authentication signals into one explainable threat profile.</motion.p>
          <motion.div variants={reveal} className="hero-actions">
            <Link className="button button-primary" to="/analyze">Analyze threat <ArrowRight size={17} /></Link>
            <a className="text-link" href="#intelligence">Explore the intelligence layer <span>↓</span></a>
          </motion.div>
          <motion.dl variants={reveal} className="hero-metrics">
            <div><dt>Signal domains</dt><dd>08</dd></div>
            <div><dt>Analysis mode</dt><dd>Explainable</dd></div>
            <div><dt>Response</dt><dd>Deterministic</dd></div>
          </motion.dl>
        </motion.div>
        <div className="hero-visual">
          <div className="visual-heading"><span><i /> LIVE SIGNAL MAP</span><span className="mono">AUTHENTIMAIL / CORE 01</span></div>
          <ThreatNetwork />
          <div className="visual-caption"><Network size={15} /><span>Correlating message and network signals through a unified risk engine</span><em>INTERACTIVE</em></div>
        </div>
      </section>

      <section id="intelligence" className="intelligence section-shell">
        <div className="section-heading">
          <div><span className="section-index">01 / INTELLIGENCE LAYER</span><h2>A phishing message is never<br />just one signal.</h2></div>
          <p>AUTHENTIMAIL reconstructs the relationship between what a message says, where it sends you, and how its technical identity behaves.</p>
        </div>

        <div className="signal-composition">
          <motion.article className="signal-panel signal-email" whileHover={{ y: -4 }}>
            <div className="panel-number">01</div><Mail />
            <h3>Email signals</h3>
            <p>Language is assessed in context—not as a bag of suspicious words.</p>
            <ul><li>Urgency and coercion</li><li>Credential requests</li><li>Impersonation patterns</li><li>Sender inconsistencies</li></ul>
            <div className="message-sample"><span /> <span /> <span className="danger-line" /> <span /></div>
          </motion.article>

          <div className="correlation-spine" aria-label="Signals are correlated by the risk engine">
            <div className="spine-line" /><div className="spine-core"><ScanSearch /><span>CORRELATE</span></div><div className="spine-line" />
          </div>

          <div className="signal-stack">
            <motion.article className="signal-panel signal-url" whileHover={{ x: -4 }}>
              <div className="panel-number">02</div><Link2 />
              <div><h3>URL intelligence</h3><p>Domain structure, redirect behavior, transport, and suspicious link characteristics.</p></div>
              <div className="url-readout mono"><span>https://</span>account-check<span>.example.zip</span></div>
            </motion.article>
            <motion.article className="signal-panel signal-profile" whileHover={{ x: -4 }}>
              <div className="panel-number">03</div><Fingerprint />
              <div><h3>Explainable risk profile</h3><p>Each verdict retains its evidence, severity, and source.</p></div>
              <div className="profile-bars"><span style={{ '--w': '87%' } as React.CSSProperties} /><span style={{ '--w': '64%' } as React.CSSProperties} /><span style={{ '--w': '42%' } as React.CSSProperties} /></div>
            </motion.article>
          </div>
        </div>
      </section>

      <section className="workflow section-shell">
        <span className="section-index">02 / ANALYSIS FLOW</span>
        <div className="workflow-grid">
          <div className="workflow-title"><h2>From suspicion<br />to clarity.</h2><Braces /></div>
          {['Ingest message', 'Extract signals', 'Correlate evidence', 'Explain risk'].map((step, index) => (
            <div className="workflow-step" key={step}><span className="mono">0{index + 1}</span><strong>{step}</strong><ArrowRight /></div>
          ))}
        </div>
        <div className="cta-band">
          <div><span className="eyebrow">Ready when the message isn't</span><h2>Inspect the threat before<br />you trust the sender.</h2></div>
          <Link to="/analyze" className="button button-light">Open analyzer <ArrowRight /></Link>
        </div>
      </section>
    </PageTransition>
  )
}
