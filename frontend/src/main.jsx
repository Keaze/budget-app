import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n'
import { SettingsProvider } from './contexts/SettingsContext'
import './index.css'
import { initErrorReporting } from './utils/errorReporting.js'
import Layout from './components/Layout.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import TransactionsPage from './pages/TransactionsPage.jsx'
import AddTransactionPage from './pages/AddTransactionPage.jsx'
import EditTransactionPage from './pages/EditTransactionPage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'
import AccountsPage from './pages/AccountsPage.jsx'
import CategoriesPage from './pages/CategoriesPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

initErrorReporting()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <SettingsProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/transactions/new" element={<AddTransactionPage />} />
              <Route path="/transactions/:id/edit" element={<EditTransactionPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </SettingsProvider>
    </I18nextProvider>
  </StrictMode>,
)
