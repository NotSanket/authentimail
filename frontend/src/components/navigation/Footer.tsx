import { BrandMark } from '../ui/BrandMark'

export function Footer() {
  return (
    <footer className="site-footer">
      <BrandMark compact />
      <p>Explainable phishing intelligence for messages, links, and the signals between them.</p>
      <span className="mono">SYSTEM STATUS · OPERATIONAL</span>
    </footer>
  )
}
