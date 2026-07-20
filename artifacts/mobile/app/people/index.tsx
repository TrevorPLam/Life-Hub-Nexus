import React, { useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { usePeople } from '@/context/PeopleContext';
import { PersonCard } from '@/components/people/PersonCard';
import { EmptyState } from '@/components/ui/EmptyState';

export default function PeopleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { people, getTodayBirthdays, getOverdueTouchups } = usePeople();
  const [search, setSearch] = useState('');

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const filtered = search
    ? people.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.company.toLowerCase().includes(search.toLowerCase()))
    : people;

  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  const birthdays = getTodayBirthdays();
  const overdueTouch = getOverdueTouchups();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()}>
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>People</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/people/new')} style={[styles.addBtn, { backgroundColor: colors.people }]}>
            <Feather name="user-plus" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchBar, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search people..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Alerts */}
        {(birthdays.length > 0 || overdueTouch.length > 0) && !search && (
          <View style={styles.alertsRow}>
            {birthdays.length > 0 && (
              <View style={[styles.alertChip, { backgroundColor: `${colors.social}18`, borderColor: `${colors.social}35` }]}>
                <Feather name="gift" size={12} color={colors.social} />
                <Text style={[styles.alertText, { color: colors.social }]}>{birthdays.length} birthday{birthdays.length > 1 ? 's' : ''}</Text>
              </View>
            )}
            {overdueTouch.length > 0 && (
              <View style={[styles.alertChip, { backgroundColor: `${colors.people}18`, borderColor: `${colors.people}35` }]}>
                <Feather name="clock" size={12} color={colors.people} />
                <Text style={[styles.alertText, { color: colors.people }]}>{overdueTouch.length} overdue check-in{overdueTouch.length > 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <FlatList
        data={sorted}
        keyExtractor={p => p.id}
        renderItem={({ item }) => (
          <PersonCard person={item} onPress={() => router.push(`/people/${item.id}`)} />
        )}
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingBottom: Platform.OS === 'web' ? 80 : 100 }]}
        ListEmptyComponent={
          <EmptyState
            icon="users"
            title={search ? 'No results' : 'No contacts yet'}
            subtitle="Add the people who matter in your life"
            actionLabel={!search ? 'Add Person' : undefined}
            onAction={() => router.push('/people/new')}
            accentColor={colors.people}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, height: 40, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', padding: 0 },
  alertsRow: { flexDirection: 'row', gap: 8 },
  alertChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  alertText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  list: { flex: 1 },
  listContent: { flexGrow: 1 },
});
