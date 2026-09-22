import { Menu, Radar, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { BrandMark } from '../ui/BrandMark'

const links = [
  ['/', 'Dashboard'],
  ['/analyze', 'Analyze'],
  ['/history', 'History'],
  ['/analytics', 'Analytics'],
  ['/about', 'About'],
]

export function Navigation() {
  const [open, setOpen] = useState(false)

  return (
    <header className="site-header">
      <div className="nav-shell">
        <Link to="/" className="brand-link" onClick={() => setOpen(false)}><BrandMark compact /></Link>
        <nav className={open ? 'nav-links nav-open' : 'nav-links'} aria-label="Primary navigation">
          {links.map(([path, label]) => (
            <NavLink key={path} to={path} end={path === '/'} onClick={() => setOpen(false)}>
              {label}
            </NavLink>
          ))}
        </nav>
        <Link className="nav-cta" to="/analyze"><Radar size={16} /> Analyze threat</Link>
        <button className="nav-toggle" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  )
}
