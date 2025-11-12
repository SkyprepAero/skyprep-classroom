import {
  faBookOpen,
  faClock,
  faHouse,
  faLayerGroup,
  faVideo,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

const navigation = [
  {
    label: 'Overview',
    icon: faHouse,
    to: '/app',
  },
  {
    label: 'Test Series',
    icon: faLayerGroup,
    to: '/app/test-series',
  },
  {
    label: 'Live Sessions',
    icon: faVideo,
    to: '/app/live-sessions',
  },
  {
    label: 'Assignments',
    icon: faClock,
    to: '/app/assignments',
  },
  {
    label: 'Resources',
    icon: faBookOpen,
    to: '/app/resources',
  },
]

export function Sidebar() {
  return (
    <aside className="hidden w-64 border-r border-border bg-card/40 p-6 md:flex md:flex-col">
      <div className="mb-8">
        <div className="text-xl font-semibold text-primary">SkyPrep Classroom</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Learning management for your students
        </p>
      </div>
      <nav className="flex-1 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/app'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground',
              )
            }
          >
            <FontAwesomeIcon icon={item.icon} className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-8 rounded-md border border-dashed border-border p-4">
        <p className="text-sm font-semibold text-foreground">Need help?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Join upcoming onboarding sessions or review the quick start guide.
        </p>
      </div>
    </aside>
  )
}

