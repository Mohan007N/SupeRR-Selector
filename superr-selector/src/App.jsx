import { lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { DemoProvider } from './context/DemoContext.jsx'
import { FilterProvider } from './context/FilterContext.jsx'
import { ProfileProvider } from './context/ProfileContext.jsx'

const OverviewPage = lazy(() => import('./pages/OverviewPage.jsx'))
const BattingPage = lazy(() => import('./pages/BattingPage.jsx'))
const BowlingPage = lazy(() => import('./pages/BowlingPage.jsx'))
const RankingsPage = lazy(() => import('./pages/RankingsPage.jsx'))
const ComparisonPage = lazy(() => import('./pages/ComparisonPage.jsx'))
const PressurePage = lazy(() => import('./pages/PressurePage.jsx'))

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <DemoProvider>
          <FilterProvider>
            <ProfileProvider>
              <Routes>
                <Route element={<AppShell />}>
                  <Route index element={<OverviewPage />} />
                  <Route path="batting" element={<BattingPage />} />
                  <Route path="bowling" element={<BowlingPage />} />
                  <Route path="rankings" element={<RankingsPage />} />
                  <Route path="comparison" element={<ComparisonPage />} />
                  <Route path="pressure" element={<PressurePage />} />
                  <Route path="methodology" element={<Navigate to="/" replace />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </ProfileProvider>
          </FilterProvider>
        </DemoProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
