import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useBudget } from '@/context/BudgetContext';
import { TransactionItem } from '@/components/budget/TransactionItem';

export default function BudgetScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getMonthlyIncome, getMonthlyExpenses, getMonthlyBalance, getRecentTransactions, getTransactionsByCategory } = useBudget();

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const income = getMonthlyIncome();
  const expenses = getMonthlyExpenses();
  const balance = getMonthlyBalance();
  const recent = getRecentTransactions(20);
  const byCategory = getTransactionsByCategory();
  const topCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const savingsRate = income > 0 ? Math.max(0, Math.round((balance / income) * 100)) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Budget</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/budget/new')} style={[styles.addBtn, { backgroundColor: colors.budget }]}>
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === 'web' ? 80 : 100 }]}>

        {/* Balance card */}
        <View style={[styles.balanceCard, { backgroundColor: balance >= 0 ? `${colors.budget}18` : `${colors.destructive}12` }]}>
          <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>This month</Text>
          <Text style={[styles.balance, { color: balance >= 0 ? colors.budget : colors.destructive }]}>
            {balance >= 0 ? '+' : '-'}${Math.abs(balance).toLocaleString()}
          </Text>
          <Text style={[styles.balanceSub, { color: colors.mutedForeground }]}>
            {savingsRate}% savings rate
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Income</Text>
              <Text style={[styles.statAmount, { color: colors.budget }]}>+${income.toLocaleString()}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Expenses</Text>
              <Text style={[styles.statAmount, { color: colors.foreground }]}>-${expenses.toLocaleString()}</Text>
            </View>
          </View>

          {/* Progress bar */}
          {income > 0 && (
            <View style={[styles.progressBar, { backgroundColor: `${colors.budget}25` }]}>
              <View style={[styles.progressFill, { width: `${Math.min(100, (expenses / income) * 100)}%`, backgroundColor: expenses > income ? colors.destructive : colors.budget }]} />
            </View>
          )}
        </View>

        {/* Top spending categories */}
        {topCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Spending breakdown</Text>
            <View style={[styles.catCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {topCategories.map(([cat, amt]) => {
                const pct = expenses > 0 ? (amt / expenses) * 100 : 0;
                return (
                  <View key={cat} style={styles.catRow}>
                    <View style={styles.catInfo}>
                      <Text style={[styles.catName, { color: colors.foreground }]}>{cat}</Text>
                      <Text style={[styles.catAmt, { color: colors.mutedForeground }]}>${amt.toLocaleString()}</Text>
                    </View>
                    <View style={[styles.catBar, { backgroundColor: colors.muted }]}>
                      <View style={[styles.catBarFill, { width: `${pct}%`, backgroundColor: colors.budget }]} />
                    </View>
                    <Text style={[styles.catPct, { color: colors.mutedForeground }]}>{Math.round(pct)}%</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Recent transactions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent transactions</Text>
          <View style={[styles.txCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {recent.map(tx => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {},
  headerTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  balanceCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
  balanceLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 4 },
  balance: { fontSize: 40, fontFamily: 'Inter_700Bold', letterSpacing: -1, marginBottom: 2 },
  balanceSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 16 },
  statsRow: { flexDirection: 'row', marginBottom: 14 },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  statAmount: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  statDivider: { width: StyleSheet.hairlineWidth, marginHorizontal: 8 },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 10 },
  catCard: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  catInfo: { width: 90 },
  catName: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  catAmt: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  catBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 3 },
  catPct: { width: 36, fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'right' },
  txCard: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
});
