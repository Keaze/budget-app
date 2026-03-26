import client from './client'

export const getAccountBalances = () => client.get('/reports/account-balances')
export const getSpendingByCategory = (params) => client.get('/reports/spending-by-category', { params })
export const getMonthlySummary = (params) => client.get('/reports/monthly-summary', { params })
