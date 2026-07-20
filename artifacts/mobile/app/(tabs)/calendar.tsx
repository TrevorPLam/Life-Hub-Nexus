import React, { useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useCalendar, CalendarEvent } from '@/context/CalendarContext';
import { EventItem } from '@/components/calendar/EventItem';
import { TimeGrid } from '@/components/calendar/TimeGrid';
import { EmptyState } from '@/components/ui/EmptyState';

type CalView = 'month' | 'week' | 'day';

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MAX_DOTS = 3;

function EventDots({ events }: { events: CalendarEvent[] }) {
  if (events.length === 0) return null;
  const dots = events.slice(0, MAX_DOTS);
  const overflow = events.length - MAX_DOTS;
  return (
    <View style={dotStyles.row}>
      {dots.map((e, i) => (
        <View
          key={e.id}
          style={[
            dotStyles.dot,
            { backgroundColor: e.color },
            // fade the last dot when there's overflow
            i === MAX_DOTS - 1 && overflow > 0 && { opacity: 0.5 },
          ]}
        />
      ))}
      {overflow > 0 && (
        <Text style={dotStyles.overflow}>+{overflow}</Text>
      )}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2, justifyContent: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2 },
  overflow: { fontSize: 7, fontFamily: 'Inter_600SemiBold', color: '#666', marginLeft: 1 },
});

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

  // Pre-compute events for every day in the visible month (honors recurrence)
  const monthEventMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
      map.set(date.toDateString(), getEventsForDate(date));
    }
    return map;
  }, [currentMonth, events, daysInMonth]);

  const selectedEvents = useMemo(() => getEventsForDate(selectedDate), [selectedDate, events]);

  // ── Navigation helpers ────────────────────────────────────────────────────

  const prevMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const prevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    setSelectedDate(d);
    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };
  const nextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    setSelectedDate(d);
    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };

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

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const isViewingToday = selectedDate.toDateString() === new Date().toDateString();

  // ── Swipe gesture ─────────────────────────────────────────────────────────

  const swipePan = useRef(
    PanResponder.create({
      // Only capture if horizontal movement dominates
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5 && Math.abs(gs.dx) > 12,
      onPanResponderTerminationRequest: () => true,
      onPanResponderRelease: (_, gs) => {
        const THRESHOLD = 60;
        if (gs.dx > THRESHOLD) {
          // Swipe right → go back
          if (viewRef.current === 'month') prevMonthRef.current();
          else if (viewRef.current === 'week') prevWeekRef.current();
          else prevDayRef.current();
        } else if (gs.dx < -THRESHOLD) {
          // Swipe left → go forward
          if (viewRef.current === 'month') nextMonthRef.current();
          else if (viewRef.current === 'week') nextWeekRef.current();
          else nextDayRef.current();
        }
      },
    }),
  ).current;

  // Use refs to avoid stale closure in PanResponder
  const viewRef = useRef(view);
  viewRef.current = view;
  const prevMonthRef = useRef(prevMonth); prevMonthRef.current = prevMonth;
  const nextMonthRef = useRef(nextMonth); nextMonthRef.current = nextMonth;
  const prevWeekRef = useRef(prevWeek); prevWeekRef.current = prevWeek;
  const nextWeekRef = useRef(nextWeek); nextWeekRef.current = nextWeek;
  const prevDayRef = useRef(prevDay); prevDayRef.current = prevDay;
  const nextDayRef = useRef(nextDay); nextDayRef.current = nextDay;

  // ── Week dates ────────────────────────────────────────────────────────────

  const weekDates = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() - selectedDate.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const useTimeGrid = view === 'week' || view === 'day';

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View
        {...swipePan.panHandlers}
        style={[
          styles.header,
          { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        {/* Title row */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={goToToday} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Calendar</Text>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            {/* Today pill — visible when not on today in week/day views */}
            {!isViewingToday && view !== 'month' && (
              <TouchableOpacity
                onPress={goToToday}
                style={[styles.todayPill, { borderColor: colors.calendar }]}
              >
                <Text style={[styles.todayPillText, { color: colors.calendar }]}>Today</Text>
              </TouchableOpacity>
            )}

            {/* View toggle */}
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

        {/* ── Month grid ──────────────────────────────────────────────── */}
        {view === 'month' && (
          <>
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Feather name="chevron-left" size={20} color={colors.foreground} />
              </TouchableOpacity>
              <TouchableOpacity onPress={goToToday}>
                <Text style={[styles.monthLabel, { color: colors.foreground }]}>
                  {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
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
                const cellEvents = monthEventMap.get(date.toDateString()) ?? [];

                return (
                  <TouchableOpacity
                    key={day}
                    style={styles.dayCell}
                    onPress={() => {
                      setSelectedDate(date);
                      setView('day');
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.dayInner,
                        todayCell && { backgroundColor: `${colors.calendar}25` },
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
                    {!sel && <EventDots events={cellEvents} />}
                    {sel && cellEvents.length > 0 && (
                      <View style={dotStyles.row}>
                        <View style={[dotStyles.dot, { backgroundColor: 'rgba(255,255,255,0.6)' }]} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* ── Week strip ───────────────────────────────────────────────── */}
        {view === 'week' && (
          <>
            <View style={styles.weekNavRow}>
              <TouchableOpacity onPress={prevWeek} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="chevron-left" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.dayStrip}
                contentContainerStyle={styles.dayStripContent}
              >
                {weekDates.map((d, i) => {
                  const sel = d.toDateString() === selectedDate.toDateString();
                  const todayD = d.toDateString() === new Date().toDateString();
                  const dayEvents = getEventsForDate(d);
                  return (
                    <TouchableOpacity key={i} onPress={() => setSelectedDate(d)} style={styles.stripDay}>
                      <Text style={[styles.stripDayName, { color: todayD ? colors.calendar : colors.mutedForeground }]}>
                        {DAYS_SHORT[d.getDay()]}
                      </Text>
                      <View
                        style={[
                          styles.stripDayNum,
                          sel && { backgroundColor: colors.calendar },
                          todayD && !sel && { borderWidth: 1.5, borderColor: colors.calendar },
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
                      {!sel && <EventDots events={dayEvents.slice(0, 3)} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TouchableOpacity onPress={nextWeek} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Day navigation ───────────────────────────────────────────── */}
        {view === 'day' && (
          <View style={styles.dayNav}>
            <TouchableOpacity onPress={prevDay} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Feather name="chevron-left" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={goToToday} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.dayNavLabel, { color: colors.foreground }]}>
                {isViewingToday
                  ? 'Today'
                  : selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              {!isViewingToday && (
                <Text style={[styles.dayNavSub, { color: colors.mutedForeground }]}>
                  {selectedDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={nextDay} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Feather name="chevron-right" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Content ────────────────────────────────────────────────────── */}
      {useTimeGrid ? (
        <TimeGrid
          events={selectedEvents}
          date={selectedDate}
          calendarColor={colors.calendar}
          onEventPress={id => router.push(`/calendar/${id}`)}
          onSlotPress={() => router.push('/calendar/new')}
        />
      ) : (
        <>
          <View style={styles.selectedDateRow}>
            <Text style={[styles.selectedDateLabel, { color: colors.foreground }]}>
              {isViewingToday
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
                subtitle="Tap + to add, or swipe to another day"
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
  todayPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },
  todayPillText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
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
  dayCell: { width: '14.28%', alignItems: 'center', paddingVertical: 3, minHeight: 52 },
  dayInner: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  weekNavRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dayStrip: { flex: 1, marginBottom: 2 },
  dayStripContent: { paddingHorizontal: 2, gap: 4 },
  stripDay: { alignItems: 'center', paddingHorizontal: 6, minWidth: 40 },
  stripDayName: { fontSize: 11, fontFamily: 'Inter_500Medium', marginBottom: 4 },
  stripDayNum: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  stripDayNumText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  dayNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  dayNavLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  dayNavSub: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 1 },
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
