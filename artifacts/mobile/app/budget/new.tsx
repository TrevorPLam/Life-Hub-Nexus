import React, { useState, useEffect } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useBudget, TransactionType, EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_COLORS } from '@/context/BudgetContext';
import { CATEGORY_ICONS } from '@/components/budget/TransactionItem';
import { DatePickerModal } from '@/components/ui/DatePickerModal';

export default function NewTransactionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addTransaction, updateTransaction, getTransaction } = useBudget();
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id;
  const existing = editingId ? getTransaction(editingId) : undefined;

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const [type, setType] = useState<TransactionType>(existing?.type ?? 'expense');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [category, setCategory] = useState(existing?.category ?? '');
  const [date, setDate] = useState(existing?.date ?? new Date().toISOString());
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [recurring, setRecurring] = useState(existing?.recurring ?? false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  // Reset category when type changes (unless editing)
  useEffect(() => {
    if (!existing) setCategory('');
  }, [type]);

  const isValid = title.trim().length > 0 && amount.length > 0 && category.length > 0 && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;

  const handleSave = () => {
    if (!isValid) return;
    const amountNum = parseFloat(amount.replace(/,/g, ''));

    if (editingId) {
      updateTransaction(editingId, { title: title.trim(), amount: amountNum, type, category, date, notes, recurring });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } else {
      addTransaction({ title: title.trim(), amount: amountNum, type, category, date, notes, recurring, linkedTaskIds: [], linkedPersonIds: [] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    }
  };

  const dateLabel = (() => {
    const d = new Date(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const txDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (txDay.getTime() === today.getTime()) return 'Today';
    if (txDay.getTime() === today.getTime() - 86400000) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  })();

  const accentColor = type === 'income' ? colors.notes : colors.destructive;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad > 20 ? topPad : 16, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancel, { color: colors.mutedForeground }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {editingId ? 'Edit Transaction' : 'Add Transaction'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!isValid}
          style={[styles.saveBtn, { backgroundColor: isValid ? colors.budget : colors.muted }]}
        >
          <Text style={[styles.saveBtnText, { color: isValid ? '#fff' : colors.mutedForeground }]}>
            {editingId ? 'Update' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Type toggle */}
        <View style={[styles.typeToggle, { backgroundColor: colors.muted }]}>
          {(['expense', 'income'] as TransactionType[]).map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => { setType(t); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={[styles.typeBtn, type === t && {
                backgroundColor: t === 'income' ? colors.notes : colors.destructive,
              }]}
            >
              <Feather
                name={t === 'income' ? 'arrow-down-left' : 'arrow-up-right'}
                size={15}
                color={type === t ? '#fff' : colors.mutedForeground}
              />
              <Text style={[styles.typeBtnText, { color: type === t ? '#fff' : colors.mutedForeground }]}>
                {t === 'income' ? 'Income' : 'Expense'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount */}
        <View style={styles.amountSection}>
          <Text style={[styles.currencySign, { color: accentColor }]}>$</Text>
          <TextInput
            style={[styles.amountInput, { color: accentColor }]}
            placeholder="0.00"
            placeholderTextColor={`${accentColor}50`}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            autoFocus={!editingId}
          />
        </View>

        {/* Main fields card */}
        <View style={[styles.fieldsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Title */}
          <View style={styles.fieldRow}>
            <Feather name="edit-3" size={16} color={colors.mutedForeground} style={styles.fieldIcon} />
            <TextInput
              style={[styles.fieldInput, { color: colors.foreground }]}
              placeholder="Description"
              placeholderTextColor={colors.mutedForeground}
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
            />
          </View>
          <View style={[styles.fieldDivider, { backgroundColor: colors.border }]} />

          {/* Date */}
          <TouchableOpacity style={styles.fieldRow} onPress={() => setDatePickerVisible(true)}>
            <Feather name="calendar" size={16} color={colors.mutedForeground} style={styles.fieldIcon} />
            <Text style={[styles.fieldInput, { color: colors.foreground }]}>{dateLabel}</Text>
            <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
          <View style={[styles.fieldDivider, { backgroundColor: colors.border }]} />

          {/* Notes */}
          <View style={[styles.fieldRow, { alignItems: 'flex-start' }]}>
            <Feather name="file-text" size={16} color={colors.mutedForeground} style={[styles.fieldIcon, { marginTop: 2 }]} />
            <TextInput
              style={[styles.fieldInput, styles.fieldInputMulti, { color: colors.foreground }]}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.mutedForeground}
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />
          </View>
          <View style={[styles.fieldDivider, { backgroundColor: colors.border }]} />

          {/* Recurring toggle */}
          <TouchableOpacity
            style={styles.fieldRow}
            onPress={() => { setRecurring(r => !r); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Feather name="repeat" size={16} color={recurring ? colors.primary : colors.mutedForeground} style={styles.fieldIcon} />
            <Text style={[styles.fieldInput, { color: recurring ? colors.primary : colors.foreground }]}>Recurring</Text>
            <View style={[styles.toggle, { backgroundColor: recurring ? colors.primary : colors.muted }]}>
              <View style={[styles.toggleThumb, { transform: [{ translateX: recurring ? 18 : 2 }] }]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Category */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Category</Text>
        <View style={styles.categoryGrid}>
          {categories.map(cat => {
            const color = CATEGORY_COLORS[cat] || colors.budget;
            const icon = CATEGORY_ICONS[cat] || 'circle';
            const selected = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => { setCategory(cat); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[styles.catBtn, {
                  backgroundColor: selected ? `${color}20` : colors.card,
                  borderColor: selected ? color : colors.border,
                  borderWidth: 1,
                }]}
              >
                <Feather name={icon as any} size={14} color={selected ? color : colors.mutedForeground} />
                <Text style={[styles.catBtnText, { color: selected ? color : colors.mutedForeground }]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <DatePickerModal
        visible={datePickerVisible}
        value={date.split('T')[0]}
        onConfirm={iso => {
          const [y, m, d] = iso.split('-').map(Number);
          const newDate = new Date(y, m - 1, d);
          setDate(newDate.toISOString());
          setDatePickerVisible(false);
        }}
        onDismiss={() => setDatePickerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancel: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  typeToggle: { flexDirection: 'row', borderRadius: 14, padding: 3, marginBottom: 24 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12 },
  typeBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },

  amountSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, gap: 4 },
  currencySign: { fontSize: 32, fontFamily: 'Inter_400Regular', marginTop: 8 },
  amountInput: { fontSize: 56, fontFamily: 'Inter_700Bold', letterSpacing: -2, minWidth: 100, textAlign: 'center' },

  fieldsCard: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: 24 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  fieldIcon: { marginRight: 12 },
  fieldInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', padding: 0 },
  fieldInputMulti: { minHeight: 60, textAlignVertical: 'top', lineHeight: 22 },
  fieldDivider: { height: StyleSheet.hairlineWidth, marginLeft: 44 },
  toggle: { width: 42, height: 24, borderRadius: 12, justifyContent: 'center', position: 'relative' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', position: 'absolute', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 },

  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 },
  catBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
});
