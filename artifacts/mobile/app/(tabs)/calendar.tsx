import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useCalendar } from '@/context/CalendarContext';
import { EventItem } from '@/components/calendar/EventItem';
import { TimeGrid } from '@/components/calendar/TimeGrid';
import { EmptyState } from '@/components/ui/EmptyState';

type CalView = 'month' | 'week' | 'day';

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

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

  const hasEvents = (date: Date) =>
    events.some(e => {
      // Quick dot check — check the raw start date only for performance
      return new Date(e.startDate).toDateString() === date.toDateString();
    });

  const isToday = (d: number) => {
    const now = new Date();
    return (
      d === now.getDate() &&
      currentMonth.getMonth() === now.getMonth() &&
      currentMonth.getFullYear() === now.getFullYear()
    );
  };

  const isSelected = (d: number) =>
    d === selectedDate.getDate() &&
    currentMonth.getMonth() === selectedDate.getMonth() &&
    currentMonth.getFullYear() === selectedDate.getFullYear();

  const prevMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const prevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };
  const nextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const getWeekDates = () => {
    const start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() - selectedDate.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const handleNewEventAtSlot = (time: Date) => {
    router.push(`/calendar/new`);
  };

  const useTimeGrid = view === 'week' || view === 'day';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setSelectedDate(new Date())} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Calendar</Text>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <View style={[styles.viewToggle, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
              {(['month', 'week', 'day'] as CalView[]).map(v => (
                <TouchableOpacity
                  key={v}
                  onPress={() => setView(v)}
                  style={[
                    styles.viewBtn,
                    view === v && { backgroundColor: colors.calendar, borderRadius: colors.radius - 2 },
                  ]}
                >
                  <Text style={[styles.viewBtnText, { color: view === v ? '#fff' : colors.mutedForeground }]}>
                    {v === 'month' ? 'M' : v === 'week' ? 'W' : 'D'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => router.push('/calendar/new')}
              style={[styles.addBtn, { backgroundColor: colors.calendar }]}
            >
              <Feather name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Month view: full calendar grid */}
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

            <View style={styles.dayHeaders}>
              {DAYS_SHORT.map(d => (
                <Text key={d} style={[styles.dayHeader, { color: colors.mutedForeground }]}>{d}</Text>
              ))}
            </View>

            <View style={styles.grid}>
              {Array.from({ length: firstDayOfMonth }, (_, i) => (
                <View key={`empty-${i}`} style={styles.dayCell} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const todayCell = isToday(day);
                const sel = isSelected(day);
                const hasDot = hasEvents(date);
                return (
                  <TouchableOpacity
                    key={day}
                    style={styles.dayCell}
                    onPress={() => {
                      setSelectedDate(date);
                      setView('day');
                    }}
                  >
                    <View
                      style={[
                        styles.dayInner,
                        todayCell && { backgroundColor: `${colors.calendar}20` },
                        sel && { backgroundColor: colors.calendar },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNum,
                          { color: sel ? '#fff' : todayCell ? colors.calendar : colors.foreground },
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                    {hasDot && !sel && (
                      <View style={[styles.eventDot, { backgroundColor: colors.calendar }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Week strip */}
        {view === 'week' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dayStrip}
            contentContainerStyle={styles.dayStripContent}
          >
            {getWeekDates().map((d, i) => {
              const sel = d.toDateString() === selectedDate.toDateString();
              const todayD = d.toDateString() === new Date().toDateString();
              return (
                <TouchableOpacity key={i} onPress={() => setSelectedDate(d)} style={styles.stripDay}>
                  <Text style={[styles.stripDayName, { color: colors.mutedForeground }]}>
                    {DAYS_SHORT[d.getDay()]}
                  </Text>
                  <View
                    style={[
                      styles.stripDayNum,
                      sel && { backgroundColor: colors.calendar },
                      todayD && !sel && { borderWidth: 1, borderColor: colors.calendar },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stripDayNumText,
                        { color: sel ? '#fff' : todayD ? colors.calendar : colors.foreground },
                      ]}
                    >
                      {d.getDate()}
                    </Text>
                  </View>
                  {hasEvents(d) && !sel && (
                    <View style={[styles.eventDot, { backgroundColor: colors.calendar }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Day navigation bar */}
        {view === 'day' && (
          <View style={styles.dayNav}>
            <TouchableOpacity onPress={prevDay} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="chevron-left" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedDate(new Date())} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.dayNavLabel, { color: colors.foreground }]}>
                {selectedDate.toDateString() === new Date().toDateString()
                  ? 'Today'
                  : selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              <Text style={[styles.dayNavSub, { color: colors.mutedForeground }]}>
                {selectedDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={nextDay} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="chevron-right" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content */}
      {useTimeGrid ? (
        <TimeGrid
          events={selectedEvents}
          date={selectedDate}
          calendarColor={colors.calendar}
          onEventPress={id => router.push(`/calendar/${id}`)}
          onSlotPress={handleNewEventAtSlot}
        />
      ) : (
        <>
          {/* Selected date header for month view */}
          <View style={styles.selectedDateRow}>
            <Text style={[styles.selectedDateLabel, { color: colors.foreground }]}>
              {selectedDate.toDateString() === new Date().toDateString()
                ? 'Today'
                : selectedDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
            <Text style={[styles.eventCount, { color: colors.mutedForeground }]}>
              {selectedEvents.length} {selectedEvents.length === 1 ? 'event' : 'events'}
            </Text>
          </View>

          <ScrollView
            style={styles.events}
            contentContainerStyle={[
              styles.eventsContent,
              { paddingBottom: Platform.OS === 'web' ? 100 : 120 },
            ]}
          >
            {selectedEvents.length === 0 ? (
              <EmptyState
                icon="calendar"
                title="No events"
                subtitle="Tap a day to view or tap + to add"
                accentColor={colors.calendar}
              />
            ) : (
              selectedEvents.map(e => (
                <EventItem key={e.id} event={e} onPress={() => router.push(`/calendar/${e.id}`)} />
              ))
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  viewToggle: { flexDirection: 'row', padding: 3, gap: 2 },
  viewBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  viewBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
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
  dayNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  dayNavLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  dayNavSub: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 2 },
  selectedDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedDateLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  eventCount: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  events: { flex: 1 },
  eventsContent: { paddingHorizontal: 16, paddingTop: 4 },
});
