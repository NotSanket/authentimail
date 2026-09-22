import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense, type ReactNode } from 'react'
import { AppShell } from './AppShell'

const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard').then((module) => ({ default: module.Dashboard })))
const Analyze = lazy(() => import('../pages/Analyze/Analyze').then((module) => ({ default: module.Analyze })))
const Report = lazy(() => import('../pages/Report/Report').then((module) => ({ default: module.Report })))
const History = lazy(() => import('../pages/History/History').then((module) => ({ default: module.History })))
const Analytics = lazy(() => import('../pages/Analytics/Analytics').then((module) => ({ default: module.Analytics })))
const About = lazy(() => import('../pages/About/About').then((module) => ({ default: module.About })))

function route(component: ReactNode) {
  return <Suspense fallback={<div className="route-loader"><span /><p>Loading intelligence layer</p></div>}>{component}</Suspense>
}

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: route(<Dashboard />) },
      { path: '/analyze', element: route(<Analyze />) },
      { path: '/report/:scanId', element: route(<Report />) },
      { path: '/history', element: route(<History />) },
      { path: '/analytics', element: route(<Analytics />) },
      { path: '/about', element: route(<About />) },
    ],
  },
])
