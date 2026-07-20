import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { CalendarEvent } from '@/context/CalendarContext';

const HOUR_HEIGHT = 64; // px per hour
const LABEL_WIDTH = 52; // left column for hour labels
const TOTAL_HOURS = 24;
const TOTAL_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;
const EVENT_GAP = 2; // gap between adjacent columns

const HOUR_LABELS = Array.from({ length: TOTAL_HOURS }, (_, i) => {
  if (i === 0) return '12 AM';
  if (i < 12) return `${i} AM`;
  if (i === 12) return '12 PM';
  return `${i - 12} PM`;
});

// ── Layout algorithm ──────────────────────────────────────────────────────────
//
// 1. Sort timed events by start time.
// 2. Build overlap clusters: a set of events where every pair directly or
//    transitively overlaps.
// 3. Within each cluster, greedily assign the leftmost available column.
// 4. numCols for each event = width of its cluster.
//
interface EventLayout {
  event: CalendarEvent;
  col: number;   // 0-based column index within its cluster
  span: number;  // total columns in the cluster
}

function computeLayout(events: CalendarEvent[]): EventLayout[] {
  const timed = events.filter(e => !e.allDay);
  if (timed.length === 0) return [];

  const sorted = [...timed].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  // Build overlap clusters by sweeping start times
  const clusters: CalendarEvent[][] = [];
  let clusterEnd = -Infinity;
  let currentCluster: CalendarEvent[] = [];

  for (const ev of sorted) {
    const start = new Date(ev.startDate).getTime();
    const end = new Date(ev.endDate).getTime();

    if (start < clusterEnd) {
      currentCluster.push(ev);
      clusterEnd = Math.max(clusterEnd, end);
    } else {
      if (currentCluster.length > 0) clusters.push(currentCluster);
      currentCluster = [ev];
      clusterEnd = end;
    }
  }
  if (currentCluster.length > 0) clusters.push(currentCluster);

  const result: EventLayout[] = [];

  for (const cluster of clusters) {
    // Assign columns within this cluster using a greedy interval approach
    const columns: number[] = []; // columns[i] = end time of last event in column i

    const colAssign = cluster.map(ev => {
      const start = new Date(ev.startDate).getTime();
      const end = new Date(ev.endDate).getTime();
      let col = columns.findIndex(colEnd => start >= colEnd);
      if (col === -1) {
        col = columns.length;
        columns.push(end);
      } else {
        columns[col] = end;
      }
      return col;
    });

    const span = columns.length;
    cluster.forEach((ev, i) => {
      result.push({ event: ev, col: colAssign[i], span });
    });
  }

  return result;
}

function timeToY(date: Date): number {
  return (date.getHours() + date.getMinutes() / 60) * HOUR_HEIGHT;
}

// ── TimeGrid ──────────────────────────────────────────────────────────────────

interface TimeGridProps {
  events: CalendarEvent[];
  date: Date;
  calendarColor: string;
  onEventPress: (id: string) => void;
  onSlotPress: (time: Date) => void;
}

