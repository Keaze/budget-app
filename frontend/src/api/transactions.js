import client from './client'

export const getTransactions = (params) => client.get('/transactions', { params })
export const getTransaction = (id) => client.get(`/transactions/${id}`)
export const createTransaction = (data) => client.post('/transactions', data)
export const updateTransaction = (id, data) => client.patch(`/transactions/${id}`, data)
export const deleteTransaction = (id) => client.delete(`/transactions/${id}`)
