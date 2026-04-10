import { NavLink, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart2,
  Wallet,
  Tag,
  Settings,
  Plus,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',             labelKey: 'nav.dashboard',    icon: LayoutDashboard },
  { to: '/transactions', labelKey: 'nav.transactions', icon: ArrowLeftRight  },
  { to: '/reports',      labelKey: 'nav.reports',      icon: BarChart2       },
  { to: '/accounts',     labelKey: 'nav.accounts',     icon: Wallet          },
  { to: '/categories',   labelKey: 'nav.categories',   icon: Tag             },
  { to: '/settings',     labelKey: 'nav.settings',     icon: Settings        },
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
  const { t } = useTranslation()

  return (
    <div className="flex flex-col min-h-screen bg-green-50">
      <header className="bg-white border-b border-stone-200 h-14 flex items-center px-4 md:px-6 shrink-0">
        <Link to="/" className="flex items-center gap-2 mr-6">
          <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">B</span>
          </div>
          <span className="font-bold text-stone-900 text-[15px]">Budget</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_ITEMS.map(({ to, labelKey }) => (
            <NavLink key={to} to={to} end={to === '/'} className={desktopNavClass}>
              {t(labelKey)}
            </NavLink>
          ))}
        </nav>

        <Link
          to="/transactions/new"
          aria-label={t('layout.addTransaction')}
          className="hidden md:flex items-center gap-1.5 ml-auto bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          {t('layout.addTransaction')}
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 flex z-30">
        {NAV_ITEMS.map(({ to, labelKey, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={mobileNavClass}>
            <Icon size={22} />
            <span className="mt-0.5">{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
