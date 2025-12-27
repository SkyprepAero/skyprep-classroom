import { Navigate, Route, Routes } from 'react-router-dom'

import { LoginPage } from '@/features/auth/pages/login-page'
import { SignupPage } from '@/features/auth/pages/signup-page'
import { ForgotPasswordPage } from '@/features/auth/pages/forgot-password-page'
import { SetupPasswordPage } from '@/features/auth/pages/setup-password-page'
import { DashboardLayout } from '@/layouts/dashboard-layout'
import { DashboardHomePage } from '@/features/dashboard/pages/dashboard-home-page'
import { TestSeriesPage } from '@/features/dashboard/pages/test-series-page'
import { LiveSessionsPage } from '@/features/dashboard/pages/live-sessions-page'
import { CalendarPage } from '@/features/dashboard/pages/calendar-page'
import { AssignmentsPage } from '@/features/dashboard/pages/assignments-page'
import { ResourcesPage } from '@/features/dashboard/pages/resources-page'
import { ProfilePage } from '@/features/dashboard/pages/profile-page'
import { FocusOnePage } from '@/features/dashboard/pages/focus-one-page'
import { CohortPage } from '@/features/dashboard/pages/cohort-page'
import { TeacherSessionRequestsPage } from '@/features/sessions/pages/teacher-session-requests-page'
import { TeacherFocusOnesPage } from '@/features/focus-one/pages/teacher-focus-ones-page'
import { TeacherFocusOneDetailPage } from '@/features/focus-one/pages/teacher-focus-one-detail-page'
import { TeacherCohortsPage } from '@/features/cohort/pages/teacher-cohorts-page'
import { TeacherCohortDetailPage } from '@/features/cohort/pages/teacher-cohort-detail-page'
import { ProtectedRoute } from '@/routes/protected-route'
import { PublicRoute } from '@/routes/public-route'
import { LandingPage } from '@/pages/landing-page'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auth/setup-password" element={<SetupPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<DashboardHomePage />} />
          <Route path="test-series" element={<TestSeriesPage />} />
          <Route path="focus-one" element={<FocusOnePage />} />
          <Route path="cohort" element={<CohortPage />} />
          <Route path="live-sessions" element={<LiveSessionsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="session-requests" element={<TeacherSessionRequestsPage />} />
          <Route path="teacher/focus-ones" element={<TeacherFocusOnesPage />} />
          <Route path="teacher/focus-ones/:id" element={<TeacherFocusOneDetailPage />} />
          <Route path="teacher/cohorts" element={<TeacherCohortsPage />} />
          <Route path="teacher/cohorts/:id" element={<TeacherCohortDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}

