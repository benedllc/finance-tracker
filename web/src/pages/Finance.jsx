import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { financeAPI, getImageUrl } from '../services/api'
import './Dashboard.css'
import './Finance.css'

// Helper function to get file type and icon
const getFileTypeInfo = (filename) => {
  if (!filename) return { isImage: false, icon: '📄', bgColor: '#f1f5f9' }
  
  const ext = filename.toLowerCase().split('.').pop()
  
  // Image files (only web-compatible formats)
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
    return { isImage: true, icon: null, bgColor: null }
  }
  
  // HEIC (not natively supported in browsers)
  if (ext === 'heic') {
    return { isImage: false, icon: '📷', bgColor: '#fce7f3' }
  }
  
  // PDF
  if (ext === 'pdf') {
    return { isImage: false, icon: '📄', bgColor: '#fee2e2' }
  }
  
  // Email files
  if (['eml', 'msg'].includes(ext)) {
    return { isImage: false, icon: '📧', bgColor: '#dbeafe' }
  }
  
  // Text files
  if (ext === 'txt') {
    return { isImage: false, icon: '📝', bgColor: '#fef3c7' }
  }
  
  // Word documents
  if (['doc', 'docx'].includes(ext)) {
    return { isImage: false, icon: '📘', bgColor: '#e0e7ff' }
  }
  
  // Default
  return { isImage: false, icon: '📄', bgColor: '#f1f5f9' }
}

// Helper function to get display name for receipt
const getReceiptDisplayName = (receipt, allReceipts) => {
  if (receipt.display_name) return receipt.display_name
  // Find the index of this receipt in the full receipts array sorted by upload_date
  const sortedReceipts = [...allReceipts].sort((a, b) => 
    new Date(a.upload_date) - new Date(b.upload_date)
  )
  const index = sortedReceipts.findIndex(r => r.id === receipt.id)
  return `Receipt ${index + 1}`
}

