import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart2,
  Wallet,
  Tag,
  Plus,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',             label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight  },
  { to: '/reports',      label: 'Reports',      icon: BarChart2       },
  { to: '/accounts',     label: 'Accounts',     icon: Wallet          },
  { to: '/categories',   label: 'Categories',   icon: Tag             },
]

function desktopNavClass({ isActive }) {
  return isActive
    ? 'bg-green-50 text-green-600 font-semibold rounded-md px-3 py-1.5 text-sm transition-colors'
    : 'text-stone-500 hover:text-stone-900 px-3 py-1.5 text-sm transition-colors rounded-md'
}

function mobileNavClass({ isActive }) {
  return isActive
    ? 'flex flex-col items-center justify-center flex-1 py-2 text-xs font-semibold text-green-600 transition-colors'
    : 'flex flex-col items-center justify-center flex-1 py-2 text-xs font-medium text-stone-400 transition-colors'
}

export default function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-green-50">
      {/* Top header */}
      <header className="bg-white border-b border-stone-200 h-14 flex items-center px-4 md:px-6 shrink-0">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mr-6">
          <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">B</span>
          </div>
          <span className="font-bold text-stone-900 text-[15px]">Budget</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className={desktopNavClass}>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Add Transaction button — desktop only */}
        <Link
          to="/transactions/new"
          aria-label="Add transaction"
          className="hidden md:flex items-center gap-1.5 ml-auto bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          Add Transaction
        </Link>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 flex z-30">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={mobileNavClass}>
            <Icon size={22} />
            <span className="mt-0.5">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
