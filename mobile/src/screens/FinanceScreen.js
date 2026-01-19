import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/commonStyles';
import api from '../services/api';

export default function FinanceScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const [accountsRes, transactionsRes, summaryRes] = await Promise.all([
        api.get('/finance/accounts'),
        api.get('/finance/transactions?limit=10'),
        api.get('/finance/statistics/summary')
      ]);
      
      setAccounts(accountsRes.data.accounts || []);
      setTransactions(transactionsRes.data.transactions || []);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error fetching finance data:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Set empty data on error so UI still renders
      setAccounts([]);
      setTransactions([]);
      setSummary({ total_income: 0, total_expenses: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFinanceData();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={{ marginTop: 16, color: '#64748b' }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={{ padding: 20, paddingBottom: 10 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1e293b' }}>Finance</Text>
          <Text style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            Track your income and expenses
          </Text>
        </View>

        {/* Summary Cards */}
        {summary && (
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <View style={{ 
              backgroundColor: '#2563eb', 
              borderRadius: 16, 
              padding: 20,
              marginBottom: 12
            }}>
              <Text style={{ color: '#93c5fd', fontSize: 14, marginBottom: 4 }}>Net Savings</Text>
              <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>
                {formatCurrency(summary.total_income - summary.total_expenses)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ 
                flex: 1, 
                backgroundColor: '#10b981', 
                borderRadius: 12, 
                padding: 16 
              }}>
                <Text style={{ color: '#d1fae5', fontSize: 12, marginBottom: 4 }}>Income</Text>
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '600' }}>
                  {formatCurrency(summary.total_income)}
                </Text>
              </View>

              <View style={{ 
                flex: 1, 
                backgroundColor: '#ef4444', 
                borderRadius: 12, 
                padding: 16 
              }}>
                <Text style={{ color: '#fecaca', fontSize: 12, marginBottom: 4 }}>Expenses</Text>
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '600' }}>
                  {formatCurrency(summary.total_expenses)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Accounts Section */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1e293b' }}>Accounts</Text>
            <Text style={{ color: '#64748b', fontSize: 14 }}>{accounts.length} total</Text>
          </View>

          {accounts.length === 0 ? (
            <View style={{ 
              backgroundColor: '#f1f5f9', 
              borderRadius: 12, 
              padding: 20,
              alignItems: 'center' 
            }}>
              <Text style={{ color: '#64748b', textAlign: 'center' }}>
                No accounts yet. Add one on the web to get started!
              </Text>
            </View>
          ) : (
            accounts.slice(0, 4).map((account) => (
              <View 
                key={account.id}
                style={{ 
                  backgroundColor: '#fff', 
                  borderRadius: 12, 
                  padding: 16,
                  marginBottom: 8,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1
                }}
              >
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b' }}>
                    {account.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {account.type}
                  </Text>
                </View>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: '600',
                  color: account.balance >= 0 ? '#10b981' : '#ef4444'
                }}>
                  {formatCurrency(account.balance)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Recent Transactions */}
        <View style={{ paddingHorizontal: 20, marginBottom: 80 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1e293b' }}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ReceiptUpload')}>
              <Text style={{ fontSize: 14, color: '#2563eb', fontWeight: '600' }}>📄 Receipts</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={{ 
              backgroundColor: '#f1f5f9', 
              borderRadius: 12, 
              padding: 20,
              alignItems: 'center' 
            }}>
              <Text style={{ color: '#64748b', textAlign: 'center' }}>
                No transactions yet. Tap the + button to add one!
              </Text>
            </View>
          ) : (
            transactions.map((transaction) => (
              <TouchableOpacity
                key={transaction.id}
                style={{ 
                  backgroundColor: '#fff', 
                  borderRadius: 12, 
                  padding: 16,
                  marginBottom: 8,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1
                }}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#1e293b' }}>
                    {transaction.description}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>
                      {transaction.account_name}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#cbd5e1', marginHorizontal: 6 }}>•</Text>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>
                      {formatDate(transaction.date)}
                    </Text>
                  </View>
                </View>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: '600',
                  color: transaction.type === 'income' ? '#10b981' : '#ef4444',
                  marginLeft: 12
                }}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Floating Action Buttons */}
        <View style={{ 
          position: 'absolute', 
          bottom: 100, 
          right: 20,
          gap: 12
        }}>
          <TouchableOpacity
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#2563eb',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
            onPress={() => setShowAddTransaction(true)}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 28, color: '#fff', fontWeight: 'bold' }}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Add Transaction Modal */}
        {showAddTransaction && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}>
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 400,
            }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#1e293b' }}>
                Add Transaction
              </Text>
              <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
                This feature is coming soon! For now, use the web version to add transactions with full functionality.
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#2563eb',
                  padding: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
                onPress={() => setShowAddTransaction(false)}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
