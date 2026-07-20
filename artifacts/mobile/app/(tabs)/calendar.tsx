import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useCalendar } from '@/context/CalendarContext';
import { EventItem } from '@/components/calendar/EventItem';
import { EmptyState } from '@/components/ui/EmptyState';

type CalView = 'month' | 'week' | '3day';

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { events, getEventsForDate } = useCalendar();
  const [view, setView] = useState<CalView>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const selectedEvents = getEventsForDate(selectedDate);

  const hasEvents = (date: Date) => {
    const dateStr = date.toDateString();
    return events.some(e => new Date(e.startDate).toDateString() === dateStr);
  };

  const isToday = (d: number) => {
    const now = new Date();
    return d === now.getDate() && currentMonth.getMonth() === now.getMonth() && currentMonth.getFullYear() === now.getFullYear();
  };

  const isSelected = (d: number) => {
    return d === selectedDate.getDate() && currentMonth.getMonth() === selectedDate.getMonth() && currentMonth.getFullYear() === selectedDate.getFullYear();
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const getWeekDates = () => {
    const start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() - selectedDate.getDay());
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  };

  const get3Days = () => {
    return Array.from({ length: 3 }, (_, i) => { const d = new Date(selectedDate); d.setDate(selectedDate.getDate() + i); return d; });
  };

  const viewDates = view === 'week' ? getWeekDates() : view === '3day' ? get3Days() : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Calendar</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={[styles.viewToggle, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
              {(['month', 'week', '3day'] as CalView[]).map(v => (
                <TouchableOpacity key={v} onPress={() => setView(v)}
                  style={[styles.viewBtn, view === v && { backgroundColor: colors.calendar, borderRadius: colors.radius - 2 }]}>
                  <Text style={[styles.viewBtnText, { color: view === v ? '#fff' : colors.mutedForeground }]}>
                    {v === '3day' ? '3D' : v === 'month' ? 'M' : 'W'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => router.push('/calendar/new')} style={[styles.addBtn, { backgroundColor: colors.calendar }]}>
              <Feather name="plus" size={20} color="#fff" />
            </TouchableOpacity>

          </View>
        </View>

        {/* Month nav */}
        {view === 'month' && (
          <>
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="chevron-left" size={20} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.monthLabel, { color: colors.foreground }]}>
                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="chevron-right" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Day headers */}
            <View style={styles.dayHeaders}>
              {DAYS_SHORT.map(d => (
                <Text key={d} style={[styles.dayHeader, { color: colors.mutedForeground }]}>{d}</Text>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={styles.grid}>
              {Array.from({ length: firstDayOfMonth }, (_, i) => <View key={`empty-${i}`} style={styles.dayCell} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const today_ = isToday(day);
                const sel = isSelected(day);
                const hasDot = hasEvents(date);
                return (
                  <TouchableOpacity key={day} style={styles.dayCell} onPress={() => setSelectedDate(date)}>
                    <View style={[styles.dayInner, today_ && { backgroundColor: `${colors.calendar}20` }, sel && { backgroundColor: colors.calendar }]}>
                      <Text style={[styles.dayNum, { color: sel ? '#fff' : today_ ? colors.calendar : colors.foreground }]}>{day}</Text>
                    </View>
                    {hasDot && !sel && <View style={[styles.eventDot, { backgroundColor: colors.calendar }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Week/3day strip */}
        {viewDates && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayStrip} contentContainerStyle={styles.dayStripContent}>
            {viewDates.map((d, i) => {
              const sel = d.toDateString() === selectedDate.toDateString();
              const today_ = d.toDateString() === new Date().toDateString();
              return (
                <TouchableOpacity key={i} onPress={() => setSelectedDate(d)} style={styles.stripDay}>
                  <Text style={[styles.stripDayName, { color: colors.mutedForeground }]}>{DAYS_SHORT[d.getDay()]}</Text>
                  <View style={[styles.stripDayNum, sel && { backgroundColor: colors.calendar }, today_ && !sel && { borderWidth: 1, borderColor: colors.calendar }]}>
                    <Text style={[styles.stripDayNumText, { color: sel ? '#fff' : today_ ? colors.calendar : colors.foreground }]}>{d.getDate()}</Text>
                  </View>
                  {hasEvents(d) && !sel && <View style={[styles.eventDot, { backgroundColor: colors.calendar }]} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Selected date events */}
      <View style={styles.selectedDateRow}>
        <Text style={[styles.selectedDateLabel, { color: colors.foreground }]}>
          {selectedDate.toDateString() === new Date().toDateString() ? 'Today' : selectedDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
        </Text>
        <Text style={[styles.eventCount, { color: colors.mutedForeground }]}>{selectedEvents.length} events</Text>
      </View>

      <ScrollView style={styles.events} contentContainerStyle={[styles.eventsContent, { paddingBottom: Platform.OS === 'web' ? 100 : 120 }]}>
        {selectedEvents.length === 0 ? (
          <EmptyState icon="calendar" title="No events" subtitle="Add something to your schedule" accentColor={colors.calendar} />
        ) : (
          selectedEvents.map(e => <EventItem key={e.id} event={e} onPress={() => router.push(`/calendar/${e.id}`)} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  headerTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  viewToggle: { flexDirection: 'row', padding: 3, gap: 2 },
  viewBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  viewBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  monthLabel: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  dayHeaders: { flexDirection: 'row', marginBottom: 4 },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 11, fontFamily: 'Inter_500Medium' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', alignItems: 'center', paddingVertical: 2 },
  dayInner: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  eventDot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
  dayStrip: { marginBottom: 8 },
  dayStripContent: { paddingHorizontal: 4, gap: 4 },
  stripDay: { alignItems: 'center', paddingHorizontal: 6 },
  stripDayName: { fontSize: 11, fontFamily: 'Inter_500Medium', marginBottom: 4 },
  stripDayNum: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  stripDayNumText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  selectedDateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  selectedDateLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  eventCount: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  events: { flex: 1 },
  eventsContent: { paddingHorizontal: 16, paddingTop: 4 },
});
