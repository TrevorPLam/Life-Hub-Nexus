import React, { useState, useMemo, useCallback } from 'react';
import {
  Alert, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useBudget, CATEGORY_COLORS, EXPENSE_CATEGORIES } from '@/context/BudgetContext';
import { TransactionItem, CATEGORY_ICONS } from '@/components/budget/TransactionItem';

type Tab = 'overview' | 'transactions' | 'budgets';
type TxFilter = 'all' | 'income' | 'expense';

const fmt = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n.toFixed(0)}`;

const fmtFull = (n: number) =>
  `$${n.toLocaleString('en', { minimumFractionDigits: n % 1 !== 0 ? 2 : 0 })}`;

function groupByDate(txs: ReturnType<typeof useBudget>['transactions']) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;

  const groups: { label: string; key: string; txs: typeof txs }[] = [];
  const seen = new Map<string, typeof txs>();

  [...txs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .forEach(tx => {
      const d = new Date(tx.date);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      let label: string;
      if (dayStart === today) label = 'Today';
      else if (dayStart === yesterday) label = 'Yesterday';
      else label = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
      const key = String(dayStart);
      if (!seen.has(key)) { seen.set(key, []); groups.push({ label, key, txs: seen.get(key)! }); }
      seen.get(key)!.push(tx);
    });
  return groups;
}

// ─── Progress Ring (pure RN) ──────────────────────────────────────────────────
function ProgressRing({ pct, color, size = 52 }: { pct: number; color: string; size?: number }) {
  const colors = useColors();
  const stroke = 6;
  const r = (size - stroke) / 2;
  const safeR = Math.max(r, 1);
  const circumference = 2 * Math.PI * safeR;
  const filled = Math.min(pct / 100, 1) * circumference;

  // Pure-RN ring using two clipped semicircles
  const half = size / 2;
  const deg = Math.min(pct / 100, 1) * 360;
  const overHalf = deg > 180;

  // We use a simple thick-border circle + overlay approach
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: stroke, borderColor: `${color}25`, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      {/* Background fill for >50% */}
      {overHalf && (
        <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: stroke, borderColor: color }} />
      )}
      {/* Left half clip */}
      <View style={{ position: 'absolute', left: 0, top: 0, width: half, height: size, overflow: 'hidden' }}>
        <View style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: stroke, borderColor: overHalf ? color : (deg > 0 ? 'transparent' : 'transparent'),
        }} />
      </View>
      {/* Right half — rotated */}
      <View style={{ position: 'absolute', right: 0, top: 0, width: half, height: size, overflow: 'hidden' }}>
        <View style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: stroke, borderColor: deg > 0 ? color : 'transparent',
          transform: [{ rotate: `${Math.min(deg, 180) - 180}deg` }],
        }} />
      </View>
      <View style={{ width: size - stroke * 3, height: size - stroke * 3, borderRadius: (size - stroke * 3) / 2, backgroundColor: colors.card }} />
    </View>
  );
}

// ─── Budget Card ──────────────────────────────────────────────────────────────
function BudgetCard({
  item, onEdit, onDelete,
}: {
  item: { budget: { id: string; category: string; monthlyLimit: number }; spent: number; pct: number; overBudget: boolean };
  onEdit: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const color = CATEGORY_COLORS[item.budget.category] || colors.budget;
  const icon = CATEGORY_ICONS[item.budget.category] || 'circle';
  const remaining = item.budget.monthlyLimit - item.spent;

  return (
    <View style={[styles.budgetCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.budgetCardTop}>
        <View style={[styles.budgetIcon, { backgroundColor: `${color}18` }]}>
          <Feather name={icon as any} size={17} color={color} />
        </View>
        <View style={styles.budgetCardInfo}>
          <Text style={[styles.budgetCat, { color: colors.foreground }]}>{item.budget.category}</Text>
          <Text style={[styles.budgetSub, { color: colors.mutedForeground }]}>
            {fmtFull(item.spent)} of {fmtFull(item.budget.monthlyLimit)}
          </Text>
        </View>
        <View style={styles.budgetCardActions}>
          <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="edit-2" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="trash-2" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bar */}
      <View style={[styles.budgetBar, { backgroundColor: `${color}18` }]}>
        <View style={[styles.budgetBarFill, {
          width: `${item.pct}%`,
          backgroundColor: item.overBudget ? colors.destructive : color,
        }]} />
      </View>

      <View style={styles.budgetCardBottom}>
        <Text style={[styles.budgetPct, { color: item.overBudget ? colors.destructive : color }]}>
          {Math.round(item.pct)}% used
        </Text>
        {item.overBudget ? (
          <Text style={[styles.budgetRemaining, { color: colors.destructive }]}>
            {fmtFull(Math.abs(remaining))} over
          </Text>
        ) : (
          <Text style={[styles.budgetRemaining, { color: colors.mutedForeground }]}>
            {fmtFull(remaining)} left
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Add Budget Modal ─────────────────────────────────────────────────────────
function AddBudgetSheet({
  editing, onClose,
}: {
  editing: { id?: string; category?: string; monthlyLimit?: number } | null;
  onClose: () => void;
}) {
  const colors = useColors();
  const { addBudget, updateBudget, budgets } = useBudget();
  const usedCategories = budgets.map(b => b.category);

  const [category, setCategory] = useState(editing?.category || '');
  const [limit, setLimit] = useState(editing?.monthlyLimit ? String(editing.monthlyLimit) : '');

  const availableCategories = EXPENSE_CATEGORIES.filter(
    c => !usedCategories.includes(c) || c === editing?.category
  );

  const handleSave = () => {
    const lim = parseFloat(limit);
    if (!category || !limit || isNaN(lim) || lim <= 0) return;
    if (editing?.id) {
      updateBudget(editing.id, { category, monthlyLimit: lim });
    } else {
      addBudget({ category, monthlyLimit: lim });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.sheetHandle} />
      <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
        {editing?.id ? 'Edit Budget' : 'Add Budget Limit'}
      </Text>

      <Text style={[styles.sheetLabel, { color: colors.mutedForeground }]}>Category</Text>
      <View style={styles.sheetCategoryGrid}>
        {availableCategories.map(cat => {
          const color = CATEGORY_COLORS[cat] || colors.budget;
          const selected = category === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.sheetCatBtn, {
                backgroundColor: selected ? `${color}20` : colors.muted,
                borderWidth: 1, borderColor: selected ? color : 'transparent',
              }]}
            >
              <Feather name={(CATEGORY_ICONS[cat] || 'circle') as any} size={13} color={selected ? color : colors.mutedForeground} />
              <Text style={[styles.sheetCatText, { color: selected ? color : colors.mutedForeground }]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sheetLabel, { color: colors.mutedForeground }]}>Monthly limit</Text>
      <View style={[styles.sheetAmountRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Text style={[styles.sheetCurrency, { color: colors.foreground }]}>$</Text>
        <TextInput
          style={[styles.sheetAmountInput, { color: colors.foreground }]}
          placeholder="0"
          placeholderTextColor={colors.mutedForeground}
          value={limit}
          onChangeText={setLimit}
          keyboardType="decimal-pad"
        />
        <Text style={[styles.sheetPer, { color: colors.mutedForeground }]}>/mo</Text>
      </View>

      <View style={styles.sheetBtns}>
        <TouchableOpacity onPress={onClose} style={[styles.sheetCancelBtn, { borderColor: colors.border }]}>
          <Text style={[styles.sheetCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.sheetSaveBtn, { backgroundColor: category && limit ? colors.budget : colors.muted }]}
        >
          <Text style={[styles.sheetSaveText, { color: category && limit ? '#fff' : colors.mutedForeground }]}>
            {editing?.id ? 'Update' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BudgetScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const budget = useBudget();
  const {
    getMonthTransactions, getMonthlyIncome, getMonthlyExpenses, getMonthlyBalance,
    getTransactionsByCategory, getBudgetsWithProgress, getSpendingTrend,
    deleteTransaction, deleteBudget,
  } = budget;

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  // Month navigation
  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const currentMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + monthOffset, 1),
    [monthOffset]
  );
  const isCurrentMonth = monthOffset === 0;
  const monthLabel = currentMonth.toLocaleDateString([], { month: 'long', year: 'numeric' });

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [txFilter, setTxFilter] = useState<TxFilter>('all');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [editingBudget, setEditingBudget] = useState<{ id?: string; category?: string; monthlyLimit?: number } | null>(null);

  // Data
  const income = getMonthlyIncome(currentMonth);
  const expenses = getMonthlyExpenses(currentMonth);
  const balance = getMonthlyBalance(currentMonth);
  const savingsRate = income > 0 ? Math.max(0, Math.round((balance / income) * 100)) : 0;
  const byCategory = getTransactionsByCategory(currentMonth);
  const totalExpenses = expenses;
  const topCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const budgetsWithProgress = getBudgetsWithProgress(currentMonth);
  const monthTxs = getMonthTransactions(currentMonth);
  const trend = getSpendingTrend();

  // Filtered transactions
  const filteredTxs = useMemo(() => {
    let txs = monthTxs;
    if (txFilter !== 'all') txs = txs.filter(t => t.type === txFilter);
    if (catFilter) txs = txs.filter(t => t.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      txs = txs.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q)
      );
    }
    return txs;
  }, [monthTxs, txFilter, catFilter, search]);

  const groups = useMemo(() => groupByDate(filteredTxs), [filteredTxs]);

  const maxTrend = Math.max(...trend.map(t => Math.max(t.income, t.expenses)), 1);

  const handleDeleteTx = useCallback((id: string, title: string) => {
    Alert.alert('Delete transaction?', `"${title}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          deleteTransaction(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      },
    ]);
  }, [deleteTransaction]);

  const handleDeleteBudget = useCallback((id: string, cat: string) => {
    Alert.alert('Remove budget?', `Remove the ${cat} budget limit?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteBudget(id) },
    ]);
  }, [deleteBudget]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Budget</Text>
          <TouchableOpacity
            onPress={() => router.push('/budget/new')}
            style={[styles.addBtn, { backgroundColor: colors.budget }]}
          >
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Month navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => setMonthOffset(o => o - 1)} style={styles.monthNavBtn}>
            <Feather name="chevron-left" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: colors.foreground }]}>{monthLabel}</Text>
          <TouchableOpacity
            onPress={() => !isCurrentMonth && setMonthOffset(o => o + 1)}
            style={styles.monthNavBtn}
          >
            <Feather name="chevron-right" size={20} color={isCurrentMonth ? colors.border : colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabBar, { backgroundColor: colors.muted }]}>
          {(['overview', 'transactions', 'budgets'] as Tab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabBtn, activeTab === tab && { backgroundColor: colors.card }]}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? colors.foreground : colors.mutedForeground }]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Budget add/edit sheet overlay */}
      {editingBudget !== null && (
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} onPress={() => setEditingBudget(null)} />
          <AddBudgetSheet editing={editingBudget} onClose={() => setEditingBudget(null)} />
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ════════ OVERVIEW TAB ════════ */}
        {activeTab === 'overview' && (
          <>
            {/* Hero balance card */}
            <View style={[styles.heroCard, { backgroundColor: balance >= 0 ? `${colors.budget}14` : `${colors.destructive}10` }]}>
              <Text style={[styles.heroLabel, { color: colors.mutedForeground }]}>Net balance</Text>
              <Text style={[styles.heroBalance, { color: balance >= 0 ? colors.budget : colors.destructive }]}>
                {balance >= 0 ? '+' : '-'}{fmtFull(Math.abs(balance))}
              </Text>
              {income > 0 && (
                <Text style={[styles.heroSavings, { color: colors.mutedForeground }]}>
                  {savingsRate}% savings rate
                </Text>
              )}

              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <View style={[styles.heroStatDot, { backgroundColor: `${colors.notes}25` }]}>
                    <Feather name="arrow-down-left" size={14} color={colors.notes} />
                  </View>
                  <View>
                    <Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>Income</Text>
                    <Text style={[styles.heroStatVal, { color: colors.notes }]}>{fmtFull(income)}</Text>
                  </View>
                </View>
                <View style={[styles.heroStatDivider, { backgroundColor: `${colors.budget}30` }]} />
                <View style={styles.heroStat}>
                  <View style={[styles.heroStatDot, { backgroundColor: `${colors.destructive}18` }]}>
                    <Feather name="arrow-up-right" size={14} color={colors.destructive} />
                  </View>
                  <View>
                    <Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>Expenses</Text>
                    <Text style={[styles.heroStatVal, { color: colors.destructive }]}>{fmtFull(expenses)}</Text>
                  </View>
                </View>
              </View>

              {income > 0 && (
                <View style={[styles.heroBar, { backgroundColor: `${colors.budget}25` }]}>
                  <View style={[styles.heroBarFill, {
                    width: `${Math.min(100, (expenses / income) * 100)}%`,
                    backgroundColor: expenses > income ? colors.destructive : colors.budget,
                  }]} />
                </View>
              )}
            </View>

            {/* Budget alerts */}
            {budgetsWithProgress.filter(b => b.overBudget).length > 0 && (
              <View style={[styles.alertBanner, { backgroundColor: `${colors.destructive}10`, borderColor: `${colors.destructive}25` }]}>
                <Feather name="alert-circle" size={15} color={colors.destructive} />
                <Text style={[styles.alertText, { color: colors.destructive }]}>
                  {budgetsWithProgress.filter(b => b.overBudget).map(b => b.budget.category).join(', ')} over budget
                </Text>
              </View>
            )}

            {/* Category breakdown */}
            {topCategories.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Spending breakdown</Text>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {topCategories.map(([cat, amt], i) => {
                    const pct = totalExpenses > 0 ? (amt / totalExpenses) * 100 : 0;
                    const color = CATEGORY_COLORS[cat] || colors.budget;
                    const icon = CATEGORY_ICONS[cat] || 'circle';
                    const budgetForCat = budgetsWithProgress.find(b => b.budget.category === cat);
                    return (
                      <View key={cat} style={[styles.catRow, i < topCategories.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                        <View style={[styles.catIconSmall, { backgroundColor: `${color}18` }]}>
                          <Feather name={icon as any} size={13} color={color} />
                        </View>
                        <View style={styles.catInfo}>
                          <View style={styles.catInfoTop}>
                            <Text style={[styles.catName, { color: colors.foreground }]}>{cat}</Text>
                            <Text style={[styles.catAmt, { color: colors.foreground }]}>{fmtFull(amt)}</Text>
                          </View>
                          <View style={[styles.catBar, { backgroundColor: colors.muted }]}>
                            <View style={[styles.catBarFill, { width: `${pct}%`, backgroundColor: color }]} />
                          </View>
                          <View style={styles.catInfoBottom}>
                            <Text style={[styles.catPct, { color: colors.mutedForeground }]}>{Math.round(pct)}% of spend</Text>
                            {budgetForCat && (
                              <Text style={[styles.catBudgetHint, {
                                color: budgetForCat.overBudget ? colors.destructive : colors.mutedForeground,
                              }]}>
                                {fmtFull(budgetForCat.budget.monthlyLimit)} budget
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 6-month trend */}
            {trend.some(t => t.income > 0 || t.expenses > 0) && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>6-month trend</Text>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 16 }]}>
                  <View style={styles.trendLegend}>
                    <View style={styles.trendLegendItem}>
                      <View style={[styles.trendDot, { backgroundColor: colors.notes }]} />
                      <Text style={[styles.trendLegendText, { color: colors.mutedForeground }]}>Income</Text>
                    </View>
                    <View style={styles.trendLegendItem}>
                      <View style={[styles.trendDot, { backgroundColor: colors.destructive }]} />
                      <Text style={[styles.trendLegendText, { color: colors.mutedForeground }]}>Expenses</Text>
                    </View>
                  </View>
                  <View style={styles.trendChart}>
                    {trend.map((t, i) => (
                      <View key={i} style={styles.trendCol}>
                        <View style={styles.trendBars}>
                          <View style={[styles.trendBar, {
                            height: `${(t.income / maxTrend) * 100}%`,
                            backgroundColor: `${colors.notes}90`,
                          }]} />
                          <View style={[styles.trendBar, {
                            height: `${(t.expenses / maxTrend) * 100}%`,
                            backgroundColor: `${colors.destructive}90`,
                          }]} />
                        </View>
                        <Text style={[styles.trendMonth, { color: colors.mutedForeground }]}>{t.month}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Recent transactions */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent</Text>
                <TouchableOpacity onPress={() => setActiveTab('transactions')}>
                  <Text style={[styles.seeAll, { color: colors.budget }]}>See all</Text>
                </TouchableOpacity>
              </View>
              {monthTxs.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="inbox" size={28} color={colors.mutedForeground} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No transactions this month</Text>
                  <TouchableOpacity onPress={() => router.push('/budget/new')} style={[styles.emptyBtn, { backgroundColor: colors.budget }]}>
                    <Text style={styles.emptyBtnText}>Add one</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {monthTxs
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5)
                    .map(tx => (
                      <TransactionItem
                        key={tx.id}
                        transaction={tx}
                        onPress={() => router.push(`/budget/${tx.id}`)}
                      />
                    ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* ════════ TRANSACTIONS TAB ════════ */}
        {activeTab === 'transactions' && (
          <>
            {/* Search + filters */}
            <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="search" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholder="Search transactions…"
                placeholderTextColor={colors.mutedForeground}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Feather name="x" size={15} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>

            {/* Type filter */}
            <View style={styles.filterRow}>
              {(['all', 'income', 'expense'] as TxFilter[]).map(f => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setTxFilter(f)}
                  style={[styles.filterChip, {
                    backgroundColor: txFilter === f
                      ? (f === 'income' ? `${colors.notes}20` : f === 'expense' ? `${colors.destructive}15` : colors.card)
                      : colors.muted,
                    borderWidth: 1,
                    borderColor: txFilter === f
                      ? (f === 'income' ? `${colors.notes}40` : f === 'expense' ? `${colors.destructive}30` : colors.border)
                      : 'transparent',
                  }]}
                >
                  <Text style={[styles.filterChipText, {
                    color: txFilter === f
                      ? (f === 'income' ? colors.notes : f === 'expense' ? colors.destructive : colors.foreground)
                      : colors.mutedForeground,
                  }]}>
                    {f === 'all' ? 'All' : f === 'income' ? '↙ Income' : '↗ Expense'}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Category filter */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catFilterScroll}>
                {Object.keys(byCategory).map(cat => {
                  const color = CATEGORY_COLORS[cat] || colors.budget;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCatFilter(catFilter === cat ? '' : cat)}
                      style={[styles.filterChip, {
                        backgroundColor: catFilter === cat ? `${color}20` : colors.muted,
                        borderWidth: 1,
                        borderColor: catFilter === cat ? color : 'transparent',
                        marginRight: 6,
                      }]}
                    >
                      <Text style={[styles.filterChipText, { color: catFilter === cat ? color : colors.mutedForeground }]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Summary strip */}
            <View style={[styles.txSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.txSummaryCount, { color: colors.mutedForeground }]}>{filteredTxs.length} transactions</Text>
              <View style={styles.txSummaryRight}>
                <Text style={[styles.txSummaryIn, { color: colors.notes }]}>
                  +{fmtFull(filteredTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))}
                </Text>
                <Text style={[styles.txSummaryDivider, { color: colors.mutedForeground }]}>·</Text>
                <Text style={[styles.txSummaryOut, { color: colors.destructive }]}>
                  -{fmtFull(filteredTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))}
                </Text>
              </View>
            </View>

            {groups.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="search" size={28} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No transactions found</Text>
              </View>
            ) : (
              groups.map(group => (
                <View key={group.key} style={styles.group}>
                  <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>{group.label}</Text>
                  <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {group.txs.map(tx => (
                      <TransactionItem
                        key={tx.id}
                        transaction={tx}
                        showDate={false}
                        onPress={() => router.push(`/budget/${tx.id}`)}
                      />
                    ))}
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* ════════ BUDGETS TAB ════════ */}
        {activeTab === 'budgets' && (
          <>
            {/* Budget summary */}
            {budgetsWithProgress.length > 0 && (
              <View style={[styles.budgetSummaryRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.budgetSummaryItem}>
                  <Text style={[styles.budgetSummaryNum, { color: colors.foreground }]}>{budgetsWithProgress.length}</Text>
                  <Text style={[styles.budgetSummaryLabel, { color: colors.mutedForeground }]}>Budgets</Text>
                </View>
                <View style={[styles.budgetSummaryDivider, { backgroundColor: colors.border }]} />
                <View style={styles.budgetSummaryItem}>
                  <Text style={[styles.budgetSummaryNum, { color: colors.budget }]}>
                    {fmtFull(budgetsWithProgress.reduce((s, b) => s + b.budget.monthlyLimit, 0))}
                  </Text>
                  <Text style={[styles.budgetSummaryLabel, { color: colors.mutedForeground }]}>Total limits</Text>
                </View>
                <View style={[styles.budgetSummaryDivider, { backgroundColor: colors.border }]} />
                <View style={styles.budgetSummaryItem}>
                  <Text style={[styles.budgetSummaryNum, { color: budgetsWithProgress.some(b => b.overBudget) ? colors.destructive : colors.notes }]}>
                    {budgetsWithProgress.filter(b => b.overBudget).length === 0 ? 'On track' : `${budgetsWithProgress.filter(b => b.overBudget).length} over`}
                  </Text>
                  <Text style={[styles.budgetSummaryLabel, { color: colors.mutedForeground }]}>Status</Text>
                </View>
              </View>
            )}

            {budgetsWithProgress.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border, paddingVertical: 40 }]}>
                <Feather name="target" size={36} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No budgets yet</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground, textAlign: 'center', marginBottom: 20 }]}>
                  Set monthly limits per category to track your spending goals
                </Text>
                <TouchableOpacity
                  onPress={() => setEditingBudget({})}
                  style={[styles.emptyBtn, { backgroundColor: colors.budget }]}
                >
                  <Text style={styles.emptyBtnText}>Add first budget</Text>
                </TouchableOpacity>
              </View>
            ) : (
              budgetsWithProgress.map(item => (
                <BudgetCard
                  key={item.budget.id}
                  item={item}
                  onEdit={() => setEditingBudget({ id: item.budget.id, category: item.budget.category, monthlyLimit: item.budget.monthlyLimit })}
                  onDelete={() => handleDeleteBudget(item.budget.id, item.budget.category)}
                />
              ))
            )}

            {budgetsWithProgress.length > 0 && (
              <TouchableOpacity
                onPress={() => setEditingBudget({})}
                style={[styles.addBudgetBtn, { borderColor: colors.budget, backgroundColor: `${colors.budget}10` }]}
              >
                <Feather name="plus" size={16} color={colors.budget} />
                <Text style={[styles.addBudgetBtnText, { color: colors.budget }]}>Add budget limit</Text>
              </TouchableOpacity>
            )}

            {/* Unbudgeted categories */}
            {Object.keys(byCategory).filter(cat => !budgetsWithProgress.some(b => b.budget.category === cat)).length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Spending without a budget</Text>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {Object.entries(byCategory)
                    .filter(([cat]) => !budgetsWithProgress.some(b => b.budget.category === cat))
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, amt], i, arr) => {
                      const color = CATEGORY_COLORS[cat] || colors.budget;
                      const icon = CATEGORY_ICONS[cat] || 'circle';
                      return (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => setEditingBudget({ category: cat })}
                          style={[styles.unbudgetedRow, i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                        >
                          <View style={[styles.catIconSmall, { backgroundColor: `${color}18` }]}>
                            <Feather name={icon as any} size={13} color={color} />
                          </View>
                          <Text style={[styles.catName, { color: colors.foreground, flex: 1 }]}>{cat}</Text>
                          <Text style={[styles.catAmt, { color: colors.mutedForeground }]}>{fmtFull(amt)}</Text>
                          <Feather name="plus-circle" size={16} color={colors.budget} style={{ marginLeft: 10 }} />
                        </TouchableOpacity>
                      );
                    })}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 0, borderBottomWidth: StyleSheet.hairlineWidth },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backBtn: {},
  headerTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },

  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 },
  monthNavBtn: { padding: 4 },
  monthLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', minWidth: 140, textAlign: 'center' },

  tabBar: { flexDirection: 'row', borderRadius: 12, padding: 3, marginBottom: 1 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 0 },

  heroCard: { borderRadius: 16, padding: 20, marginBottom: 12 },
  heroLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 4 },
  heroBalance: { fontSize: 38, fontFamily: 'Inter_700Bold', letterSpacing: -1, marginBottom: 2 },
  heroSavings: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 16 },
  heroStats: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  heroStat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroStatDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  heroStatLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  heroStatVal: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  heroStatDivider: { width: 1, height: 36, marginHorizontal: 12 },
  heroBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  heroBarFill: { height: '100%', borderRadius: 3 },

  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 12 },
  alertText: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1 },

  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 10 },
  seeAll: { fontSize: 13, fontFamily: 'Inter_500Medium' },

  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  catRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  catIconSmall: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  catInfo: { flex: 1 },
  catInfoTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  catInfoBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  catName: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  catAmt: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  catBar: { height: 5, borderRadius: 3, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 3 },
  catPct: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  catBudgetHint: { fontSize: 11, fontFamily: 'Inter_400Regular' },

  trendLegend: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  trendLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trendDot: { width: 8, height: 8, borderRadius: 4 },
  trendLegendText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  trendChart: { flexDirection: 'row', height: 80, alignItems: 'flex-end', gap: 4 },
  trendCol: { flex: 1, alignItems: 'center', gap: 6 },
  trendBars: { flex: 1, flexDirection: 'row', gap: 2, alignItems: 'flex-end', width: '100%' },
  trendBar: { flex: 1, borderRadius: 3, minHeight: 2 },
  trendMonth: { fontSize: 10, fontFamily: 'Inter_400Regular' },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', padding: 0 },

  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  filterChipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  catFilterScroll: { flexGrow: 0 },

  txSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, marginBottom: 12 },
  txSummaryCount: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  txSummaryRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  txSummaryIn: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  txSummaryDivider: { fontSize: 12 },
  txSummaryOut: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  group: { marginBottom: 14 },
  groupLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },

  budgetSummaryRow: { flexDirection: 'row', borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, marginBottom: 14, overflow: 'hidden' },
  budgetSummaryItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  budgetSummaryNum: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  budgetSummaryLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  budgetSummaryDivider: { width: StyleSheet.hairlineWidth },

  budgetCard: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 16, marginBottom: 10 },
  budgetCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  budgetIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  budgetCardInfo: { flex: 1 },
  budgetCat: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  budgetSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  budgetCardActions: { flexDirection: 'row', gap: 14 },
  budgetBar: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  budgetBarFill: { height: '100%', borderRadius: 4 },
  budgetCardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetPct: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  budgetRemaining: { fontSize: 12, fontFamily: 'Inter_400Regular' },

  unbudgetedRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },

  addBudgetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', marginBottom: 16 },
  addBudgetBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  emptyCard: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 32, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#888' },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 14 },

  sheetOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 20, paddingBottom: 40 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#333333', alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  sheetLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  sheetCategoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  sheetCatBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  sheetCatText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  sheetAmountRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20 },
  sheetCurrency: { fontSize: 20, fontFamily: 'Inter_400Regular', marginRight: 4 },
  sheetAmountInput: { flex: 1, fontSize: 28, fontFamily: 'Inter_700Bold', padding: 0 },
  sheetPer: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  sheetBtns: { flexDirection: 'row', gap: 10 },
  sheetCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  sheetCancelText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  sheetSaveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  sheetSaveText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
