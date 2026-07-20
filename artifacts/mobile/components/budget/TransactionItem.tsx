import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Transaction } from '@/context/BudgetContext';

const CATEGORY_ICONS: Record<string, string> = {
  Food: 'coffee', Transport: 'map', Entertainment: 'music', Shopping: 'shopping-bag',
  Health: 'heart', Bills: 'file', Travel: 'globe', Other: 'circle',
  Salary: 'briefcase', Freelance: 'code', Investment: 'trending-up', Gift: 'gift',
};

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
}

export function TransactionItem({ transaction: tx, onPress }: TransactionItemProps) {
  const colors = useColors();
  const isIncome = tx.type === 'income';
  const icon = CATEGORY_ICONS[tx.category] || 'circle';
  const dateStr = new Date(tx.date).toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <View style={[styles.iconWrap, { backgroundColor: isIncome ? `${colors.budget}18` : `${colors.destructive}12` }]}>
        <Feather name={icon as any} size={16} color={isIncome ? colors.budget : colors.destructive} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>{tx.title}</Text>
        <View style={styles.meta}>
          <Text style={[styles.category, { color: colors.mutedForeground }]}>{tx.category}</Text>
          <Text style={[styles.dot, { color: colors.mutedForeground }]}>·</Text>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>{dateStr}</Text>
        </View>
      </View>
      <Text style={[styles.amount, { color: isIncome ? colors.budget : colors.foreground }]}>
        {isIncome ? '+' : '-'}${tx.amount.toLocaleString()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  content: { flex: 1 },
  title: { fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  category: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  dot: { fontSize: 12 },
  date: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  amount: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginLeft: 8 },
});