export function TimeGrid({ events, date, calendarColor, onEventPress, onSlotPress }: TimeGridProps) {
  const colors = useColors();
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  // Live current-time — refreshes every 30 seconds
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const isToday = date.toDateString() === now.toDateString();
  const nowY = isToday ? timeToY(now) : -1;

  // Scroll to current time (−2 h) on mount and when date changes
  useEffect(() => {
    const scrollTo = isToday
      ? Math.max(0, nowY - HOUR_HEIGHT * 2)
      : HOUR_HEIGHT * 7; // default to 7 AM
    const t = setTimeout(() => scrollRef.current?.scrollTo({ y: scrollTo, animated: false }), 80);
    return () => clearTimeout(t);
  }, [date.toDateString()]);

  const allDayEvents = events.filter(e => e.allDay);
  const layouts = computeLayout(events);

  // Pixel dimensions for the event area (everything to the right of the label)
  const eventAreaWidth = screenWidth - LABEL_WIDTH;

  const handleSlotPress = useCallback(
    (hour: number) => {
      const t = new Date(date);
      t.setHours(hour, 0, 0, 0);
      onSlotPress(t);
    },
    [date, onSlotPress],
  );

  return (
    <View style={styles.wrapper}>

      {/* All-day banner */}
      {allDayEvents.length > 0 && (
        <View style={[styles.allDayBanner, { borderBottomColor: colors.border }]}>
          <Text style={[styles.allDayLabel, { color: colors.mutedForeground }]}>ALL DAY</Text>
          <View style={styles.allDayList}>
            {allDayEvents.map(e => (
              <TouchableOpacity
                key={e.id}
                onPress={() => onEventPress(e.id)}
                style={[styles.allDayChip, { backgroundColor: `${e.color}25`, borderColor: `${e.color}60` }]}
              >
                <View style={[styles.allDayChipBar, { backgroundColor: e.color }]} />
                <Text style={[styles.allDayChipText, { color: e.color }]} numberOfLines={1}>
                  {e.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Scrollable time grid */}
      <ScrollView ref={scrollRef} style={styles.grid} showsVerticalScrollIndicator={false}>
        <View style={{ height: TOTAL_HEIGHT, position: 'relative' }}>

          {/* Hour rows — tappable to create events */}
          {HOUR_LABELS.map((label, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.5}
              onPress={() => handleSlotPress(i)}
              style={[styles.hourRow, { top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }]}
            >
              <Text style={[styles.hourLabel, { color: colors.mutedForeground }]}>{label}</Text>
              <View style={[styles.hourLine, { backgroundColor: colors.border }]} />
              {/* Half-hour tick */}
              <View
                style={[
                  styles.halfHourLine,
                  {
                    backgroundColor: `${colors.border}60`,
                    top: HOUR_HEIGHT / 2,
                    left: LABEL_WIDTH,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}

          {/* Events */}
          {layouts.map(({ event, col, span }) => {
            const start = new Date(event.startDate);
            const end = new Date(event.endDate);

            const top = timeToY(start);
            const durationMin = (end.getTime() - start.getTime()) / 60_000;
            const height = Math.max((durationMin / 60) * HOUR_HEIGHT, 28);

            // Pixel-accurate column layout
            const colW = (eventAreaWidth / span) - EVENT_GAP;
            const left = LABEL_WIDTH + col * (eventAreaWidth / span) + EVENT_GAP;
            const width = colW - EVENT_GAP;

            const showTime = height >= 42;
            const showTwoLines = height >= 56;

            return (
              <TouchableOpacity
                key={event.id}
                onPress={() => onEventPress(event.id)}
                activeOpacity={0.75}
                style={[
                  styles.event,
                  {
                    top: top + 1,
                    height: height - 2,
                    left,
                    width: Math.max(width, 20),
                    backgroundColor: `${event.color}20`,
                    borderLeftColor: event.color,
                  },
                ]}
              >
                <Text
                  style={[styles.eventTitle, { color: event.color }]}
                  numberOfLines={showTwoLines ? 2 : 1}
                >
                  {event.title}
                </Text>
                {showTime && (
                  <Text style={[styles.eventTime, { color: `${event.color}BB` }]} numberOfLines={1}>
                    {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' – '}
                    {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Current-time line */}
          {nowY > 0 && (
            <View
              style={[styles.nowLine, { top: nowY, left: LABEL_WIDTH - 5 }]}
              pointerEvents="none"
            >
              <View style={[styles.nowDot, { backgroundColor: calendarColor }]} />
              <View style={[styles.nowBar, { backgroundColor: calendarColor }]} />
            </View>
          )}

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },

  // All-day section
  allDayBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  allDayLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.4,
    width: LABEL_WIDTH - 8,
    marginTop: 6,
    textAlign: 'right',
    paddingRight: 6,
  },
  allDayList: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  allDayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingRight: 8,
    borderRadius: 5,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 5,
  },
  allDayChipBar: { width: 3, alignSelf: 'stretch' },
  allDayChipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  // Grid
  grid: { flex: 1 },
  hourRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  hourLabel: {
    width: LABEL_WIDTH,
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
    textAlign: 'right',
    paddingRight: 8,
    marginTop: -6,
    letterSpacing: 0.2,
  },
  hourLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  halfHourLine: {
    position: 'absolute',
    right: 0,
    height: StyleSheet.hairlineWidth,
    width: '70%',
  },

  // Events
  event: {
    position: 'absolute',
    borderLeftWidth: 3,
    borderRadius: 4,
    paddingLeft: 6,
    paddingRight: 4,
    paddingTop: 3,
    overflow: 'hidden',
  },
  eventTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', lineHeight: 15 },
  eventTime: { fontSize: 9, fontFamily: 'Inter_400Regular', marginTop: 1, lineHeight: 13 },

  // Now indicator
  nowLine: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nowDot: { width: 9, height: 9, borderRadius: 5 },
  nowBar: { flex: 1, height: 1.5 },
});
