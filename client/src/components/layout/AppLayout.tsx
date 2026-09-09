import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MessageSquare,
  Shield,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getUnreadCount, subscribeToNotifications } from '../../services/notifications'
import { getChatUnreadCount } from '../../services/chat'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../ui/Avatar'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Logo } from './Logo'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const DESKTOP_NAV: NavItem[] = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/groups', label: 'Study Groups', icon: Users },
  { to: '/app/discussions', label: 'Discussions', icon: MessageSquare },
  { to: '/app/chat', label: 'Chat', icon: MessageCircle },
  { to: '/app/resources', label: 'Resources', icon: BookOpen },
  { to: '/app/assistant', label: 'Assistant', icon: Sparkles },
]

const MOBILE_NAV: NavItem[] = [
  { to: '/app', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/app/groups', label: 'Groups', icon: Users },
  { to: '/app/discussions', label: 'Discussions', icon: MessageSquare },
  { to: '/app/chat', label: 'Chat', icon: MessageCircle },
  { to: '/app/profile', label: 'Profile', icon: Shield },
]

function isChatRoute(pathname: string) {
  return pathname === '/app/chat' || pathname.startsWith('/app/chat/')
}

export function AppLayout() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
  const [chatUnread, setChatUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    let active = true
    const refreshChatUnread = () => {
      getChatUnreadCount()
        .then((count) => active && setChatUnread(count))
        .catch(() => undefined)
    }
    refreshChatUnread()
    const timer = window.setInterval(refreshChatUnread, 20_000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [user, location.pathname])

  useEffect(() => {
    if (!user) return
    let active = true
    const refreshCount = () => {
      getUnreadCount(user.id)
        .then((count) => active && setUnreadCount(count))
        .catch(() => undefined)
    }
    refreshCount()
    const channel = subscribeToNotifications(user.id, refreshCount, 'layout')
    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const railLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
      isActive ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface-muted hover:text-foreground'
    }`

  const badge = (count: number) =>
    count > 0 ? (
      <span className="absolute -right-1 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
        {count > 9 ? '9+' : count}
      </span>
    ) : null

  const bottomNavClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex flex-1 flex-col items-center gap-0.5 pb-1.5 pt-2 text-[10px] font-medium transition-colors ${
      isActive ? 'text-primary' : 'text-muted'
    }`

  const chatRoute = isChatRoute(location.pathname)

  return (
    <div className="min-h-screen bg-background">
      {/* ============ DESKTOP: icon rail ============ */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-[4.5rem] flex-col items-center border-r border-border bg-surface py-4 lg:flex"
        aria-label="Primary"
      >
        <NavLink to="/app" end aria-label="Dashboard" className="mb-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary shadow-card">
            <BookOpen className="h-5 w-5" aria-hidden />
          </span>
        </NavLink>

        <nav className="flex flex-col items-center gap-1" aria-label="Sections">
          {DESKTOP_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={railLinkClass} title={item.label} aria-label={item.label}>
              <item.icon className="h-5 w-5" aria-hidden />
              {item.to === '/app/chat' && badge(chatUnread)}
            </NavLink>
          ))}
          <NavLink to="/app/notifications" className={railLinkClass} title="Notifications" aria-label="Notifications">
            <Bell className="h-5 w-5" aria-hidden />
            {badge(unreadCount)}
          </NavLink>
        </nav>

        <div className="mt-auto flex flex-col items-center gap-2">
          <ThemeToggle className="[&>button]:h-7 [&>button]:w-7" />
          <NavLink to="/app/profile" className={railLinkClass} title="Profile" aria-label="Profile">
            <Avatar name={profile?.full_name || user?.email || 'Student'} src={profile?.avatar_url} size="sm" />
          </NavLink>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-muted transition-colors hover:bg-danger-soft hover:text-danger-fg"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </aside>

      {/* ============ MOBILE: topbar ============ */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface px-4 pt-[env(safe-area-inset-top)] lg:hidden">
        <Logo className="[&>span:last-child]:text-base" />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link to="/app/notifications" className="relative rounded-lg p-2 text-muted hover:bg-surface-muted" aria-label="Notifications">
            <Bell className="h-5 w-5" aria-hidden />
            {badge(unreadCount)}
          </Link>
          <NavLink to="/app/profile" aria-label="Profile">
            <Avatar name={profile?.full_name || user?.email || 'Student'} src={profile?.avatar_url} size="sm" />
          </NavLink>
        </div>
      </header>

      {/* ============ MOBILE: bottom nav ============ */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Primary"
      >
        {MOBILE_NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={bottomNavClass}>
            {({ isActive }) => (
              <>
                <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} aria-hidden />
                {item.to === '/app/chat' && badge(chatUnread)}
                {item.to === '/app' && badge(unreadCount)}
                <span className={isActive ? 'font-semibold text-primary' : ''}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ============ CONTENT ============ */}
      <div className="lg:pl-18">
        <main
          className={
            chatRoute
              ? 'pb-[calc(env(safe-area-inset-bottom)+5rem)] lg:pb-0'
              : 'px-4 pb-[calc(env(safe-area-inset-bottom)+5rem)] pt-5 sm:px-6 lg:pb-10 lg:pt-7'
          }
        >
          <div className={chatRoute ? '' : 'mx-auto w-full max-w-6xl'}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}