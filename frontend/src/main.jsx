import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
import NotFoundPage from './pages/NotFoundPage.jsx'

initErrorReporting()

createRoot(document.getElementById('root')).render(
  <StrictMode>
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
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  </StrictMode>,
)
