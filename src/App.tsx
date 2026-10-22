import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/app/AuthProvider'
import { ProtectedRoute } from '@/app/ProtectedRoute'
import { LoginPage } from '@/app/LoginPage'
import { HomeLandingPage } from '@/app/HomeLandingPage'
import { Spinner } from '@/components'

const AdminTournamentsListPage = lazy(() =>
  import('@/features/tournament/AdminTournamentsListPage').then((m) => ({
    default: m.AdminTournamentsListPage,
  })),
)
const CreateTournamentPage = lazy(() =>
  import('@/features/tournament/CreateTournamentPage').then((m) => ({
    default: m.CreateTournamentPage,
  })),
)
const TournamentSetupPage = lazy(() =>
  import('@/features/tournament/TournamentSetupPage').then((m) => ({
    default: m.TournamentSetupPage,
  })),
)
const ShareQrPage = lazy(() =>
  import('@/features/tournament/ShareQrPage').then((m) => ({ default: m.ShareQrPage })),
)
const LiveDashboardPage = lazy(() =>
  import('@/features/live/LiveDashboardPage').then((m) => ({
    default: m.LiveDashboardPage,
  })),
)
const QualificationReviewPage = lazy(() =>
  import('@/features/finals/QualificationReviewPage').then((m) => ({
    default: m.QualificationReviewPage,
  })),
)

const PublicLayout = lazy(() =>
  import('@/features/public/PublicLayout').then((m) => ({ default: m.PublicLayout })),
)
const PublicHomePage = lazy(() =>
  import('@/features/public/PublicHomePage').then((m) => ({ default: m.PublicHomePage })),
)
const PublicMatchesPage = lazy(() =>
  import('@/features/public/PublicMatchesPage').then((m) => ({
    default: m.PublicMatchesPage,
  })),
)
const PublicRankingPage = lazy(() =>
  import('@/features/public/PublicRankingPage').then((m) => ({
    default: m.PublicRankingPage,
  })),
)
const PublicFinalsPage = lazy(() =>
  import('@/features/public/PublicFinalsPage').then((m) => ({
    default: m.PublicFinalsPage,
  })),
)
const DisplayScreen = lazy(() =>
  import('@/features/public/DisplayScreen').then((m) => ({ default: m.DisplayScreen })),
)

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink">
      <Spinner />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <AuthProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<HomeLandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminTournamentsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/nouveau"
              element={
                <ProtectedRoute>
                  <CreateTournamentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/:id"
              element={
                <ProtectedRoute>
                  <TournamentSetupPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/:id/qr"
              element={
                <ProtectedRoute>
                  <ShareQrPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/:id/live"
              element={
                <ProtectedRoute>
                  <LiveDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/:id/finals"
              element={
                <ProtectedRoute>
                  <QualificationReviewPage />
                </ProtectedRoute>
              }
            />

            <Route path="/tournoi/:slug/display" element={<DisplayScreen />} />
            <Route path="/tournoi/:slug" element={<PublicLayout />}>
              <Route index element={<PublicHomePage />} />
              <Route path="matchs" element={<PublicMatchesPage />} />
              <Route path="classement" element={<PublicRankingPage />} />
              <Route path="finales" element={<PublicFinalsPage />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
