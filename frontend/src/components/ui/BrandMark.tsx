import { motion } from 'framer-motion'

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-lockup" aria-label="AUTHENTIMAIL phishing intelligence">
      <motion.span className="brand-symbol" whileHover={{ rotate: 3 }} aria-hidden="true">
        <span className="brand-fold brand-fold-a" />
        <span className="brand-fold brand-fold-b" />
        <span className="brand-pulse" />
      </motion.span>
      <span>
        <span className="brand-name">AUTHENTI<span>MAIL</span></span>
        {!compact && <span className="brand-descriptor">PHISHING INTELLIGENCE</span>}
      </span>
    </div>
  )
}
