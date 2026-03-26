import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart2,
  Wallet,
  Tag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',             label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight  },
  { to: '/reports',      label: 'Reports',      icon: BarChart2       },
  { to: '/accounts',     label: 'Accounts',     icon: Wallet          },
  { to: '/categories',   label: 'Categories',   icon: Tag             },
]

const activeClass = 'text-blue-600 dark:text-blue-400'
const inactiveClass = 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'

function navLinkClass({ isActive }) {
  return isActive ? activeClass : inactiveClass
}

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-200 ${collapsed ? 'w-16' : 'w-56'}`}
      >
        <div className="flex items-center justify-between px-3 py-4 border-b border-gray-200 dark:border-gray-700">
          {!collapsed && (
            <span className="font-semibold text-gray-800 dark:text-gray-100 truncate">Budget App</span>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="ml-auto p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-2 flex-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${navLinkClass({ isActive })}`
              }
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-2 text-xs font-medium transition-colors ${navLinkClass({ isActive })}`
              }
            >
              <Icon size={22} />
              <span className="mt-1">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
