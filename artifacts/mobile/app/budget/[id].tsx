import React, { useState } from 'react';
import {
  Alert, Platform, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useBudget, CATEGORY_COLORS } from '@/context/BudgetContext';
import { CATEGORY_ICONS } from '@/components/budget/TransactionItem';

export default function TransactionDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTransaction, deleteTransaction } = useBudget();

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const tx = getTransaction(id);

  if (!tx) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Feather name="alert-circle" size={48} color={colors.mutedForeground} />
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Transaction not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtnLarge, { backgroundColor: colors.muted }]}>
          <Text style={[{ color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isIncome = tx.type === 'income';
  const catColor = CATEGORY_COLORS[tx.category] || colors.budget;
  const icon = CATEGORY_ICONS[tx.category] || 'circle';
  const accentColor = isIncome ? colors.notes : colors.destructive;

  const txDate = new Date(tx.date);
  const createdDate = new Date(tx.createdAt);

  const handleDelete = () => {
    Alert.alert('Delete transaction?', `"${tx.title}" will be permanently removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          deleteTransaction(tx.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          router.back();
        }
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad > 20 ? topPad : 16, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Transaction</Text>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/budget/new', params: { id: tx.id } })}
          style={styles.headerBtn}
        >
          <Feather name="edit-2" size={18} color={colors.budget} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero amount card */}
        <View style={[styles.heroCard, { backgroundColor: `${accentColor}12` }]}>
          <View style={[styles.heroIcon, { backgroundColor: `${catColor}20` }]}>
            <Feather name={icon as any} size={28} color={catColor} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>{tx.title}</Text>
          <Text style={[styles.heroAmount, { color: accentColor }]}>
            {isIncome ? '+' : '-'}${tx.amount.toLocaleString('en', { minimumFractionDigits: tx.amount % 1 !== 0 ? 2 : 0 })}
          </Text>
          <View style={styles.heroBadges}>
            <View style={[styles.typeBadge, { backgroundColor: `${accentColor}20` }]}>
              <Feather name={isIncome ? 'arrow-down-left' : 'arrow-up-right'} size={12} color={accentColor} />
              <Text style={[styles.typeBadgeText, { color: accentColor }]}>
                {isIncome ? 'Income' : 'Expense'}
              </Text>
            </View>
            <View style={[styles.catBadge, { backgroundColor: `${catColor}18` }]}>
              <Feather name={icon as any} size={11} color={catColor} />
              <Text style={[styles.catBadgeText, { color: catColor }]}>{tx.category}</Text>
            </View>
            {tx.recurring && (
              <View style={[styles.recurringBadge, { backgroundColor: `${colors.primary}15` }]}>
                <Feather name="repeat" size={11} color={colors.primary} />
                <Text style={[styles.recurringText, { color: colors.primary }]}>Recurring</Text>
              </View>
            )}
          </View>
        </View>

        {/* Details card */}
        <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <DetailRow
            icon="calendar"
            label="Date"
            value={txDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          />
          <DetailRow icon="tag" label="Category" value={tx.category} isLast={!tx.notes} />
          {tx.notes ? (
            <DetailRow icon="file-text" label="Notes" value={tx.notes} isLast />
          ) : null}
        </View>

        {/* Created at */}
        <Text style={[styles.createdAt, { color: colors.mutedForeground }]}>
          Added {createdDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/budget/new', params: { id: tx.id } })}
            style={[styles.editBtn, { backgroundColor: `${colors.budget}15`, borderColor: `${colors.budget}30` }]}
          >
            <Feather name="edit-2" size={16} color={colors.budget} />
            <Text style={[styles.editBtnText, { color: colors.budget }]}>Edit transaction</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={[styles.deleteBtn, { backgroundColor: `${colors.destructive}12`, borderColor: `${colors.destructive}25` }]}>
            <Feather name="trash-2" size={16} color={colors.destructive} />
            <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value, isLast }: { icon: string; label: string; value: string; isLast?: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.detailRow, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
      <Feather name={icon as any} size={16} color={colors.mutedForeground} />
      <View style={styles.detailContent}>
        <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },

  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  heroCard: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16 },
  heroIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  heroTitle: { fontSize: 20, fontFamily: 'Inter_600SemiBold', marginBottom: 8, textAlign: 'center' },
  heroAmount: { fontSize: 44, fontFamily: 'Inter_700Bold', letterSpacing: -2, marginBottom: 16 },
  heroBadges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  typeBadgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  catBadgeText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  recurringBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  recurringText: { fontSize: 12, fontFamily: 'Inter_500Medium' },

  detailsCard: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 },
  detailValue: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22 },

  createdAt: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', marginBottom: 24 },

  actions: { gap: 10 },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 14, borderWidth: 1 },
  editBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 14, borderWidth: 1 },
  deleteBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },

  notFound: { fontSize: 16, fontFamily: 'Inter_500Medium', marginTop: 12, marginBottom: 24 },
  backBtnLarge: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
});
