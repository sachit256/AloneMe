import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { supabase } from '../lib/supabase';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { colors, typography, spacing } from '../styles/common';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';

const { width } = Dimensions.get('window');

type Transaction = {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  created_at: string;
};

const ZoneScreen = ({ navigation }: any) => {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const predefinedAmounts = [100, 200, 500, 1000, 2000, 5000];

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (walletError) throw walletError;
      setBalance(walletData?.balance || 0);

      // Fetch transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (transactionError) throw transactionError;
      setTransactions(transactionData || []);

    } catch (error: any) {
      console.error('Error fetching wallet data:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load wallet data'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoney = async () => {
    if (!selectedAmount) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select an amount'
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Razorpay payment options
      const options = {
        description: 'Wallet Recharge',
        image: 'https://your-logo-url.com/logo.png',
        currency: 'INR',
        key: 'rzp_test_xrUmUMgnMD4lxo', // Replace with your Razorpay key
        amount: selectedAmount * 100, // Amount in paise
        name: 'AloneMe',
        prefill: {
          email: user.email || '',
          contact: '', // Add user's phone if available
          name: user.user_metadata?.name || 'User'
        },
        theme: { color: '#00BFA6' }
      };

      RazorpayCheckout.open(options)
        .then(async (data: any) => {
          // Payment Success
          // Insert transaction in Supabase
          const { error } = await supabase
            .from('transactions')
            .insert({
              user_id: user.id,
              amount: selectedAmount,
              type: 'credit',
              description: 'Wallet recharge via Razorpay',
              razorpay_payment_id: data.razorpay_payment_id
            });
          if (error) throw error;
          // Update wallet balance
          const { error: updateError } = await supabase
            .from('wallets')
            .update({ balance: balance + selectedAmount })
            .eq('user_id', user.id);
          if (updateError) throw updateError;
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Money added successfully'
          });
          fetchWalletData();
          setSelectedAmount(null);
        })
        .catch((error: any) => {
          // Payment failed or cancelled
          Toast.show({
            type: 'error',
            text1: 'Payment Cancelled',
            text2: error?.description || 'Payment was not completed'
          });
        });
    } catch (error) {
      console.error('Error adding money:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add money'
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00BFA6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Zone</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Coins</Text>
          <Text style={styles.balanceAmount}>{balance.toFixed(0)} Coins</Text>
        </View>

        <View style={styles.addMoneySection}>
          <Text style={styles.sectionTitle}>Add Coins</Text>
          <View style={styles.amountGrid}>
            {predefinedAmounts.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.amountButton,
                  selectedAmount === amount && styles.amountButtonSelected
                ]}
                onPress={() => setSelectedAmount(amount)}
              >
                <Text style={[
                  styles.amountButtonText,
                  selectedAmount === amount && styles.amountButtonTextSelected
                ]}>{amount} Coins</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.addMoneyButton, !selectedAmount && styles.addMoneyButtonDisabled]}
            onPress={handleAddMoney}
            disabled={!selectedAmount}
          >
            <Text style={styles.addMoneyButtonText}>Add Coins</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {transactions.length === 0 ? (
            <Text style={styles.emptyStateText}>No transactions yet</Text>
          ) : (
            transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  transaction.type === 'credit' ? styles.creditAmount : styles.debitAmount
                ]}>
                  {transaction.type === 'credit' ? '+' : '-'}{transaction.amount.toFixed(0)} Coins
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  balanceCard: {
    backgroundColor: '#1E1E1E',
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 15,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#888',
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00BFA6',
  },
  addMoneySection: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: spacing.md,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  amountButton: {
    width: (width - spacing.md * 4) / 3,
    padding: spacing.md,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    alignItems: 'center',
  },
  amountButtonSelected: {
    backgroundColor: '#00BFA6',
  },
  amountButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  amountButtonTextSelected: {
    color: '#FFFFFF',
  },
  addMoneyButton: {
    backgroundColor: '#00BFA6',
    padding: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  addMoneyButtonDisabled: {
    backgroundColor: '#2A2A2A',
  },
  addMoneyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  transactionsSection: {
    padding: spacing.md,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.sm,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  transactionDate: {
    fontSize: 14,
    color: '#888',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  creditAmount: {
    color: '#00BFA6',
  },
  debitAmount: {
    color: '#FF5252',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

export default ZoneScreen; 