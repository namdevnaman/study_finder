import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PageSpinner } from './components/ui/Spinner'
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

const Dashboard = lazy(() => import('./pages/app/Dashboard'))
const Profile = lazy(() => import('./pages/app/profile/Profile'))
const StudyGroups = lazy(() => import('./pages/app/groups/StudyGroups'))
const CreateStudyGroup = lazy(() => import('./pages/app/groups/CreateStudyGroup'))
const StudyGroupDetail = lazy(() => import('./pages/app/groups/StudyGroupDetail'))
const Discussions = lazy(() => import('./pages/app/discussions/Discussions'))
const PostDetail = lazy(() => import('./pages/app/posts/PostDetail'))
const Resources = lazy(() => import('./pages/app/resources/Resources'))
const Notifications = lazy(() => import('./pages/app/notifications/Notifications'))
const ChatHub = lazy(() => import('./pages/app/chat/ChatHub'))
const StudyAssistant = lazy(() => import('./pages/app/assistant/StudyAssistant'))

function withSuspense(node: React.ReactNode) {
  return <Suspense fallback={<PageSpinner />}>{node}</Suspense>
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={withSuspense(<Dashboard />)} />
          <Route path="profile" element={withSuspense(<Profile />)} />
          <Route path="groups" element={withSuspense(<StudyGroups />)} />
          <Route path="groups/new" element={withSuspense(<CreateStudyGroup />)} />
          <Route path="groups/:id" element={withSuspense(<StudyGroupDetail />)} />
          <Route path="discussions" element={withSuspense(<Discussions />)} />
          <Route path="posts/:id" element={withSuspense(<PostDetail />)} />
          <Route path="resources" element={withSuspense(<Resources />)} />
          <Route path="notifications" element={withSuspense(<Notifications />)} />
          <Route path="chat" element={withSuspense(<ChatHub />)} />
          <Route path="chat/:conversationId" element={withSuspense(<ChatHub />)} />
          <Route path="assistant" element={withSuspense(<StudyAssistant />)} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}