function Finance() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Data states
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [summary, setSummary] = useState(null)
  const [receipts, setReceipts] = useState([])
  
  // Modal states
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [showReceiptUpload, setShowReceiptUpload] = useState(false)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [showLinkReceiptModal, setShowLinkReceiptModal] = useState(false)
  const [selectedReceiptToLink, setSelectedReceiptToLink] = useState(null)
  const [showCreateTransactionForReceipt, setShowCreateTransactionForReceipt] = useState(false)
  const [showReceiptImageModal, setShowReceiptImageModal] = useState(false)
  const [selectedReceiptImage, setSelectedReceiptImage] = useState(null)
  const [editingReceiptName, setEditingReceiptName] = useState(null)
  const [receiptNameValue, setReceiptNameValue] = useState('')
  const [selectedReceiptDetail, setSelectedReceiptDetail] = useState(null)
  const [receiptAccountFilter, setReceiptAccountFilter] = useState('all')
  
  // Itemization states
  const [showItemizationModal, setShowItemizationModal] = useState(false)
  const [extractedText, setExtractedText] = useState('')
  const [extractedLines, setExtractedLines] = useState([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [confirmedTotalLine, setConfirmedTotalLine] = useState(null)
  const [confirmedTotalAmount, setConfirmedTotalAmount] = useState('') // Editable total
  const [merchantName, setMerchantName] = useState('') // Editable merchant
  const [merchantSuggestions, setMerchantSuggestions] = useState([]) // Autocomplete suggestions
  const [showMerchantDropdown, setShowMerchantDropdown] = useState(false)
  const [itemPrices, setItemPrices] = useState({}) // Editable prices per item index
  const [itemSkus, setItemSkus] = useState({}) // Editable SKUs per item index
  const [itemCustomNames, setItemCustomNames] = useState({}) // Custom product names per index
  const [editingItemName, setEditingItemName] = useState(null) // Which item is being renamed
  const [editingItemSku, setEditingItemSku] = useState(null) // Which item SKU is being edited
  const [editingItemPrice, setEditingItemPrice] = useState(null) // Which item price is being edited
  const [itemTaxFlags, setItemTaxFlags] = useState({}) // Tax flags (F, R, T, N) per item index
  const [receiptTaxes, setReceiptTaxes] = useState([]) // [{code: 'TAX1', rate: 9.20, amount: 9.37, description: '...'}]
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [itemCategories, setItemCategories] = useState({})
  const [currentItemizingReceipt, setCurrentItemizingReceipt] = useState(null)
  
  // Confirm modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDangerous: false
  })
  
  // Form states
  const [accountForm, setAccountForm] = useState({
    name: '',
    type: 'cash',
    balance: '0'
  })
  
  const [transactionForm, setTransactionForm] = useState({
    account_id: '',
    category_id: '',
    amount: '',
    type: 'expense',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    receipt_id: null
  })

  // Filter states
  const [selectedAccount, setSelectedAccount] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' })

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      
      const [accountsData, transactionsData, categoriesData, summaryData, receiptsData] = await Promise.all([
        financeAPI.getAccounts(),
        financeAPI.getTransactions({ limit: 50 }),
        financeAPI.getCategories(),
        financeAPI.getSummary(),
        financeAPI.getReceipts()
      ])
      
      // Always replace state completely to avoid duplicates
      setAccounts(accountsData.accounts || [])
      setTransactions(transactionsData.transactions || [])
      setCategories(categoriesData.categories || [])
      setSummary(summaryData)
      setReceipts(receiptsData || [])
      setError('')
    } catch (err) {
      console.error('Error fetching finance data:', err)
      // Don't show error for empty data - it's expected for new users
      if (err.response?.status !== 404) {
        setError(err.response?.data?.error || 'Unable to connect to finance service')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Account handlers
  const openAccountModal = (account = null) => {
    if (account) {
      setEditingAccount(account)
      setAccountForm({
        name: account.name,
        type: account.type,
        balance: account.balance.toString()
      })
    } else {
      setEditingAccount(null)
      setAccountForm({ name: '', type: 'cash', balance: '0' })
    }
    setShowAccountModal(true)
  }

  const handleAccountSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingAccount) {
        await financeAPI.updateAccount(editingAccount.id, accountForm)
      } else {
        await financeAPI.createAccount(accountForm)
      }
      
      setShowAccountModal(false)
      fetchAllData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save account')
    }
  }

  // Transaction handlers
  const openTransactionModal = (transaction = null, preselectedReceiptId = null) => {
    if (transaction) {
      setEditingTransaction(transaction)
      setTransactionForm({
        account_id: transaction.account_id,
        category_id: transaction.category_id || '',
        amount: transaction.amount.toString(),
        type: transaction.type,
        description: transaction.description || '',
        transaction_date: transaction.transaction_date,
        receipt_id: transaction.receipt_id || null
      })
    } else {
      setEditingTransaction(null)
      setTransactionForm({
        account_id: accounts.length > 0 ? accounts[0].id : '',
        category_id: '',
        amount: '',
        type: 'expense',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
        receipt_id: preselectedReceiptId || null
      })
    }
    setShowTransactionModal(true)
  }

  const handleTransactionSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingTransaction) {
        await financeAPI.updateTransaction(editingTransaction.id, transactionForm)
      } else {
        await financeAPI.createTransaction(transactionForm)
      }
      
      setShowTransactionModal(false)
      fetchAllData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save transaction')
    }
  }

  // Helper function to show custom confirm modal
  const showConfirm = (config) => {
    return new Promise((resolve) => {
      setConfirmModalConfig({
        ...config,
        onConfirm: () => resolve(true)
      })
      setShowConfirmModal(true)
      // If modal is closed without confirming, resolve with false after a delay
      setTimeout(() => {
        if (showConfirmModal) {
          resolve(false)
        }
      }, 100)
    })
  }

  const handleDeleteTransaction = async (transactionId) => {
    setConfirmModalConfig({
      title: 'Delete Transaction',
      message: 'Are you sure you want to delete this transaction? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await financeAPI.deleteTransaction(transactionId)
          fetchAllData()
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to delete transaction')
        }
      }
    })
    setShowConfirmModal(true)
  }

  const handleDeleteAccount = async (accountId) => {
    if (!window.confirm('Are you sure you want to delete this account? This will deactivate the account.')) {
      return
    }
    
    try {
      await financeAPI.deleteAccount(accountId)
      setShowAccountModal(false)
      fetchAllData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete account')
    }
  }

  const handleRestoreAccount = async (accountId) => {
    if (!window.confirm('Restore this account? It will become active again.')) {
      return
    }
    
    try {
      // Update the account to set is_active = 1
      const account = accounts.find(a => a.id === accountId)
      await financeAPI.updateAccount(accountId, {
        name: account.name,
        type: account.type,
        balance: account.balance,
        is_active: 1
      })
      setShowAccountModal(false)
      fetchAllData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to restore account')
    }
  }

  const handlePermanentDeleteAccount = async (accountId) => {
    if (!window.confirm('⚠️ PERMANENTLY DELETE this account? This cannot be undone and will remove all associated transactions!')) {
      return
    }
    
    if (!window.confirm('Are you absolutely sure? This will delete the account and all its transaction history forever.')) {
      return
    }
    
    try {
      await financeAPI.permanentlyDeleteAccount(accountId)
      setShowAccountModal(false)
      fetchAllData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to permanently delete account')
    }
  }

  const handleReceiptUpload = async (file) => {
    try {
      setUploadingReceipt(true)
      await financeAPI.uploadReceipt(file)
      await fetchAllData()
      setShowReceiptUpload(false)
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload receipt')
    } finally {
      setUploadingReceipt(false)
    }
  }

  const handleDeleteReceipt = async (receiptId) => {
    if (!window.confirm('Delete this receipt? This cannot be undone.')) {
      return
    }
    
    try {
      await financeAPI.deleteReceipt(receiptId)
      await fetchAllData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete receipt')
    }
  }

  const handleUpdateReceiptName = async (receiptId, newName) => {
    try {
      await financeAPI.updateReceipt(receiptId, { display_name: newName })
      await fetchAllData()
      setEditingReceiptName(null)
      setReceiptNameValue('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update receipt name')
    }
  }

  // Merchant autocomplete handler
  const fetchMerchantSuggestions = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setMerchantSuggestions([])
      return
    }
    
    try {
      // Get unique merchant names from receipts
      const uniqueMerchants = [...new Set(
        receipts
          .filter(r => r.store_name && r.store_name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(r => r.store_name)
      )]
      setMerchantSuggestions(uniqueMerchants.slice(0, 5)) // Top 5 suggestions
    } catch (err) {
      console.error('Failed to fetch merchant suggestions:', err)
    }
  }

  const handleMerchantInputChange = (value) => {
    setMerchantName(value)
    setShowMerchantDropdown(true)
    fetchMerchantSuggestions(value)
  }

  const handleSelectMerchant = (merchant) => {
    setMerchantName(merchant)
    setShowMerchantDropdown(false)
    setMerchantSuggestions([])
  }

  // OCR & Itemization Handlers
  const handleExtractText = async (receipt) => {
    setIsExtracting(true)
    setCurrentItemizingReceipt(receipt)
    setError('')
    
    try {
      const result = await financeAPI.extractReceiptText(receipt.id)
      console.log('OCR Result:', result)
      console.log('Lines:', result.lines)
      console.log('Lines length:', result.lines?.length)
      
      setExtractedText(result.raw_text)
      setExtractedLines(result.lines || [])
      
      // Parse prices and SKUs from structured data if available
      if (result.structured_data?.items) {
        const prices = {}
        const skus = {}
        const taxFlags = {}
        result.structured_data.items.forEach((item, idx) => {
          if (item.total_price || item.amount) {
            prices[idx] = (item.total_price || item.amount).toFixed(2)
          }
          if (item.sku) {
            skus[idx] = item.sku
          }
          if (item.tax_flag || item.tax_code) {
            taxFlags[idx] = item.tax_flag || item.tax_code
          }
        })
        setItemPrices(prices)
        setItemSkus(skus)
        setItemTaxFlags(taxFlags)
      }
      
      // Extract merchant name from structured data
      if (result.structured_data?.store_name && result.structured_data.store_name !== 'unknown') {
        setMerchantName(result.structured_data.store_name)
        // Fetch existing merchants for autocomplete
        fetchMerchantSuggestions(result.structured_data.store_name)
      } else {
        // Fallback: try to extract from raw text (look for common store names)
        const rawText = result.raw_text?.toLowerCase() || ''
        const commonStores = ['walmart', 'target', 'costco', 'cvs', 'walgreens', 'kroger', 'safeway', 'albertsons', 'whole foods', 'trader joe', 'home depot', 'lowes']
        const foundStore = commonStores.find(store => rawText.includes(store))
        if (foundStore) {
          // Capitalize properly
          const capitalizedStore = foundStore.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
          setMerchantName(capitalizedStore)
        }
      }
      
      // Extract tax breakdown from structured data - support multiple tax types
      const taxes = []
      if (result.structured_data?.taxes && Array.isArray(result.structured_data.taxes) && result.structured_data.taxes.length > 0) {
        // New format: taxes array with multiple types
        result.structured_data.taxes.forEach((tax, idx) => {
          taxes.push({
            code: tax.code || `TAX${idx + 1}`,
            description: tax.description || `Tax ${idx + 1}`,
            rate: tax.rate || null,
            amount: parseFloat(tax.amount),
            taxable_subtotal: null
          })
        })
        setReceiptTaxes(taxes)
      } else if (result.structured_data?.tax && result.structured_data.tax > 0) {
        // Fallback: single tax field (legacy format)
        taxes.push({
          code: 'TAX',
          description: 'Sales Tax',
          rate: null,
          amount: parseFloat(result.structured_data.tax),
          taxable_subtotal: null
        })
        setReceiptTaxes(taxes)
      }
      
      // Pre-fill receipt total from structured data
      if (result.structured_data?.total) {
        setConfirmedTotalAmount(parseFloat(result.structured_data.total).toFixed(2))
      }
      
      // Pre-select suggested total line if found
      if (result.suggested_total_line !== null) {
        setConfirmedTotalLine(result.suggested_total_line)
        // Extract the amount from the total line and set it as editable
        const totalLine = result.lines[result.suggested_total_line]
        const amount = parseAmountFromLine(totalLine)
        if (!result.structured_data?.total) {
          setConfirmedTotalAmount(amount.toFixed(2))
        }
      }
      
      // Open itemization modal
      setShowItemizationModal(true)
      setSelectedReceiptDetail(null) // Close detail modal
    } catch (err) {
      console.error('Extract text error:', err)
      setError(err.response?.data?.error || 'Failed to extract text from receipt')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleToggleItemSelection = (lineIndex) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(lineIndex)) {
      newSelected.delete(lineIndex)
      // Remove category assignment
      const newCategories = { ...itemCategories }
      delete newCategories[lineIndex]
      setItemCategories(newCategories)
    } else {
      newSelected.add(lineIndex)
    }
    setSelectedItems(newSelected)
  }

  const handleBulkAssignCategory = (categoryId) => {
    const newCategories = { ...itemCategories }
    selectedItems.forEach(lineIndex => {
      newCategories[lineIndex] = categoryId
    })
    setItemCategories(newCategories)
  }

  const parseAmountFromLine = (line) => {
    // Extract amount from line (look for pattern like $12.34 or 12.34)
    const match = line.match(/\$?(\d+\.\d{2})/)
    return match ? parseFloat(match[1]) : 0
  }

  // Group items by SKU or description for better UX
  const groupItems = () => {
    const groups = {}
    
    extractedLines.forEach((line, index) => {
      const sku = itemSkus.hasOwnProperty(index) ? itemSkus[index] : ''
      const description = line.replace(/\(SKU:.*?\)/, '').replace(/\$[\d.]+/, '').trim()
      const customName = itemCustomNames.hasOwnProperty(index) ? itemCustomNames[index] : ''
      const displayName = customName || description || line
      
      // Group by SKU first (if available), otherwise by description
      const groupKey = (sku && sku.trim() !== '') ? `sku_${sku}` : `name_${displayName}`
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          sku: sku,
          displayName: displayName,
          description: description,
          indices: [],
          totalPrice: 0,
          category: null
        }
      }
      
      groups[groupKey].indices.push(index)
      
      // Calculate total price for this group
      const price = itemPrices.hasOwnProperty(index) 
        ? parseFloat(itemPrices[index]) || 0
        : parseAmountFromLine(line)
      groups[groupKey].totalPrice += price
      
      // Use category from any item in the group (they should all be the same)
      if (itemCategories[index]) {
        groups[groupKey].category = itemCategories[index]
      }
    })
    
    return Object.values(groups)
  }

  const calculateItemTotal = () => {
    let total = 0
    // Include ALL items since we removed checkboxes
    extractedLines.forEach((line, lineIndex) => {
      // Use the editable price from itemPrices if available, otherwise parse from line
      const price = itemPrices.hasOwnProperty(lineIndex) 
        ? parseFloat(itemPrices[lineIndex]) || 0
        : parseAmountFromLine(line)
      total += price
    })
    return total
  }

  const handleSaveItemization = async () => {
    if (!currentItemizingReceipt) return
    
    // Validate: Must have confirmed total
    if (!confirmedTotalAmount || parseFloat(confirmedTotalAmount) <= 0) {
      setError('Please enter a valid receipt total')
      return
    }
    
    // Validate: Must have at least one item
    if (extractedLines.length === 0) {
      setError('No items found to itemize')
      return
    }
    
    // Validate: All items must have categories
    const missingCategories = extractedLines
      .map((_, idx) => idx)
      .filter(lineIndex => !itemCategories[lineIndex])
    if (missingCategories.length > 0) {
      setError('All items must have a category assigned')
      return
    }
    
    // Build items array with all metadata - include ALL items
    const items = extractedLines.map((line, lineIndex) => {
      const customName = itemCustomNames[lineIndex]
      const description = customName || line.replace(/\(SKU:.*?\)/, '').replace(/\$[\d.]+/, '').trim()
      
      return {
        description: description,
        amount: parseFloat(itemPrices[lineIndex] || parseAmountFromLine(line).toFixed(2)),
        category_id: itemCategories[lineIndex],
        sku: itemSkus[lineIndex] || null,
        custom_name: customName || null,
        tax_flag: itemTaxFlags[lineIndex] || null
      }
    })
    
    const receiptTotal = parseFloat(confirmedTotalAmount)
    const itemsTotal = calculateItemTotal()
    const taxTotal = receiptTaxes.reduce((sum, tax) => sum + (parseFloat(tax.amount) || 0), 0)
    const expectedTotal = itemsTotal + taxTotal
    
    // Validate: Items + Taxes should match receipt total
    if (Math.abs(receiptTotal - expectedTotal) > 0.01) {
      const confirmed = window.confirm(
        `⚠️ Total Mismatch Warning\n\n` +
        `Receipt Total: $${receiptTotal.toFixed(2)}\n` +
        `Items Total: $${itemsTotal.toFixed(2)}\n` +
        `Tax Total: $${taxTotal.toFixed(2)}\n` +
        `Expected Total (Items + Tax): $${expectedTotal.toFixed(2)}\n` +
        `Difference: $${Math.abs(receiptTotal - expectedTotal).toFixed(2)}\n\n` +
        `This could be due to rounding or missing items/taxes.\n\n` +
        `Continue with itemization?`
      )
      if (!confirmed) return
    }
    
    try {
      await financeAPI.itemizeReceipt(
        currentItemizingReceipt.id, 
        items,
        currentItemizingReceipt.transaction_id,
        receiptTotal,  // Pass the confirmed total
        merchantName,  // Pass merchant name
        receiptTaxes   // Pass tax breakdown
      )
      
      // Close modal and refresh
      handleCloseItemizationModal()
      await fetchAllData()
      alert('Receipt itemized successfully!')
    } catch (err) {
      const errorData = err.response?.data
      if (errorData?.item_total !== undefined) {
        setError(
          `Total mismatch: Items total $${errorData.item_total.toFixed(2)} + ` +
          `Taxes $${errorData.tax_total?.toFixed(2) || '0.00'} = ` +
          `$${errorData.expected_total?.toFixed(2) || '0.00'} ` +
          `but ${errorData.receipt_total ? 'receipt' : 'transaction'} is ` +
          `$${(errorData.receipt_total || errorData.transaction_amount).toFixed(2)} ` +
          `(difference: $${errorData.difference.toFixed(2)})`
        )
      } else {
        setError(err.response?.data?.error || 'Failed to save itemization')
      }
    }
  }

  const handleCloseItemizationModal = () => {
    setShowItemizationModal(false)
    setExtractedText('')
    setExtractedLines([])
    setConfirmedTotalLine(null)
    setConfirmedTotalAmount('')
    setMerchantName('')
    setItemPrices({})
    setItemSkus({})
    setItemTaxFlags({})
    setItemCustomNames({})
    setReceiptTaxes([])
    setSelectedItems(new Set())
    setItemCategories({})
    setCurrentItemizingReceipt(null)
    setError('')
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Filter transactions based on selected filters
  const getFilteredTransactions = () => {
    let filtered = [...transactions]

    // Filter by account
    if (selectedAccount !== 'all') {
      filtered = filtered.filter(t => t.account_id === parseInt(selectedAccount))
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(search) ||
        t.category_name?.toLowerCase().includes(search) ||
        t.account_name?.toLowerCase().includes(search)
      )
    }

    // Filter by date
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    switch (dateFilter) {
      case 'this-month':
        filtered = filtered.filter(t => new Date(t.transaction_date) >= startOfMonth)
        break
      case 'last-month':
        filtered = filtered.filter(t => {
          const date = new Date(t.transaction_date)
          return date >= startOfLastMonth && date <= endOfLastMonth
        })
        break
      case 'this-year':
        filtered = filtered.filter(t => new Date(t.transaction_date) >= startOfYear)
        break
      case 'custom':
        if (customDateRange.start) {
          filtered = filtered.filter(t => new Date(t.transaction_date) >= new Date(customDateRange.start))
        }
        if (customDateRange.end) {
          filtered = filtered.filter(t => new Date(t.transaction_date) <= new Date(customDateRange.end))
        }
        break
      // 'all' - no date filtering
    }

    return filtered
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="dashboard-nav">
            <h1 className="dashboard-logo">BENED Finance</h1>
          </div>
        </header>
        <main className="dashboard-main">
          <div className="loading-spinner">Loading your finances...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-nav">
          <h1 className="dashboard-logo">BENED</h1>
          <nav className="dashboard-links">
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link to="/finance" className="nav-link active">
              Finance Tracker
            </Link>
            <Link to="/profile" className="nav-link">
              Profile
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin/users" className="nav-link">
                Admin
              </Link>
            )}
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="finance-container">
          <div className="finance-header">
            <h2>Finance Tracker</h2>
            <p>Manage your money and track your progress</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Summary Cards */}
          {summary && (
            <div className="summary-cards">
              <div className="summary-card">
                <div className="summary-card-header">
                  <span className="summary-icon">💰</span>
                  <span className="summary-card-title">Total Balance</span>
                </div>
                <div className="summary-card-value">{formatCurrency(summary.total_balance)}</div>
              </div>

              <div className="summary-card">
                <div className="summary-card-header">
                  <span className="summary-icon">📈</span>
                  <span className="summary-card-title">Income</span>
                </div>
                <div className="summary-card-value" style={{ color: '#10b981' }}>
                  {formatCurrency(summary.total_income)}
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-card-header">
                  <span className="summary-icon">📉</span>
                  <span className="summary-card-title">Expenses</span>
                </div>
                <div className="summary-card-value" style={{ color: '#ef4444' }}>
                  {formatCurrency(summary.total_expenses)}
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-card-header">
                  <span className="summary-icon">💵</span>
                  <span className="summary-card-title">Net Savings</span>
                </div>
                <div className="summary-card-value" style={{ 
                  color: summary.net_savings >= 0 ? '#10b981' : '#ef4444' 
                }}>
                  {formatCurrency(summary.net_savings)}
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="finance-tabs">
            <button
              className={`finance-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`finance-tab ${activeTab === 'accounts' ? 'active' : ''}`}
              onClick={() => setActiveTab('accounts')}
            >
              Accounts
            </button>
            <button
              className={`finance-tab ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('transactions')}
            >
              Transactions
            </button>
            <button
              className={`finance-tab ${activeTab === 'receipts' ? 'active' : ''}`}
              onClick={() => setActiveTab('receipts')}
            >
              📄 Receipts
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              <div className="accounts-grid">
                {accounts.filter(a => a.is_active).map(account => (
                  <div 
                    key={account.id} 
                    className={`account-card ${account.type}`}
                    onClick={() => openAccountModal(account)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="account-card-header">
                      <div>
                        <div className="account-card-type">{account.type}</div>
                      </div>
                    </div>
                    <div className="account-card-balance">{formatCurrency(account.balance)}</div>
                    <div className="account-card-name">{account.name}</div>
                  </div>
                ))}
                <div className="account-card add-account-card" onClick={() => openAccountModal()}>
                  <div className="add-account-icon">+</div>
                  <div>Add Account</div>
                </div>
              </div>

              <div className="transactions-section">
                <div className="transactions-header">
                  <h3>Recent Transactions</h3>
                  <button className="finance-btn finance-btn-primary" onClick={() => openTransactionModal()}>
                    + Add Transaction
                  </button>
                </div>
                {transactions.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📝</div>
                    <h3>No transactions yet</h3>
                    <p>Start tracking your income and expenses to see insights here</p>
                    <button className="finance-btn finance-btn-primary" onClick={() => openTransactionModal()}>
                      Add Your First Transaction
                    </button>
                  </div>
                ) : (
                  <div className="transactions-list">
                    {transactions.slice(0, 10).map(transaction => (
                      <div key={transaction.id} className="transaction-item">
                        <div 
                          className="transaction-icon" 
                          style={{ backgroundColor: transaction.category_color + '20' }}
                        >
                          {transaction.category_icon || '📁'}
                        </div>
                        <div className="transaction-details">
                          <div className="transaction-category">
                            {transaction.category_name || 'Uncategorized'}
                          </div>
                          <div className="transaction-description">
                            {transaction.description || 'No description'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className={`transaction-amount ${transaction.type}`}>
                            {transaction.type === 'income' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </div>
                          <div className="transaction-date">{formatDate(transaction.transaction_date)}</div>
                        </div>
                        <div className="transaction-actions">
                          <button 
                            className="transaction-btn edit"
                            onClick={() => openTransactionModal(transaction)}
                          >
                            Edit
                          </button>
                          <button 
                            className="transaction-btn delete"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Accounts Tab */}
          {activeTab === 'accounts' && (
            <div className="accounts-grid">
              {accounts.length === 0 ? (
                <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                  <div className="empty-state-icon">🏦</div>
                  <h3>No accounts yet</h3>
                  <p>Create your first account to start managing your finances. You can add checking accounts, savings, credit cards, or cash.</p>
                  <button className="finance-btn finance-btn-primary" onClick={() => openAccountModal()}>
                    Create Your First Account
                  </button>
                </div>
              ) : (
                <>
                  {accounts.map(account => (
                    <div 
                      key={account.id} 
                      className={`account-card ${account.type}`}
                      onClick={() => openAccountModal(account)}
                      style={{ cursor: 'pointer', opacity: account.is_active ? 1 : 0.5 }}
                    >
                      <div className="account-card-header">
                        <div>
                          <div className="account-card-type">
                            {account.type} {!account.is_active && '(Inactive)'}
                          </div>
                        </div>
                      </div>
                      <div className="account-card-balance">{formatCurrency(account.balance)}</div>
                      <div className="account-card-name">{account.name}</div>
                    </div>
                  ))}
                  <div className="account-card add-account-card" onClick={() => openAccountModal()}>
                    <div className="add-account-icon">+</div>
                    <div>Add Account</div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="transactions-section">
              <div className="transactions-header">
                <h3>All Transactions</h3>
                <button className="finance-btn finance-btn-primary" onClick={() => openTransactionModal()}>
                  + Add Transaction
                </button>
              </div>

              {/* Filters Section */}
              <div className="filters-section">
                <div className="filter-group">
                  <label>Account:</label>
                  <select 
                    value={selectedAccount} 
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Accounts</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Search:</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search transactions..."
                    className="filter-input"
                  />
                </div>

                <div className="filter-group date-filters">
                  <label>Time Period:</label>
                  <div className="date-filter-buttons">
                    <button 
                      className={`filter-btn ${dateFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setDateFilter('all')}
                    >
                      All Time
                    </button>
                    <button 
                      className={`filter-btn ${dateFilter === 'this-month' ? 'active' : ''}`}
                      onClick={() => setDateFilter('this-month')}
                    >
                      This Month
                    </button>
                    <button 
                      className={`filter-btn ${dateFilter === 'last-month' ? 'active' : ''}`}
                      onClick={() => setDateFilter('last-month')}
                    >
                      Last Month
                    </button>
                    <button 
                      className={`filter-btn ${dateFilter === 'this-year' ? 'active' : ''}`}
                      onClick={() => setDateFilter('this-year')}
                    >
                      This Year
                    </button>
                    <button 
                      className={`filter-btn ${dateFilter === 'custom' ? 'active' : ''}`}
                      onClick={() => setDateFilter('custom')}
                    >
                      Custom Range
                    </button>
                  </div>

                  {dateFilter === 'custom' && (
                    <div className="custom-date-range">
                      <input
                        type="date"
                        value={customDateRange.start}
                        onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                        placeholder="Start date"
                        className="date-input"
                      />
                      <span>to</span>
                      <input
                        type="date"
                        value={customDateRange.end}
                        onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                        placeholder="End date"
                        className="date-input"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {getFilteredTransactions().length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📝</div>
                  <h3>No transactions found</h3>
                  <p>
                    {transactions.length === 0 
                      ? 'Click the button above to add your first transaction'
                      : 'Try adjusting your filters to see more transactions'
                    }
                  </p>
                </div>
              ) : (
                <div className="transactions-list">
                  {getFilteredTransactions().map(transaction => {
                    // Find linked receipt
                    const linkedReceipt = receipts.find(r => r.id === transaction.receipt_id)
                    
                    return (
                    <div key={transaction.id} className="transaction-item">
                      <div 
                        className="transaction-icon" 
                        style={{ backgroundColor: transaction.category_color + '20' }}
                      >
                        {transaction.category_icon || '📁'}
                      </div>
                      <div className="transaction-details">
                        <div className="transaction-category">
                          {transaction.category_name || 'Uncategorized'}
                          {linkedReceipt && (
                            <span 
                              style={{ 
                                marginLeft: '8px', 
                                fontSize: '16px', 
                                cursor: 'pointer',
                                title: 'View receipt'
                              }}
                              onClick={() => {
                                setSelectedReceiptImage(linkedReceipt)
                                setShowReceiptImageModal(true)
                              }}
                            >
                              📎
                            </span>
                          )}
                        </div>
                        <div className="transaction-description">
                          {transaction.description || 'No description'} • {transaction.account_name}
                        </div>
                      </div>
                      
                      {/* Receipt Thumbnail */}
                      {linkedReceipt && (() => {
                        const fileInfo = getFileTypeInfo(linkedReceipt.file_name)
                        return (
                        <div 
                          style={{ 
                            width: '50px', 
                            height: '50px', 
                            overflow: 'hidden',
                            borderRadius: '6px',
                            border: '2px solid #e2e8f0',
                            cursor: 'pointer',
                            marginRight: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: fileInfo.isImage ? 'transparent' : fileInfo.bgColor
                          }}
                          onClick={() => {
                            setSelectedReceiptImage(linkedReceipt)
                            setShowReceiptImageModal(true)
                          }}
                          title="Click to view full receipt"
                        >
                          {fileInfo.isImage ? (
                            <img 
                              src={getImageUrl(linkedReceipt.image_url)}
                              alt="Receipt"
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                e.target.onerror = null
                                e.target.parentElement.innerHTML = '<div style="font-size:24px">📄</div>'
                              }}
                            />
                          ) : (
                            <div style={{ fontSize: '24px' }}>
                              {fileInfo.icon}
                            </div>
                          )}
                        </div>
                        )
                      })()}
                      
                      <div style={{ textAlign: 'right' }}>
                        <div className={`transaction-amount ${transaction.type}`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div className="transaction-date">{formatDate(transaction.transaction_date)}</div>
                      </div>
                      <div className="transaction-actions">
                        <button 
                          className="transaction-btn edit"
                          onClick={() => openTransactionModal(transaction)}
                        >
                          Edit
                        </button>
                        <button 
                          className="transaction-btn delete"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Receipts Tab */}
          {activeTab === 'receipts' && (
            <div className="receipts-section">
              <div className="receipts-header">
                <h3>Receipt Manager</h3>
                <button className="finance-btn finance-btn-primary" onClick={() => setShowReceiptUpload(true)}>
                  + Upload Receipt
                </button>
              </div>

              {receipts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📄</div>
                  <h3>No receipts yet</h3>
                  <p>Upload receipt images, PDFs, or documents to keep track of your purchases</p>
                  <button className="finance-btn finance-btn-primary" onClick={() => setShowReceiptUpload(true)}>
                    Upload Your First Receipt
                  </button>
                </div>
              ) : (
                <>
                  {/* Unlinked Receipts Section */}
                  {receipts.filter(r => !transactions.some(t => t.receipt_id === r.id)).length > 0 && (
                    <div style={{ marginBottom: '32px' }}>
                      <div style={{ 
                        background: '#fef3c7', 
                        border: '2px solid #fbbf24',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <span style={{ fontSize: '24px' }}>⚠️</span>
                        <div>
                          <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
                            {receipts.filter(r => !transactions.some(t => t.receipt_id === r.id)).length} Receipt{receipts.filter(r => !transactions.some(t => t.receipt_id === r.id)).length !== 1 ? 's' : ''} Need Linking
                          </div>
                          <div style={{ fontSize: '14px', color: '#92400e' }}>
                            These receipts aren't linked to any transactions yet. Link them to track your spending!
                          </div>
                        </div>
                      </div>
                      
                      <div className="receipts-grid">
                        {receipts
                          .filter(r => !transactions.some(t => t.receipt_id === r.id))
                          .map((receipt, index) => {
                            const imageUrl = receipt.image_url || `/${receipt.file_path}`;
                            const fullUrl = getImageUrl(imageUrl);
                            const fileInfo = getFileTypeInfo(receipt.file_name);
                            const displayName = getReceiptDisplayName(receipt, receipts);
                            
                            return (
                            <div key={receipt.id} className="receipt-card" style={{ border: '2px solid #fbbf24' }}>
                              <div className="receipt-image">
                                {fileInfo.isImage ? (
                                  <img 
                                    src={fullUrl} 
                                    alt={receipt.file_name}
                                    onError={(e) => {
                                      e.target.onerror = null
                                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="%23f1f5f9" width="200" height="200"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%2364748b">📄</text></svg>'
                                    }}
                                  />
                                ) : (
                                  <div style={{ 
                                    height: '200px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    background: fileInfo.bgColor,
                                    fontSize: '48px'
                                  }}>
                                    {fileInfo.icon}
                                  </div>
                                )}
                              </div>
                              <div className="receipt-card-info">
                                {editingReceiptName === receipt.id ? (
                                  <input
                                    type="text"
                                    value={receiptNameValue}
                                    onChange={(e) => setReceiptNameValue(e.target.value)}
                                    onBlur={() => {
                                      if (receiptNameValue.trim()) {
                                        handleUpdateReceiptName(receipt.id, receiptNameValue.trim())
                                      } else {
                                        setEditingReceiptName(null)
                                        setReceiptNameValue('')
                                      }
                                    }}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter' && receiptNameValue.trim()) {
                                        handleUpdateReceiptName(receipt.id, receiptNameValue.trim())
                                      }
                                    }}
                                    autoFocus
                                    style={{
                                      width: '100%',
                                      padding: '4px 8px',
                                      fontSize: '14px',
                                      border: '2px solid #3b82f6',
                                      borderRadius: '4px',
                                      outline: 'none'
                                    }}
                                  />
                                ) : (
                                  <div 
                                    className="receipt-filename" 
                                    onClick={() => {
                                      setEditingReceiptName(receipt.id)
                                      setReceiptNameValue(displayName)
                                    }}
                                    style={{ cursor: 'pointer' }}
                                    title="Click to edit name"
                                  >
                                    {displayName}
                                  </div>
                                )}
                                <div className="receipt-date">
                                  {new Date(receipt.upload_date).toLocaleDateString()}
                                </div>
                                <div style={{ 
                                  marginTop: '8px', 
                                  padding: '6px 12px',
                                  background: '#fbbf24',
                                  color: '#92400e',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  textAlign: 'center'
                                }}>
                                  ⚠️ Not Linked
                                </div>
                              </div>
                              <div className="receipt-actions">
                                <button 
                                  className="receipt-btn"
                                  style={{ background: '#10b981', color: '#fff' }}
                                  onClick={() => {
                                    // Open dedicated link receipt modal
                                    setSelectedReceiptToLink(receipt)
                                    setShowLinkReceiptModal(true)
                                  }}
                                >
                                  🔗 Link to Transaction
                                </button>
                                <button 
                                  className="receipt-btn view"
                                  onClick={() => {
                                    setSelectedReceiptImage(receipt)
                                    setShowReceiptImageModal(true)
                                  }}
                                >
                                  View
                                </button>
                                <button 
                                  className="receipt-btn delete"
                                  onClick={() => handleDeleteReceipt(receipt.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Linked Receipts Section */}
                  {receipts.filter(r => transactions.some(t => t.receipt_id === r.id)).length > 0 && (
                    <div>
                      <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>✅</span>
                        Linked Receipts ({receipts.filter(r => transactions.some(t => t.receipt_id === r.id)).length})
                      </h3>

                      {/* Account Filter Buttons */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '8px', 
                        marginBottom: '20px',
                        flexWrap: 'wrap'
                      }}>
                        <button
                          onClick={() => setReceiptAccountFilter('all')}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: receiptAccountFilter === 'all' ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                            background: receiptAccountFilter === 'all' ? '#eff6ff' : '#fff',
                            color: receiptAccountFilter === 'all' ? '#3b82f6' : '#64748b',
                            fontWeight: receiptAccountFilter === 'all' ? '600' : '500',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                          }}
                        >
                          ALL ACCOUNTS
                        </button>
                        {accounts.filter(a => a.is_active).map(account => {
                          const receiptCount = receipts.filter(r => {
                            const tx = transactions.find(t => t.receipt_id === r.id)
                            return tx && tx.account_id === account.id
                          }).length
                          
                          if (receiptCount === 0) return null
                          
                          return (
                            <button
                              key={account.id}
                              onClick={() => setReceiptAccountFilter(account.id)}
                              style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: receiptAccountFilter === account.id ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                                background: receiptAccountFilter === account.id ? '#eff6ff' : '#fff',
                                color: receiptAccountFilter === account.id ? '#3b82f6' : '#64748b',
                                fontWeight: receiptAccountFilter === account.id ? '600' : '500',
                                cursor: 'pointer',
                                fontSize: '14px',
                                transition: 'all 0.2s',
                                textTransform: 'uppercase'
                              }}
                            >
                              {account.name} ({receiptCount})
                            </button>
                          )
                        })}
                      </div>
                      
                      {/* Thumbnail Grid */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                        gap: '16px' 
                      }}>
                        {receipts
                          .filter(r => {
                            const linkedTxn = transactions.find(t => t.receipt_id === r.id)
                            if (!linkedTxn) return false
                            if (receiptAccountFilter === 'all') return true
                            return linkedTxn.account_id === receiptAccountFilter
                          })
                          .map((receipt) => {
                            const imageUrl = receipt.image_url || `/${receipt.file_path}`;
                            const fullUrl = getImageUrl(imageUrl);
                            const fileInfo = getFileTypeInfo(receipt.file_name);
                            const linkedTransaction = transactions.find(t => t.receipt_id === receipt.id);
                            const displayName = getReceiptDisplayName(receipt, receipts);
                            
                            return (
                            <div 
                              key={receipt.id} 
                              style={{
                                background: '#fff',
                                border: '2px solid #e2e8f0',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onClick={() => setSelectedReceiptDetail(receipt)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)'
                                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = 'none'
                              }}
                            >
                              {/* Thumbnail */}
                              <div style={{ 
                                width: '100%',
                                height: '180px',
                                overflow: 'hidden',
                                background: '#f8fafc'
                              }}>
                                {fileInfo.isImage ? (
                                  <img 
                                    src={fullUrl} 
                                    alt={receipt.file_name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                      e.target.onerror = null
                                      e.target.style.display = 'none'
                                      e.target.parentElement.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f1f5f9;font-size:64px">📄</div>'
                                    }}
                                  />
                                ) : (
                                  <div style={{ 
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    background: fileInfo.bgColor,
                                    fontSize: '64px'
                                  }}>
                                    {fileInfo.icon}
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div style={{ padding: '12px' }}>
                                <div style={{ 
                                  fontSize: '14px', 
                                  fontWeight: '600', 
                                  color: '#1e293b',
                                  marginBottom: '4px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {displayName}
                                </div>
                                {linkedTransaction && (
                                  <>
                                    <div style={{ 
                                      fontSize: '16px', 
                                      fontWeight: 'bold',
                                      color: linkedTransaction.type === 'income' ? '#10b981' : '#ef4444',
                                      marginBottom: '4px'
                                    }}>
                                      {linkedTransaction.type === 'income' ? '+' : '-'}
                                      {formatCurrency(linkedTransaction.amount)}
                                    </div>
                                    <div style={{ 
                                      fontSize: '12px', 
                                      color: '#64748b',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}>
                                      {linkedTransaction.account_name}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Floating Action Button */}
          {activeTab === 'overview' && (
            <button className="action-button" onClick={() => openTransactionModal()}>
              +
            </button>
          )}
        </div>
      </main>

      {/* Account Modal */}
      {showAccountModal && (
        <div className="finance-modal-overlay" onClick={() => setShowAccountModal(false)}>
          <div className="finance-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="finance-modal-header">
              <h3>
                {editingAccount 
                  ? (editingAccount.is_active ? 'Edit Account' : 'Inactive Account')
                  : 'New Account'
                }
              </h3>
              <button className="modal-close" onClick={() => setShowAccountModal(false)}>×</button>
            </div>
            
            {editingAccount && !editingAccount.is_active ? (
              // Inactive account view - show info only with restore option
              <div>
                <div className="finance-form-group">
                  <label>Account Name</label>
                  <input
                    type="text"
                    value={accountForm.name}
                    disabled
                    style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="finance-form-group">
                  <label>Account Type</label>
                  <input
                    type="text"
                    value={accountForm.type}
                    disabled
                    style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="finance-form-group">
                  <label>Current Balance</label>
                  <input
                    type="text"
                    value={formatCurrency(parseFloat(accountForm.balance))}
                    disabled
                    style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                  />
                </div>
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: '#fef3c7', 
                  borderRadius: '8px', 
                  marginBottom: '1rem',
                  border: '1px solid #fbbf24'
                }}>
                  <p style={{ margin: 0, color: '#92400e', fontSize: '0.875rem' }}>
                    ⚠️ This account is inactive. You can restore it to make it active again, or permanently delete it.
                  </p>
                </div>
                <div className="finance-form-actions">
                  <button type="button" className="finance-btn finance-btn-secondary" onClick={() => setShowAccountModal(false)}>
                    Close
                  </button>
                  <button 
                    type="button" 
                    className="finance-btn finance-btn-danger" 
                    onClick={() => handlePermanentDeleteAccount(editingAccount.id)}
                    style={{ marginLeft: 'auto', marginRight: '8px', backgroundColor: '#dc2626', color: 'white' }}
                  >
                    🗑️ Permanently Delete
                  </button>
                  <button 
                    type="button" 
                    className="finance-btn finance-btn-primary" 
                    onClick={() => handleRestoreAccount(editingAccount.id)}
                    style={{ backgroundColor: '#10b981' }}
                  >
                    ✓ Restore Account
                  </button>
                </div>
              </div>
            ) : (
              // Active account or new account - normal edit form
              <form onSubmit={handleAccountSubmit}>
                <div className="finance-form-group">
                  <label>Account Name</label>
                  <input
                    type="text"
                    value={accountForm.name}
                    onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                    required
                    placeholder="e.g., Checking Account"
                  />
                </div>
                <div className="finance-form-group">
                  <label>Account Type</label>
                  <select
                    value={accountForm.type}
                    onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}
                  >
                    <option value="cash">Cash</option>
                    <option value="checking">Checking Account</option>
                    <option value="savings">Savings Account</option>
                    <option value="credit_card">Credit Card</option>
                  </select>
                </div>
                <div className="finance-form-group">
                  <label>Current Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={accountForm.balance}
                    onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })}
                    required
                  />
                </div>
                <div className="finance-form-actions">
                  <button type="button" className="finance-btn finance-btn-secondary" onClick={() => setShowAccountModal(false)}>
                    Cancel
                  </button>
                  {editingAccount && (
                    <button 
                      type="button" 
                      className="finance-btn finance-btn-danger" 
                      onClick={() => handleDeleteAccount(editingAccount.id)}
                      style={{ marginLeft: 'auto', marginRight: '8px', backgroundColor: '#dc2626', color: 'white' }}
                    >
                      Delete
                    </button>
                  )}
                  <button type="submit" className="finance-btn finance-btn-primary">
                    {editingAccount ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Link Receipt to Transaction Modal */}
      {showLinkReceiptModal && selectedReceiptToLink && (
        <div className="finance-modal-overlay" onClick={() => setShowLinkReceiptModal(false)}>
          <div className="finance-modal-content" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="finance-modal-header">
              <h3>🔗 Link Receipt to Transaction</h3>
              <button className="modal-close" onClick={() => setShowLinkReceiptModal(false)}>×</button>
            </div>
            
            {/* Receipt Preview */}
            <div style={{ 
              padding: '16px', 
              background: '#f8fafc', 
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              {getFileTypeInfo(selectedReceiptToLink.file_name).isImage ? (
                <img 
                  src={getImageUrl(selectedReceiptToLink.image_url)}
                  alt={selectedReceiptToLink.file_name}
                  style={{ 
                    width: '60px', 
                    height: '60px', 
                    objectFit: 'cover', 
                    borderRadius: '6px',
                    border: '2px solid #e2e8f0'
                  }}
                />
              ) : (
                <div style={{
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: getFileTypeInfo(selectedReceiptToLink.file_name).bgColor,
                  borderRadius: '6px',
                  fontSize: '24px',
                  border: '2px solid #e2e8f0'
                }}>
                  {getFileTypeInfo(selectedReceiptToLink.file_name).icon}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                  {selectedReceiptToLink.file_name}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Uploaded {new Date(selectedReceiptToLink.upload_date).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Create New Transaction Button - Top Right */}
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '16px', color: '#475569' }}>
                Select a Transaction to Link
              </h4>
              <button
                onClick={() => {
                  setShowLinkReceiptModal(false)
                  setShowCreateTransactionForReceipt(true)
                  openTransactionModal(null, selectedReceiptToLink.id)
                }}
                style={{
                  padding: '10px 16px',
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                ➕ Create New Transaction
              </button>
            </div>

            {/* AI Upgrade Banner - Premium Feature Placeholder */}
            <div style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '8px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#fff'
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                  ✨ AI Auto-Link (Premium)
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  Let AI automatically extract amount, date & category
                </div>
              </div>
              <button style={{
                padding: '8px 16px',
                background: '#fff',
                color: '#667eea',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Upgrade $5/mo
              </button>
            </div>

            {/* Info Banner */}
            <div style={{
              padding: '12px 16px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#0c4a6e'
            }}>
              💡 <strong>Tip:</strong> Transactions with "📎 Has Receipt" will have their current receipt replaced if you select them.
            </div>

            {/* Transaction List */}
            <div style={{ 
              maxHeight: '400px', 
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {transactions
                .slice(0, 20) // Show last 20 transactions (all of them)
                .map(transaction => {
                  const account = accounts.find(a => a.id === transaction.account_id)
                  const category = categories.find(c => c.id === transaction.category_id)
                  return (
                    <button
                      key={transaction.id}
                      type="button"
                      onClick={async () => {
                        // If transaction already has a receipt, confirm before replacing
                        if (transaction.receipt_id) {
                          const existingReceipt = receipts.find(r => r.id === transaction.receipt_id)
                          const confirmed = window.confirm(
                            `⚠️ This transaction already has a receipt attached${existingReceipt ? ` (${existingReceipt.file_name})` : ''}.\n\n` +
                            `Are you sure you want to replace it with "${selectedReceiptToLink.file_name}"?\n\n` +
                            `The old receipt will be unlinked but not deleted.`
                          )
                          if (!confirmed) return
                        }

                        try {
                          // Link receipt to this existing transaction
                          await financeAPI.updateTransaction(transaction.id, {
                            account_id: transaction.account_id,
                            category_id: transaction.category_id,
                            amount: transaction.amount,
                            type: transaction.type,
                            description: transaction.description,
                            transaction_date: transaction.transaction_date,
                            receipt_id: selectedReceiptToLink.id
                          })
                          setShowLinkReceiptModal(false)
                          setSelectedReceiptToLink(null)
                          await fetchAllData()
                        } catch (err) {
                          setError('Failed to link receipt to transaction')
                        }
                      }}
                      style={{
                        padding: '16px',
                        background: '#fff',
                        border: '2px solid #e2e8f0',
                        borderRadius: '10px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f8fafc'
                        e.currentTarget.style.borderColor = '#10b981'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.15)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fff'
                        e.currentTarget.style.borderColor = '#e2e8f0'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                          <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                            {transaction.description || 'No description'}
                          </div>
                          {transaction.receipt_id && (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              padding: '2px 8px',
                              background: '#fef3c7',
                              color: '#92400e',
                              borderRadius: '4px',
                              whiteSpace: 'nowrap'
                            }}>
                              📎 Has Receipt
                            </span>
                          )}
                        </div>
                        <div style={{ 
                          fontSize: '18px', 
                          fontWeight: '700', 
                          color: transaction.type === 'income' ? '#10b981' : '#ef4444',
                          marginLeft: '12px'
                        }}>
                          {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <span>{category?.icon} {category?.name}</span>
                        <span>•</span>
                        <span>💳 {account?.name}</span>
                        <span>•</span>
                        <span>📅 {new Date(transaction.transaction_date).toLocaleDateString()}</span>
                      </div>
                    </button>
                  )
                })}
              {transactions.length === 0 && (
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '2px dashed #cbd5e1'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    No Transactions Yet
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                    Create a transaction to link this receipt
                  </div>
                  <button
                    onClick={() => {
                      setShowLinkReceiptModal(false)
                      setShowCreateTransactionForReceipt(true)
                      openTransactionModal(null, selectedReceiptToLink.id)
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ➕ Create New Transaction
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="finance-modal-overlay" onClick={() => setShowTransactionModal(false)}>
          <div className="finance-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="finance-modal-header">
              <h3>{editingTransaction ? 'Edit Transaction' : showCreateTransactionForReceipt ? 'Create Transaction with Receipt' : 'New Transaction'}</h3>
              <button className="modal-close" onClick={() => {
                setShowTransactionModal(false)
                setShowCreateTransactionForReceipt(false)
              }}>×</button>
            </div>
            
            {/* Show receipt preview if creating transaction for receipt */}
            {showCreateTransactionForReceipt && selectedReceiptToLink && (
              <div style={{ 
                padding: '12px', 
                background: '#f0fdf4', 
                border: '1px solid #86efac',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
              }}>
                {getFileTypeInfo(selectedReceiptToLink.file_name).isImage ? (
                  <img 
                    src={getImageUrl(selectedReceiptToLink.image_url)}
                    alt={selectedReceiptToLink.file_name}
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      objectFit: 'cover', 
                      borderRadius: '4px'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: getFileTypeInfo(selectedReceiptToLink.file_name).bgColor,
                    borderRadius: '4px',
                    fontSize: '20px'
                  }}>
                    {getFileTypeInfo(selectedReceiptToLink.file_name).icon}
                  </div>
                )}
                <div style={{ flex: 1, fontSize: '13px' }}>
                  <div style={{ fontWeight: '600', color: '#166534' }}>
                    📎 Receipt: {selectedReceiptToLink.file_name}
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleTransactionSubmit}>
              <div className="finance-form-group">
                <label>Account</label>
                <select
                  value={transactionForm.account_id}
                  onChange={(e) => setTransactionForm({ ...transactionForm, account_id: e.target.value })}
                  required
                >
                  <option value="">Select account</option>
                  {accounts.filter(a => a.is_active).map(account => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
              </div>
              <div className="finance-form-group">
                <label>Type</label>
                <select
                  value={transactionForm.type}
                  onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value })}
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div className="finance-form-group">
                <label>Category</label>
                <select
                  value={transactionForm.category_id}
                  onChange={(e) => setTransactionForm({ ...transactionForm, category_id: e.target.value })}
                >
                  <option value="">Select category</option>
                  {categories
                    .filter(c => c.type === transactionForm.type)
                    .map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="finance-form-group">
                <label>Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="finance-form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={transactionForm.transaction_date}
                  onChange={(e) => setTransactionForm({ ...transactionForm, transaction_date: e.target.value })}
                  required
                />
              </div>
              <div className="finance-form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                  placeholder="Add notes about this transaction..."
                />
              </div>
              
              {/* Receipt Picker - Only show when NOT creating transaction for a receipt */}
              {!showCreateTransactionForReceipt && (
                <>
                  <div className="finance-form-group">
                    <label>
                      📄 Attach Receipt (Optional)
                      {receipts.length === 0 && (
                        <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>
                          Upload receipts in the Receipts tab first
                        </span>
                      )}
                    </label>
                    <select
                      value={transactionForm.receipt_id || ''}
                      onChange={(e) => setTransactionForm({ 
                        ...transactionForm, 
                        receipt_id: e.target.value ? parseInt(e.target.value) : null 
                      })}
                    >
                      <option value="">No receipt</option>
                      {receipts
                        .filter(r => !transactions.some(t => t.receipt_id === r.id)) // Only show unlinked receipts
                        .map(receipt => (
                          <option key={receipt.id} value={receipt.id}>
                            📎 {getReceiptDisplayName(receipt, receipts)} - {new Date(receipt.upload_date).toLocaleDateString()}
                          </option>
                        ))}
                    </select>
                    
                    {/* Receipt Preview */}
                    {transactionForm.receipt_id && receipts.find(r => r.id === transactionForm.receipt_id) && (() => {
                      const selectedReceipt = receipts.find(r => r.id === transactionForm.receipt_id)
                      const fileInfo = getFileTypeInfo(selectedReceipt.file_name)
                      return (
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ 
                            border: '2px solid #e2e8f0', 
                            borderRadius: '8px', 
                            padding: '8px',
                            backgroundColor: '#f8fafc'
                          }}>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Preview:</div>
                            {fileInfo.isImage ? (
                              <img 
                                src={getImageUrl(selectedReceipt.image_url)}
                                alt="Receipt preview"
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: '150px', 
                                  borderRadius: '4px',
                                  objectFit: 'contain'
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px',
                                background: fileInfo.bgColor,
                                borderRadius: '4px'
                              }}>
                                <div style={{ fontSize: '32px' }}>{fileInfo.icon}</div>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>
                                  {selectedReceipt.file_name}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                  
                  {/* OR divider */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    margin: '16px 0',
                    color: '#94a3b8',
                    fontSize: '14px'
                  }}>
                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                    <span>OR</span>
                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                  </div>
                  
                  {/* Upload New Receipt */}
                  <div className="finance-form-group">
                    <label>📤 Upload New Receipt</label>
                    <input
                      type="file"
                      accept="image/*,.pdf,.heic,.eml,.msg,.doc,.docx,.txt"
                      onChange={async (e) => {
                        const file = e.target.files[0]
                        if (!file) return
                        
                        try {
                          const formData = new FormData()
                          formData.append('file', file)
                          
                          const uploadedReceipt = await financeAPI.uploadReceipt(formData)
                          
                          // Refresh receipts list
                          await fetchAllData()
                          
                          // Auto-select the newly uploaded receipt
                          setTransactionForm({
                            ...transactionForm,
                            receipt_id: uploadedReceipt.id
                          })
                          
                          // Clear the file input
                          e.target.value = ''
                        } catch (err) {
                          console.error('Error uploading receipt:', err)
                          setError(err.response?.data?.error || 'Failed to upload receipt')
                        }
                      }}
                      style={{
                        padding: '8px',
                        border: '2px dashed #cbd5e1',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    />
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Supported: Images, PDF, HEIC, Documents, Emails
                    </div>
                  </div>
                </>
              )}
              
              <div className="finance-form-actions">
                <button type="button" className="finance-btn finance-btn-secondary" onClick={() => {
                  setShowTransactionModal(false)
                  setShowCreateTransactionForReceipt(false)
                }}>
                  Cancel
                </button>
                <button type="submit" className="finance-btn finance-btn-primary">
                  {editingTransaction ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Upload Modal */}
      {showReceiptUpload && (
        <div className="finance-modal-overlay" onClick={() => setShowReceiptUpload(false)}>
          <div className="finance-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="finance-modal-header">
              <h3>Upload Receipt</h3>
              <button className="modal-close" onClick={() => setShowReceiptUpload(false)}>×</button>
            </div>
            <div className="receipt-upload-zone">
              <input
                type="file"
                id="receipt-file"
                accept="image/*,.pdf,.heic,.txt,.doc,.docx,.eml,.msg"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    handleReceiptUpload(e.target.files[0])
                  }
                }}
                style={{ display: 'none' }}
              />
              <label htmlFor="receipt-file" className="receipt-upload-label">
                {uploadingReceipt ? (
                  <>
                    <div className="upload-spinner"></div>
                    <p>Uploading...</p>
                  </>
                ) : (
                  <>
                    <div className="upload-icon">📤</div>
                    <h4>Click to browse</h4>
                    <p>Supports: PNG, JPG, PDF, HEIC</p>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Image Modal */}
      {showReceiptImageModal && selectedReceiptImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={() => {
            setShowReceiptImageModal(false)
            setSelectedReceiptImage(null)
          }}
        >
          <div 
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              backgroundColor: '#fff',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setShowReceiptImageModal(false)
                setSelectedReceiptImage(null)
              }}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                color: '#fff',
                fontSize: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}
            >
              ×
            </button>

            {/* Receipt Content */}
            {(() => {
              const fileInfo = getFileTypeInfo(selectedReceiptImage.file_name)
              const imageUrl = selectedReceiptImage.image_url || `/${selectedReceiptImage.file_path}`
              const fullUrl = getImageUrl(imageUrl)
              
              if (fileInfo.isImage) {
                return (
                  <img 
                    src={fullUrl}
                    alt={selectedReceiptImage.file_name}
                    style={{
                      width: '100%',
                      height: '100%',
                      maxHeight: '90vh',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                )
              } else if (selectedReceiptImage.file_name.toLowerCase().endsWith('.pdf')) {
                return (
                  <iframe
                    src={fullUrl}
                    style={{
                      width: '90vw',
                      height: '90vh',
                      border: 'none',
                      display: 'block'
                    }}
                    title={selectedReceiptImage.file_name}
                  />
                )
              } else {
                return (
                  <div style={{
                    width: '600px',
                    height: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: fileInfo.bgColor,
                    padding: '40px'
                  }}>
                    <div style={{ fontSize: '120px', marginBottom: '20px' }}>
                      {fileInfo.icon}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#1e293b' }}>
                      {selectedReceiptImage.file_name}
                    </div>
                    <a 
                      href={fullUrl}
                      download={selectedReceiptImage.file_name}
                      style={{
                        padding: '12px 24px',
                        background: '#3b82f6',
                        color: '#fff',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: '600'
                      }}
                    >
                      Download File
                    </a>
                  </div>
                )
              }
            })()}

            {/* Filename footer */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '12px 16px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: '#fff',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {selectedReceiptImage.file_name}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Detail Modal */}
      {selectedReceiptDetail && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
          onClick={() => setSelectedReceiptDetail(null)}
        >
          <div 
            style={{ 
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedReceiptDetail(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                fontSize: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1
              }}
            >
              ×
            </button>

            {/* Receipt Image/Preview */}
            <div style={{ padding: '24px' }}>
              {(() => {
                const imageUrl = selectedReceiptDetail.image_url || `/${selectedReceiptDetail.file_path}`
                const fullUrl = getImageUrl(imageUrl)
                const fileInfo = getFileTypeInfo(selectedReceiptDetail.file_name)
                
                return (
                  <div style={{ 
                    width: '100%',
                    marginBottom: '24px'
                  }}>
                    {fileInfo.isImage ? (
                      <div style={{ 
                        width: '100%',
                        maxHeight: '400px',
                        overflow: 'hidden',
                        borderRadius: '12px',
                        background: '#f8fafc'
                      }}>
                        <img 
                          src={fullUrl} 
                          alt={selectedReceiptDetail.file_name}
                          style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                        />
                      </div>
                    ) : (
                      <div style={{ 
                        width: '100%',
                        borderRadius: '12px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: '100%',
                          height: '200px',
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: fileInfo.bgColor,
                          fontSize: '72px'
                        }}>
                          {fileInfo.icon}
                          <div style={{ fontSize: '16px', marginTop: '12px', color: '#64748b', fontWeight: '600' }}>
                            {selectedReceiptDetail.file_name}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedReceiptDetail(null)  // Close detail modal first
                            setSelectedReceiptImage(selectedReceiptDetail)
                            setShowReceiptImageModal(true)
                          }}
                          style={{
                            width: '100%',
                            padding: '16px',
                            background: '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                        >
                          👁️ See Full Preview
                        </button>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Receipt Name - Editable */}
              <div style={{ marginBottom: '24px' }}>
                {editingReceiptName === selectedReceiptDetail.id ? (
                  <input
                    type="text"
                    value={receiptNameValue}
                    onChange={(e) => setReceiptNameValue(e.target.value)}
                    onBlur={() => {
                      if (receiptNameValue.trim()) {
                        handleUpdateReceiptName(selectedReceiptDetail.id, receiptNameValue.trim())
                      } else {
                        setEditingReceiptName(null)
                        setReceiptNameValue('')
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && receiptNameValue.trim()) {
                        handleUpdateReceiptName(selectedReceiptDetail.id, receiptNameValue.trim())
                      }
                    }}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '20px',
                      fontWeight: '600',
                      border: '2px solid #3b82f6',
                      borderRadius: '8px',
                      outline: 'none'
                    }}
                  />
                ) : (
                  <h2 
                    onClick={() => {
                      setEditingReceiptName(selectedReceiptDetail.id)
                      setReceiptNameValue(getReceiptDisplayName(selectedReceiptDetail, receipts))
                    }}
                    style={{ 
                      fontSize: '24px',
                      fontWeight: '700',
                      color: '#1e293b',
                      marginBottom: '8px',
                      cursor: 'pointer'
                    }}
                    title="Click to edit name"
                  >
                    {getReceiptDisplayName(selectedReceiptDetail, receipts)}
                  </h2>
                )}
              </div>

              {/* Extract Text Button */}
              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={() => handleExtractText(selectedReceiptDetail)}
                  disabled={isExtracting}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: isExtracting ? '#94a3b8' : '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: isExtracting ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => !isExtracting && (e.currentTarget.style.background = '#059669')}
                  onMouseLeave={(e) => !isExtracting && (e.currentTarget.style.background = '#10b981')}
                >
                  {isExtracting ? (
                    <>🔄 Extracting Text...</>
                  ) : (
                    <>🔍 Extract Text & Itemize</>
                  )}
                </button>
              </div>

              {/* Transaction Details */}
              {(() => {
                const linkedTx = transactions.find(t => t.receipt_id === selectedReceiptDetail.id)
                if (!linkedTx) return null
                
                return (
                  <div style={{ 
                    background: '#f8fafc',
                    padding: '20px',
                    borderRadius: '12px',
                    marginBottom: '24px'
                  }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>
                      Transaction Details
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontSize: '14px' }}>Description:</span>
                        <span style={{ fontWeight: '600', fontSize: '16px' }}>{linkedTx.description}</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontSize: '14px' }}>Amount:</span>
                        <span style={{ 
                          fontWeight: 'bold',
                          fontSize: '20px',
                          color: linkedTx.type === 'income' ? '#10b981' : '#ef4444'
                        }}>
                          {linkedTx.type === 'income' ? '+' : '-'}{formatCurrency(linkedTx.amount)}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontSize: '14px' }}>Category:</span>
                        <span style={{ fontWeight: '600' }}>📁 {linkedTx.category_name || 'Uncategorized'}</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontSize: '14px' }}>Account:</span>
                        <span style={{ fontWeight: '600' }}>🏦 {linkedTx.account_name}</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontSize: '14px' }}>Date:</span>
                        <span style={{ fontWeight: '600' }}>📅 {formatDate(linkedTx.transaction_date)}</span>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'stretch' }}>
                {(() => {
                  const linkedTx = transactions.find(t => t.receipt_id === selectedReceiptDetail.id)
                  return linkedTx && (
                    <>
                      <button 
                        className="receipt-btn"
                        style={{ 
                          flex: 1,
                          background: '#3b82f6',
                          color: '#fff',
                          padding: '14px',
                          fontSize: '16px',
                          fontWeight: '600'
                        }}
                        onClick={() => {
                          setSelectedReceiptDetail(null)
                          openTransactionModal(linkedTx)
                        }}
                      >
                        📝 View Transaction
                      </button>
                      
                      <button 
                        className="receipt-btn"
                        style={{ 
                          flex: 1,
                          background: '#f59e0b',
                          color: '#fff',
                          padding: '14px',
                          fontSize: '16px',
                          fontWeight: '600'
                        }}
                        onClick={async () => {
                          try {
                            await financeAPI.updateTransaction(linkedTx.id, {
                              account_id: linkedTx.account_id,
                              category_id: linkedTx.category_id,
                              amount: linkedTx.amount,
                              type: linkedTx.type,
                              description: linkedTx.description,
                              transaction_date: linkedTx.transaction_date,
                              receipt_id: null
                            })
                            await fetchAllData()
                            setSelectedReceiptDetail(null)
                          } catch (err) {
                            console.error('Error unlinking receipt:', err)
                            setError(err.response?.data?.error || 'Failed to unlink receipt')
                          }
                        }}
                      >
                        🔓 Unlink
                      </button>
                      
                      <button 
                        className="receipt-btn delete"
                        style={{ 
                          flex: 1,
                          padding: '14px',
                          fontSize: '16px',
                          fontWeight: '600'
                        }}
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this receipt?')) {
                            await handleDeleteReceipt(selectedReceiptDetail.id)
                            setSelectedReceiptDetail(null)
                          }
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Itemization Modal */}
      {showItemizationModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 11000
          }}
          onClick={handleCloseItemizationModal}
        >
          <div 
            style={{ 
              background: '#fff',
              borderRadius: '16px',
              width: '90%',
              maxWidth: '1000px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ 
              padding: '24px',
              borderBottom: '2px solid #e2e8f0',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff'
            }}>
              <button 
                onClick={handleCloseItemizationModal}
                style={{
                  float: 'right',
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
              <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
                🔍 Itemize Receipt
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', position: 'relative' }}>
                <span style={{ fontSize: '14px', opacity: 0.9 }}>Merchant:</span>
                <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                  <input
                    type="text"
                    value={merchantName}
                    onChange={(e) => handleMerchantInputChange(e.target.value)}
                    onFocus={() => {
                      if (merchantName) fetchMerchantSuggestions(merchantName)
                      setShowMerchantDropdown(true)
                    }}
                    onBlur={() => setTimeout(() => setShowMerchantDropdown(false), 200)}
                    placeholder="Store or merchant name"
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      fontSize: '14px',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      fontWeight: '600'
                    }}
                  />
                  {/* Autocomplete Dropdown */}
                  {showMerchantDropdown && merchantSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      background: '#fff',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                      zIndex: 12000,
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      {merchantSuggestions.map((merchant, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectMerchant(merchant)}
                          onMouseDown={(e) => e.preventDefault()} // Prevent blur
                          style={{
                            padding: '10px 12px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#1e293b',
                            borderBottom: idx < merchantSuggestions.length - 1 ? '1px solid #e2e8f0' : 'none',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                        >
                          🏪 {merchant}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <p style={{ fontSize: '14px', opacity: 0.9 }}>
                Select items, assign categories, and confirm total
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div style={{
                padding: '16px',
                background: '#fee2e2',
                color: '#dc2626',
                fontWeight: '600',
                borderBottom: '1px solid #fecaca'
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Stats Summary */}
            <div style={{ 
              padding: '16px 24px',
              background: '#f8fafc',
              borderBottom: '2px solid #e2e8f0',
              display: 'flex',
              gap: '20px',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
                <div style={{ 
                  flex: 1, 
                  background: '#fff', 
                  padding: '16px', 
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Subtotal (Items):</span>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#10b981' }}>
                      ${calculateItemTotal().toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Tax:</span>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#f59e0b' }}>
                      ${receiptTaxes.reduce((sum, tax) => sum + (parseFloat(tax.amount) || 0), 0).toFixed(2)}
                    </span>
                  </div>
                  <div style={{ 
                    borderTop: '2px solid #cbd5e1', 
                    paddingTop: '8px', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '14px', color: '#475569', fontWeight: '700' }}>Receipt Total:</span>
                    <div style={{ position: 'relative' }}>
                      <span style={{ 
                        position: 'absolute', 
                        left: '8px', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#6366f1',
                        pointerEvents: 'none'
                      }}>
                        $
                      </span>
                      <input
                        type="text"
                        value={confirmedTotalAmount}
                        onChange={(e) => setConfirmedTotalAmount(e.target.value)}
                        placeholder="0.00"
                        style={{
                          width: '100px',
                          padding: '6px 6px 6px 24px',
                          fontSize: '18px',
                          fontWeight: '700',
                          color: '#6366f1',
                          border: '2px solid #c7d2fe',
                          borderRadius: '6px',
                          textAlign: 'left',
                          background: '#fff'
                        }}
                      />
                    </div>
                  </div>
                </div>
            </div>

            {/* Tax Breakdown Section - Collapsed by default */}
            <details style={{ 
              marginBottom: '24px',
              padding: '16px', 
              background: '#f8fafc', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}>
              <summary style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>💰 Tax Details (Optional)</span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Total Tax: ${receiptTaxes.reduce((sum, tax) => sum + (parseFloat(tax.amount) || 0), 0).toFixed(2)}
                </span>
              </summary>
              
              <div style={{ marginTop: '16px' }}>
                <button
                  onClick={() => {
                    setReceiptTaxes([...receiptTaxes, { 
                      code: '', 
                      description: '', 
                      rate: null, 
                      amount: 0,
                      taxable_subtotal: null 
                    }])
                  }}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#64748b',
                    background: '#fff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    marginBottom: '12px'
                  }}
                >
                  + Add Tax Line
                </button>
              </div>
              
              {receiptTaxes.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '16px', 
                  color: '#94a3b8',
                  fontSize: '13px'
                }}>
                  No tax breakdown. Click "+ Add Tax Line" if needed.
                </div>
              ) : (
                receiptTaxes.map((tax, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    marginBottom: '8px',
                    alignItems: 'center',
                    background: '#fff',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <input
                      value={tax.code || ''}
                      onChange={(e) => {
                        const updated = [...receiptTaxes]
                        updated[idx].code = e.target.value
                        setReceiptTaxes(updated)
                      }}
                      placeholder="TAX1"
                      style={{
                        width: '60px',
                        padding: '6px',
                        fontSize: '12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px'
                      }}
                    />
                    <input
                      value={tax.rate !== null && tax.rate !== undefined ? tax.rate : ''}
                      onChange={(e) => {
                        const updated = [...receiptTaxes]
                        // Allow empty string, don't force to number immediately
                        updated[idx].rate = e.target.value
                        setReceiptTaxes(updated)
                      }}
                      placeholder="9.20"
                      style={{
                        width: '50px',
                        padding: '6px',
                        fontSize: '12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px'
                      }}
                    />
                    <span style={{ fontSize: '12px' }}>%</span>
                    <span style={{ fontSize: '12px' }}>$</span>
                    <input
                      value={tax.amount !== null && tax.amount !== undefined ? tax.amount : ''}
                      onChange={(e) => {
                        const updated = [...receiptTaxes]
                        // Allow empty string, don't force to number immediately
                        updated[idx].amount = e.target.value
                        setReceiptTaxes(updated)
                      }}
                      placeholder="0.00"
                      style={{
                        width: '70px',
                        padding: '6px',
                        fontSize: '12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px'
                      }}
                    />
                    <input
                      value={tax.description || ''}
                      onChange={(e) => {
                        const updated = [...receiptTaxes]
                        updated[idx].description = e.target.value
                        setReceiptTaxes(updated)
                      }}
                      placeholder="Description"
                      style={{
                        flex: 1,
                        padding: '6px',
                        fontSize: '12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px'
                      }}
                    />
                    <button
                      onClick={() => {
                        const updated = receiptTaxes.filter((_, i) => i !== idx)
                        setReceiptTaxes(updated)
                      }}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: '1px solid #fecaca',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
              
              {/* Tax validation warning */}
              {confirmedTotalAmount && receiptTaxes.length > 0 && (() => {
                const itemTotal = calculateItemTotal()
                const taxTotal = receiptTaxes.reduce((sum, tax) => sum + (parseFloat(tax.amount) || 0), 0)
                const receiptTotal = parseFloat(confirmedTotalAmount) || 0
                const expectedTotal = itemTotal + taxTotal
                const mismatch = Math.abs(expectedTotal - receiptTotal) > 0.01
                
                return mismatch ? (
                  <div style={{ 
                    marginTop: '12px',
                    padding: '8px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '4px',
                    color: '#991b1b',
                    fontSize: '12px'
                  }}>
                    ⚠️ Items (${itemTotal.toFixed(2)}) + Taxes (${taxTotal.toFixed(2)}) ≠ Total (${receiptTotal.toFixed(2)})
                  </div>
                ) : null
              })()}
            </details>

            {/* AI Extraction Warning Banner */}
            {extractedLines.length > 0 && (() => {
              const itemTotal = calculateItemTotal()
              const receiptTotal = parseFloat(confirmedTotalAmount) || 0
              const taxTotal = receiptTaxes.reduce((sum, tax) => sum + (parseFloat(tax.amount) || 0), 0)
              const mismatch = Math.abs((itemTotal + taxTotal) - receiptTotal) > 0.50
              
              return (
                <div style={{ 
                  marginBottom: '16px',
                  padding: '16px 20px',
                  background: mismatch ? '#fef3c7' : '#dbeafe',
                  border: `2px solid ${mismatch ? '#fbbf24' : '#93c5fd'}`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '24px' }}>{mismatch ? '⚠️' : 'ℹ️'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e40af', marginBottom: '4px' }}>
                      {mismatch ? 'Verify Items' : 'Items Extracted'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#475569' }}>
                      {mismatch 
                        ? 'The AI may have missed some items. Please verify all items from your receipt and add any missing ones using the button below.'
                        : 'AI extracted items from your receipt. Please verify accuracy and add any missing items if needed.'}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Items List */}
            <div style={{ 
              flex: 1,
              overflowY: 'auto',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                  💡 <strong>Instructions:</strong> Assign a category to each unique item. Duplicates are grouped automatically.
                </p>
                
                <button
                  onClick={() => {
                    const newIndex = extractedLines.length
                    setExtractedLines([...extractedLines, 'New Item $0.00'])
                    setItemPrices({...itemPrices, [newIndex]: '0.00'})
                    setItemSkus({...itemSkus, [newIndex]: ''})
                    setItemNames({...itemNames, [newIndex]: 'New Item'})
                    setSelectedItems(new Set([...selectedItems, newIndex]))
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#fff',
                    background: '#10b981',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#059669'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#10b981'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>+</span>
                  Add Item
                </button>
              </div>

              {/* Grouped Items Display */}
              {groupItems().map((group, groupIndex) => {
                const firstIndex = group.indices[0]
                const category = group.category ? categories.find(c => c.id === group.category) : null
                const itemCount = group.indices.length
                const isEditingName = editingItemName === groupIndex
                const isEditingSku = editingItemSku === groupIndex
                
                return (
                  <div 
                    key={groupIndex}
                    style={{
                      marginBottom: '8px',
                      padding: '16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* Item Name - looks like text until clicked */}
                    <div style={{ flex: 2, minWidth: '200px' }}>
                      {isEditingName ? (
                        <input
                          type="text"
                          value={itemCustomNames.hasOwnProperty(firstIndex) ? itemCustomNames[firstIndex] : group.displayName}
                          onChange={(e) => {
                            const newNames = {...itemCustomNames}
                            group.indices.forEach(idx => {
                              newNames[idx] = e.target.value
                            })
                            setItemCustomNames(newNames)
                          }}
                          onBlur={() => setEditingItemName(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setEditingItemName(null)
                          }}
                          autoFocus
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#1e293b',
                            border: '2px solid #3b82f6',
                            borderRadius: '6px',
                            background: '#fff',
                            outline: 'none'
                          }}
                        />
                      ) : (
                        <div
                          onClick={() => setEditingItemName(groupIndex)}
                          style={{
                            padding: '6px 8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#1e293b',
                            cursor: 'text',
                            borderRadius: '6px',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          {itemCustomNames.hasOwnProperty(firstIndex) ? itemCustomNames[firstIndex] : group.displayName}
                          {itemCount > 1 && (
                            <span style={{ 
                              marginLeft: '8px',
                              fontSize: '14px',
                              fontWeight: '700',
                              color: '#3b82f6',
                              background: '#dbeafe',
                              padding: '2px 8px',
                              borderRadius: '12px'
                            }}>
                              ×{itemCount}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* SKU - looks like text until clicked */}
                    <div style={{ flex: 1, minWidth: '120px' }}>
                      {isEditingSku ? (
                        <input
                          type="text"
                          value={itemSkus.hasOwnProperty(firstIndex) ? itemSkus[firstIndex] : group.sku || ''}
                          onChange={(e) => {
                            const newSkus = {...itemSkus}
                            group.indices.forEach(idx => {
                              newSkus[idx] = e.target.value
                            })
                            setItemSkus(newSkus)
                          }}
                          onBlur={() => setEditingItemSku(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setEditingItemSku(null)
                          }}
                          placeholder="SKU/UPC"
                          autoFocus
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            fontSize: '13px',
                            color: '#64748b',
                            fontFamily: 'monospace',
                            border: '2px solid #3b82f6',
                            borderRadius: '6px',
                            background: '#fff',
                            outline: 'none'
                          }}
                        />
                      ) : (
                        <div
                          onClick={() => setEditingItemSku(groupIndex)}
                          style={{
                            padding: '6px 8px',
                            fontSize: '13px',
                            color: '#64748b',
                            fontFamily: 'monospace',
                            cursor: 'text',
                            borderRadius: '6px',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          {(itemSkus.hasOwnProperty(firstIndex) && itemSkus[firstIndex]) || group.sku || 'Add SKU...'}
                        </div>
                      )}
                    </div>

                    {/* Category Dropdown - 1/3 width */}
                    <div style={{ flex: 1, minWidth: '180px', maxWidth: '250px' }}>
                      <select
                        value={group.category || ''}
                        onChange={(e) => {
                          const categoryId = parseInt(e.target.value) || ''
                          const newCategories = {...itemCategories}
                          group.indices.forEach(idx => {
                            if (categoryId) {
                              newCategories[idx] = categoryId
                            } else {
                              delete newCategories[idx]
                            }
                          })
                          setItemCategories(newCategories)
                          
                          // Auto-select all items in group when category assigned
                          if (categoryId) {
                            const newSelected = new Set(selectedItems)
                            group.indices.forEach(idx => newSelected.add(idx))
                            setSelectedItems(newSelected)
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: '14px',
                          border: '2px solid #cbd5e1',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: category ? '#f0fdf4' : '#fff',
                          color: category ? '#166534' : '#64748b',
                          fontWeight: category ? '600' : '400',
                          outline: 'none'
                        }}
                      >
                        <option value="">Choose category...</option>
                        {categories
                          .filter(cat => cat.type === 'expense')
                          .map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.icon} {cat.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Price - editable */}
                    <div style={{ minWidth: '100px', textAlign: 'right' }}>
                      <input
                        type="number"
                        step="0.01"
                        value={itemPrices.hasOwnProperty(firstIndex) ? itemPrices[firstIndex] : group.totalPrice.toFixed(2)}
                        onChange={(e) => {
                          const newPrices = {...itemPrices}
                          const totalPrice = parseFloat(e.target.value) || 0
                          const pricePerItem = totalPrice / itemCount
                          group.indices.forEach(idx => {
                            newPrices[idx] = pricePerItem.toFixed(2)
                          })
                          setItemPrices(newPrices)
                        }}
                        style={{
                          width: '100%',
                          padding: '8px',
                          fontSize: '18px',
                          fontWeight: '700',
                          color: '#10b981',
                          border: '2px solid #d1fae5',
                          borderRadius: '6px',
                          background: '#f0fdf4',
                          textAlign: 'right',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer Actions */}
            <div style={{ 
              padding: '24px',
              borderTop: '2px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={handleCloseItemizationModal}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: '#e2e8f0',
                  color: '#475569',
                  border: '2px solid #cbd5e1',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#cbd5e1'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#e2e8f0'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                ✖ Cancel
              </button>
              <button
                onClick={handleSaveItemization}
                style={{
                  flex: 2,
                  padding: '16px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  boxShadow: '0 4px 6px -1px rgb(59 130 246 / 0.5)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgb(59 130 246 / 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(59 130 246 / 0.5)'
                }}
              >
                💾 Save Itemization ({extractedLines.length} items)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      {showConfirmModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001
          }}
          onClick={() => setShowConfirmModal(false)}
        >
          <div 
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: '16px',
              color: confirmModalConfig.type === 'danger' ? '#dc2626' : '#3b82f6',
              fontSize: '18px'
            }}>
              {confirmModalConfig.title}
            </h3>
            <p style={{ marginBottom: '24px', color: '#64748b', lineHeight: '1.5' }}>
              {confirmModalConfig.message}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  confirmModalConfig.onConfirm()
                }}
                style={{
                  padding: '10px 20px',
                  background: confirmModalConfig.type === 'danger' ? '#dc2626' : '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {confirmModalConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Finance
