import { Outlet, ScrollRestoration } from 'react-router-dom'
import { Footer } from '../components/navigation/Footer'
import { Navigation } from '../components/navigation/Navigation'

export function AppShell() {
  return (
    <div className="app-shell">
      <Navigation />
      <Outlet />
      <Footer />
      <ScrollRestoration />
    </div>
  )
}
