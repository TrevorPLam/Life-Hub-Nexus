import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useBudget, TransactionType, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/context/BudgetContext';

export default function NewTransactionScreen() {
  const colors = useColors();
  const { addTransaction } = useBudget();

  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleCreate = () => {
    if (!title.trim() || !amount || !category) return;
    const amountNum = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(amountNum) || amountNum <= 0) return;
    addTransaction({ title: title.trim(), amount: amountNum, type, category, date: new Date().toISOString(), notes, linkedTaskIds: [], linkedPersonIds: [] });
    router.back();
  };

  const isValid = title.trim() && amount && category && !isNaN(parseFloat(amount));

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancel, { color: colors.mutedForeground }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Add Transaction</Text>
        <TouchableOpacity onPress={handleCreate} disabled={!isValid}
          style={[styles.createBtn, { backgroundColor: isValid ? colors.budget : colors.muted }]}>
          <Text style={[styles.createBtnText, { color: isValid ? '#fff' : colors.mutedForeground }]}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Type toggle */}
        <View style={[styles.typeToggle, { backgroundColor: colors.muted }]}>
          {(['expense', 'income'] as TransactionType[]).map(t => (
            <TouchableOpacity key={t} onPress={() => { setType(t); setCategory(''); }}
              style={[styles.typeBtn, type === t && { backgroundColor: t === 'income' ? colors.budget : colors.destructive }]}>
              <Text style={[styles.typeBtnText, { color: type === t ? '#fff' : colors.mutedForeground }]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount */}
        <View style={styles.amountRow}>
          <Text style={[styles.currencySign, { color: type === 'income' ? colors.budget : colors.foreground }]}>$</Text>
          <TextInput
            style={[styles.amountInput, { color: type === 'income' ? colors.budget : colors.foreground }]}
            placeholder="0.00"
            placeholderTextColor={colors.mutedForeground}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            autoFocus
          />
        </View>

        {/* Title */}
        <TextInput
          style={[styles.titleInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
          placeholder="Description"
          placeholderTextColor={colors.mutedForeground}
          value={title}
          onChangeText={setTitle}
        />

        {/* Category */}
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Category</Text>
        <View style={styles.categoryGrid}>
          {categories.map(cat => (
            <TouchableOpacity key={cat} onPress={() => setCategory(cat)}
              style={[styles.catBtn, { backgroundColor: category === cat ? `${colors.budget}20` : colors.muted, borderColor: category === cat ? colors.budget : 'transparent', borderWidth: 1 }]}>
              <Text style={[styles.catBtnText, { color: category === cat ? colors.budget : colors.mutedForeground }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        <TextInput
          style={[styles.notesInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
          placeholder="Notes (optional)"
          placeholderTextColor={colors.mutedForeground}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  cancel: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  createBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  createBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  typeToggle: { flexDirection: 'row', borderRadius: 12, padding: 3, marginBottom: 24 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  typeBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  currencySign: { fontSize: 32, fontFamily: 'Inter_400Regular', marginRight: 4 },
  amountInput: { fontSize: 52, fontFamily: 'Inter_700Bold', letterSpacing: -2, minWidth: 100 },
  titleInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: 'Inter_400Regular', marginBottom: 20 },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  catBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  notesInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: 'Inter_400Regular', minHeight: 80 },
});
