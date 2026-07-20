import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Transaction, CATEGORY_COLORS } from '@/context/BudgetContext';

export const CATEGORY_ICONS: Record<string, string> = {
  Food: 'coffee', Transport: 'map-pin', Entertainment: 'music',
  Shopping: 'shopping-bag', Health: 'heart', Bills: 'file-text',
  Travel: 'globe', Education: 'book', Personal: 'user', Other: 'circle',
  Salary: 'briefcase', Freelance: 'code', Investment: 'trending-up',
  Gift: 'gift', Bonus: 'star',
};

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
  showDate?: boolean;
}

export function TransactionItem({ transaction: tx, onPress, showDate = true }: TransactionItemProps) {
  const colors = useColors();
  const isIncome = tx.type === 'income';
  const icon = CATEGORY_ICONS[tx.category] || 'circle';
  const catColor = CATEGORY_COLORS[tx.category] || colors.budget;
  const dateStr = new Date(tx.date).toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.65 : 1}
      disabled={!onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${catColor}18` }]}>
        <Feather name={icon as any} size={16} color={catColor} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>{tx.title}</Text>
          {tx.recurring && (
            <View style={[styles.recurringBadge, { backgroundColor: `${colors.primary}15` }]}>
              <Feather name="repeat" size={9} color={colors.primary} />
            </View>
          )}
        </View>
        <View style={styles.meta}>
          <Text style={[styles.category, { color: colors.mutedForeground }]}>{tx.category}</Text>
          {showDate && (
            <>
              <Text style={[styles.dot, { color: colors.mutedForeground }]}>·</Text>
              <Text style={[styles.date, { color: colors.mutedForeground }]}>{dateStr}</Text>
            </>
          )}
          {tx.notes ? (
            <>
              <Text style={[styles.dot, { color: colors.mutedForeground }]}>·</Text>
              <Text style={[styles.notes, { color: colors.mutedForeground }]} numberOfLines={1}>{tx.notes}</Text>
            </>
          ) : null}
        </View>
      </View>
      <Text style={[styles.amount, { color: isIncome ? colors.notes : colors.foreground }]}>
        {isIncome ? '+' : '-'}${tx.amount.toLocaleString('en', { minimumFractionDigits: tx.amount % 1 !== 0 ? 2 : 0 })}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  content: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  title: { fontSize: 14, fontFamily: 'Inter_500Medium', flex: 1 },
  recurringBadge: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  category: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  dot: { fontSize: 10 },
  date: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  notes: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },
  amount: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginLeft: 8 },
});
