import { useEffect, useMemo, useRef, useState } from 'react'
import {
  faBarsStaggered,
  faChevronDown,
  faMagnifyingGlass,
  faRightFromBracket,
  faUser,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useNavigate } from 'react-router-dom'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

interface TopbarProps {
  onLogout?: () => void
  onToggleSidebar?: () => void
  isSidebarCollapsed?: boolean
}

export function Topbar({ onLogout, onToggleSidebar, isSidebarCollapsed }: TopbarProps) {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMenuVisible, setIsMenuVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  const displayName = useMemo(() => {
    if (user?.name && user.name.trim().length > 0) return user.name
    if (user?.email) return user.email.split('@')[0]
    return 'Student'
  }, [user])

  const avatarInitials = useMemo(() => {
    if (user?.name && user.name.trim().length) {
      const parts = user.name.trim().split(/\s+/)
      return parts
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('')
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'S'
  }, [user])

  useEffect(() => {
    if (isMenuOpen) {
      setIsMenuVisible(true)
      return
    }
    if (isMenuVisible) {
      setIsClosing(true)
      const timeout = window.setTimeout(() => {
        setIsMenuVisible(false)
        setIsClosing(false)
      }, 150)
      return () => window.clearTimeout(timeout)
    }
  }, [isMenuOpen, isMenuVisible])

  useEffect(() => {
    if (!isMenuVisible) return

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsMenuOpen(false)
      }
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)

    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isMenuVisible])

  const handleLogout = () => {
    onLogout?.()
    navigate('/login')
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-background/60 px-4 py-3 backdrop-blur-md md:px-6">
      <div className="flex flex-1 items-center gap-3">
        {onToggleSidebar ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-full border border-border/70 bg-background/80 text-muted-foreground transition-all hover:border-primary/40 hover:text-primary"
            aria-label={isSidebarCollapsed ? 'Expand menu' : 'Collapse menu'}
            aria-expanded={!isSidebarCollapsed}
            onClick={onToggleSidebar}
          >
            <FontAwesomeIcon icon={faBarsStaggered} className="h-4 w-4" />
          </Button>
        ) : null}
        <div className="relative hidden sm:flex sm:flex-1">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            placeholder="Search classes, tests or sessions"
            className="pl-9"
            aria-label="Search classroom"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <div className="relative">
          <button
            ref={buttonRef}
            type="button"
            className={cn(
              'flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1 text-sm font-medium text-foreground shadow-sm',
              'transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground',
            )}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={displayName}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {avatarInitials}
              </span>
            )}
            <span className="hidden text-left md:flex md:flex-col md:items-start">
              <span className="text-xs leading-tight text-muted-foreground">{user?.email}</span>
              <span className="text-sm leading-tight">{displayName}</span>
            </span>
            <FontAwesomeIcon icon={faChevronDown} className="h-3 w-3 text-muted-foreground" />
          </button>
          {isMenuVisible ? (
            <div
              ref={menuRef}
              className={cn(
                'absolute right-0 z-50 mt-2 w-60 rounded-md border border-border bg-card p-2 shadow-lg',
                'origin-top-right duration-150',
                isClosing ? 'animate-out fade-out zoom-out-95' : 'animate-in fade-in zoom-in-95',
              )}
              role="menu"
            >
              <div className="flex items-center gap-3 rounded-md p-2">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={displayName}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {avatarInitials}
                  </span>
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{displayName}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </div>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground',
                  'transition-all duration-150 ease-out hover:bg-accent hover:text-accent-foreground hover:translate-x-0.5',
                )}
                onClick={() => {
                  setIsMenuOpen(false)
                  navigate('/app/profile')
                }}
              >
                <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
                View profile
              </button>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive',
                  'transition-all duration-150 ease-out hover:bg-destructive/10 hover:translate-x-0.5',
                )}
                onClick={() => {
                  setIsMenuOpen(false)
                  handleLogout()
                }}
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

