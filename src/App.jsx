import { Route, Routes } from 'react-router-dom'
import { PointerEffects } from './components/PointerEffects.jsx'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ShellLayout } from './components/ShellLayout'
import { DashboardPage } from './pages/DashboardPage'
import { HomePage } from './pages/HomePage'
import { SectionPage } from './pages/SectionPage'
import { IndexRedirect } from './pages/IndexRedirect'
import { IntroPage } from './pages/IntroPage'
import { AboutPage } from './pages/AboutPage'
import './App.css'

export default function App() {
  return (
    <>
    <Routes>
      <Route path="/" element={<IndexRedirect />} />
      <Route path="/intro" element={<IntroPage />} />
      <Route element={<ShellLayout />}>
        <Route path="home" element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="home/section/:sectionKey" element={<SectionPage />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
    <PointerEffects />
    </>
  )
}
