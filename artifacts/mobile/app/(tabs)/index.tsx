import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { useWork } from '@/context/WorkContext';
import { useCalendar } from '@/context/CalendarContext';
import { useNotes } from '@/context/NotesContext';
import { useBudget } from '@/context/BudgetContext';
import { usePeople } from '@/context/PeopleContext';
import { TaskItem } from '@/components/work/TaskItem';
import { EventItem } from '@/components/calendar/EventItem';
import { Avatar } from '@/components/ui/Avatar';

function SectionHeader({ title, count, color, onSeeAll }: { title: string; count?: number; color: string; onSeeAll?: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <View style={[styles.sectionDot, { backgroundColor: color }]} />
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
        {count !== undefined && (
          <View style={[styles.sectionBadge, { backgroundColor: `${color}20` }]}>
            <Text style={[styles.sectionBadgeText, { color }]}>{count}</Text>
          </View>
        )}
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={[styles.seeAll, { color }]}>See all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { greeting, profile } = useApp();
  const { getRootTasks, toggleComplete } = useWork();
  const { getUpcomingEvents, getEventsForDate } = useCalendar();
  const { notes } = useNotes();
  const { getMonthlyIncome, getMonthlyExpenses } = useBudget();
  const { getTodayBirthdays, getOverdueTouchups } = usePeople();

  const today = new Date();
  const todayStr = today.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  const allTasks = getRootTasks();
  const todayTasks = allTasks.filter(t => t.status !== 'done').slice(0, 4);
  const todayEvents = getEventsForDate(today);
  const upcomingEvents = getUpcomingEvents(3);
  const monthIncome = getMonthlyIncome();
  const monthExpenses = getMonthlyExpenses();
  const birthdays = getTodayBirthdays();
  const overdueTouch = getOverdueTouchups();
  const recentNotes = [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 2);

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.greeting, { color: colors.foreground }]}>{greeting}</Text>
            <Text style={[styles.date, { color: colors.mutedForeground }]}>{todayStr}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/social')}>
            <Avatar name={profile.name} color={colors.primary} size={38} />
          </TouchableOpacity>
        </View>

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <StatPill icon="check-circle" label={`${allTasks.filter(t => t.status !== 'done').length} tasks`} color={colors.work} onPress={() => router.push('/(tabs)/work')} />
          <StatPill icon="calendar" label={`${todayEvents.length} events`} color={colors.calendar} onPress={() => router.push('/(tabs)/calendar')} />
          <StatPill icon="trending-down" label={`$${monthExpenses.toLocaleString()}`} color={colors.budget} onPress={() => router.push('/budget')} />
          {(birthdays.length > 0 || overdueTouch.length > 0) && (
            <StatPill icon="users" label={`${birthdays.length + overdueTouch.length} alerts`} color={colors.people} onPress={() => router.push('/people')} />
          )}
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === 'web' ? 100 : 120 }]} showsVerticalScrollIndicator={false}>
        
        {/* Birthdays alert */}
        {birthdays.length > 0 && (
          <TouchableOpacity style={[styles.alert, { backgroundColor: `${colors.social}15`, borderColor: `${colors.social}30` }]} onPress={() => router.push('/people')}>
            <Feather name="gift" size={16} color={colors.social} />
            <Text style={[styles.alertText, { color: colors.social }]}>
              {birthdays[0].name}{birthdays.length > 1 ? ` +${birthdays.length - 1} more` : ''} {birthdays.length === 1 ? 'has' : 'have'} a birthday today
            </Text>
          </TouchableOpacity>
        )}

        {/* Stay in touch nudge */}
        {overdueTouch.length > 0 && (
          <TouchableOpacity style={[styles.alert, { backgroundColor: `${colors.people}15`, borderColor: `${colors.people}30` }]} onPress={() => router.push('/people')}>
            <Feather name="users" size={16} color={colors.people} />
            <Text style={[styles.alertText, { color: colors.people }]}>
              {overdueTouch.length} {overdueTouch.length === 1 ? 'person needs' : 'people need'} a check-in
            </Text>
          </TouchableOpacity>
        )}

        {/* Today's Tasks */}
        {todayTasks.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Tasks" count={todayTasks.length} color={colors.work} onSeeAll={() => router.push('/(tabs)/work')} />
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {todayTasks.map(task => (
                <TaskItem key={task.id} task={task} compact
                  onPress={() => router.push(`/work/${task.id}`)}
                  onToggle={() => toggleComplete(task.id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Today's Events */}
        {upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Upcoming" count={upcomingEvents.length} color={colors.calendar} onSeeAll={() => router.push('/(tabs)/calendar')} />
            <View style={styles.eventsWrapper}>
              {upcomingEvents.map(event => (
                <EventItem key={event.id} event={event} onPress={() => router.push(`/calendar/${event.id}`)} />
              ))}
            </View>
          </View>
        )}

        {/* Budget snapshot */}
        <View style={styles.section}>
          <SectionHeader title="Budget" color={colors.budget} onSeeAll={() => router.push('/budget')} />
          <TouchableOpacity style={[styles.card, styles.budgetCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push('/budget')}>
            <View style={styles.budgetItem}>
              <Text style={[styles.budgetLabel, { color: colors.mutedForeground }]}>Income</Text>
              <Text style={[styles.budgetAmount, { color: colors.budget }]}>+${monthIncome.toLocaleString()}</Text>
            </View>
            <View style={[styles.budgetDivider, { backgroundColor: colors.border }]} />
            <View style={styles.budgetItem}>
              <Text style={[styles.budgetLabel, { color: colors.mutedForeground }]}>Spent</Text>
              <Text style={[styles.budgetAmount, { color: colors.foreground }]}>-${monthExpenses.toLocaleString()}</Text>
            </View>
            <View style={[styles.budgetDivider, { backgroundColor: colors.border }]} />
            <View style={styles.budgetItem}>
              <Text style={[styles.budgetLabel, { color: colors.mutedForeground }]}>Left</Text>
              <Text style={[styles.budgetAmount, { color: monthIncome - monthExpenses >= 0 ? colors.budget : colors.destructive }]}>
                ${Math.abs(monthIncome - monthExpenses).toLocaleString()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Notes */}
        {recentNotes.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Notes" color={colors.notes} onSeeAll={() => router.push('/(tabs)/notes')} />
            <View style={styles.notesRow}>
              {recentNotes.map(note => (
                <TouchableOpacity key={note.id} style={[styles.notePreview, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push(`/notes/${note.id}`)}>
                  <Text style={[styles.noteTitle, { color: colors.foreground }]} numberOfLines={1}>{note.title || 'Untitled'}</Text>
                  <Text style={[styles.noteBody, { color: colors.mutedForeground }]} numberOfLines={3}>
                    {note.content.replace(/#{1,6}\s/g, '').replace(/\*\*/g, '').replace(/\n/g, ' ').trim()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

function StatPill({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity style={[styles.pill, { backgroundColor: `${color}15`, borderColor: `${color}25` }]} onPress={onPress}>
      <Feather name={icon as any} size={12} color={color} />
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  greeting: { fontSize: 24, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  date: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 8 },
  section: { marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  sectionBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  sectionBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  seeAll: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  alertText: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1 },
  eventsWrapper: {},
  budgetCard: { flexDirection: 'row', padding: 16 },
  budgetItem: { flex: 1, alignItems: 'center' },
  budgetLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  budgetAmount: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  budgetDivider: { width: StyleSheet.hairlineWidth, marginHorizontal: 8 },
  notesRow: { flexDirection: 'row', gap: 10 },
  notePreview: { flex: 1, padding: 12, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  noteTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  noteBody: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 16 },
});
