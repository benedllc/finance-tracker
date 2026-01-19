import axios from 'axios'

// Use environment variable or default to relative path for production
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Export base URL for image paths
export const getImageUrl = (path) => {
  if (!path) return ''
  // In production, images are served from the same domain
  if (import.meta.env.PROD) {
    return path.startsWith('/') ? path : `/${path}`
  }
  // In development, use localhost
  return `http://localhost:5000${path.startsWith('/') ? path : `/${path}`}`
}

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if unauthorized
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  signup: async (data) => {
    const response = await api.post('/signup', data)
    return response.data
  },
  
  login: async (data) => {
    const response = await api.post('/login', data)
    return response.data
  }
}

// User API
export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/profile')
    return response.data
  },
  
  updateProfile: async (data) => {
    const response = await api.put('/profile', data)
    return response.data
  }
}

// Finance API
export const financeAPI = {
  // Accounts
  getAccounts: async () => {
    const response = await api.get('/finance/accounts')
    return response.data
  },
  
  createAccount: async (data) => {
    const response = await api.post('/finance/accounts', data)
    return response.data
  },
  
  updateAccount: async (id, data) => {
    const response = await api.put(`/finance/accounts/${id}`, data)
    return response.data
  },
  
  deleteAccount: async (id) => {
    const response = await api.delete(`/finance/accounts/${id}`)
    return response.data
  },

  permanentlyDeleteAccount: async (id) => {
    const response = await api.delete(`/finance/accounts/${id}/permanent`)
    return response.data
  },
  
  // Transactions
  getTransactions: async (params = {}) => {
    const response = await api.get('/finance/transactions', { params })
    return response.data
  },
  
  createTransaction: async (data) => {
    const response = await api.post('/finance/transactions', data)
    return response.data
  },
  
  updateTransaction: async (id, data) => {
    const response = await api.put(`/finance/transactions/${id}`, data)
    return response.data
  },
  
  deleteTransaction: async (id) => {
    const response = await api.delete(`/finance/transactions/${id}`)
    return response.data
  },
  
  // Categories
  getCategories: async () => {
    const response = await api.get('/finance/categories')
    return response.data
  },
  
  createCategory: async (data) => {
    const response = await api.post('/finance/categories', data)
    return response.data
  },
  
  // Statistics
  getSummary: async (params = {}) => {
    const response = await api.get('/finance/statistics/summary', { params })
    return response.data
  },
  
  getMonthlyStats: async (months = 6) => {
    const response = await api.get('/finance/statistics/monthly', { params: { months } })
    return response.data
  },

  // Receipts
  getReceipts: async () => {
    const response = await api.get('/finance/receipts')
    return response.data
  },

  uploadReceipt: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/finance/receipts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  updateReceipt: async (id, data) => {
    const response = await api.put(`/finance/receipts/${id}`, data)
    return response.data
  },

  getReceipt: async (id) => {
    const response = await api.get(`/finance/receipts/${id}`)
    return response.data
  },

  deleteReceipt: async (id) => {
    const response = await api.delete(`/finance/receipts/${id}`)
    return response.data
  },

  addReceiptItems: async (receiptId, items) => {
    const response = await api.post(`/finance/receipts/${receiptId}/items`, { items })
    return response.data
  },

  extractReceiptText: async (receiptId) => {
    const response = await api.post(`/finance/receipts/${receiptId}/extract-text`)
    return response.data
  },

  itemizeReceipt: async (receiptId, items, transactionId, receiptTotal, merchantName, taxes) => {
    const response = await api.post(`/finance/receipts/${receiptId}/itemize`, {
      items,
      transaction_id: transactionId,
      receipt_total: receiptTotal,
      merchant_name: merchantName,
      taxes: taxes || []
    })
    return response.data
  }
}

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health')
  return response.data
}

export default api
