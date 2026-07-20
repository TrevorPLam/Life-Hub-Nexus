import React, { useRef, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { CalendarEvent } from '@/context/CalendarContext';

const HOUR_HEIGHT = 60; // px per hour
const LABEL_WIDTH = 52; // width of the time label column
const TOTAL_HOURS = 24;
const TOTAL_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT;

const HOURS_LABELS = Array.from({ length: TOTAL_HOURS }, (_, i) => {
  if (i === 0) return '12 AM';
  if (i < 12) return `${i} AM`;
  if (i === 12) return '12 PM';
  return `${i - 12} PM`;
});

/** Compute layout for overlapping events in the time grid */
function layoutEvents(events: CalendarEvent[]) {
  const timed = events.filter(e => !e.allDay);
  const sorted = [...timed].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  // Assign each event a column within its overlap cluster
  const columns: CalendarEvent[][] = [];
  const eventMeta = new Map<string, { col: number; numCols: number }>();

  for (const event of sorted) {
    const eStart = new Date(event.startDate).getTime();
    const eEnd = new Date(event.endDate).getTime();

    let placed = false;
    for (let c = 0; c < columns.length; c++) {
      const colLastEnd = new Date(columns[c][columns[c].length - 1].endDate).getTime();
      if (eStart >= colLastEnd) {
        columns[c].push(event);
        eventMeta.set(event.id, { col: c, numCols: 1 }); // numCols updated below
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([event]);
      eventMeta.set(event.id, { col: columns.length - 1, numCols: 1 });
    }
  }

  // For each event, find max columns among all events it overlaps with
  for (const event of sorted) {
    const eStart = new Date(event.startDate).getTime();
    const eEnd = new Date(event.endDate).getTime();
    const meta = eventMeta.get(event.id)!;

    let maxCol = meta.col;
    for (const other of sorted) {
      if (other.id === event.id) continue;
      const oStart = new Date(other.startDate).getTime();
      const oEnd = new Date(other.endDate).getTime();
      const overlaps = eStart < oEnd && eEnd > oStart;
      if (overlaps) {
        const otherMeta = eventMeta.get(other.id)!;
        maxCol = Math.max(maxCol, otherMeta.col);
      }
    }

    eventMeta.set(event.id, { ...meta, numCols: maxCol + 1 });
  }

  return { sorted, eventMeta };
}

function timeToY(date: Date): number {
  return (date.getHours() + date.getMinutes() / 60) * HOUR_HEIGHT;
}

interface TimeGridProps {
  events: CalendarEvent[];
  date: Date;
  calendarColor: string;
  onEventPress: (id: string) => void;
  onSlotPress: (time: Date) => void;
}

export function TimeGrid({ events, date, calendarColor, onEventPress, onSlotPress }: TimeGridProps) {
  const colors = useColors();
  const scrollRef = useRef<ScrollView>(null);

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const currentTimeY = isToday ? timeToY(now) : -1;

  // Scroll to current time or 8am on mount
  useEffect(() => {
    const scrollTo = isToday ? Math.max(0, currentTimeY - HOUR_HEIGHT * 2) : HOUR_HEIGHT * 8;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: scrollTo, animated: false });
    }, 100);
  }, [date.toDateString()]);

  const allDayEvents = events.filter(e => e.allDay);
  const { sorted: timedEvents, eventMeta } = layoutEvents(events);

  const handleSlotPress = useCallback(
    (hourIndex: number) => {
      const slotTime = new Date(date);
      slotTime.setHours(hourIndex, 0, 0, 0);
      onSlotPress(slotTime);
    },
    [date, onSlotPress],
  );

  return (
    <View style={styles.wrapper}>
      {/* All-day banner */}
      {allDayEvents.length > 0 && (
        <View style={[styles.allDayBanner, { borderBottomColor: colors.border }]}>
          <Text style={[styles.allDayLabel, { color: colors.mutedForeground }]}>ALL DAY</Text>
          <View style={styles.allDayEvents}>
            {allDayEvents.map(e => (
              <TouchableOpacity
                key={e.id}
                onPress={() => onEventPress(e.id)}
                style={[styles.allDayChip, { backgroundColor: `${e.color}25`, borderColor: `${e.color}50` }]}
              >
                <Text style={[styles.allDayChipText, { color: e.color }]} numberOfLines={1}>
                  {e.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Time grid */}
      <ScrollView ref={scrollRef} style={styles.grid} showsVerticalScrollIndicator={false}>
        <View style={{ height: TOTAL_HEIGHT, position: 'relative' }}>
          {/* Hour rows */}
          {HOURS_LABELS.map((label, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.6}
              onPress={() => handleSlotPress(i)}
              style={[styles.hourRow, { top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }]}
            >
              <Text style={[styles.hourLabel, { color: colors.mutedForeground }]}>{label}</Text>
              <View style={[styles.hourLine, { backgroundColor: colors.border }]} />
            </TouchableOpacity>
          ))}

          {/* Events */}
          {timedEvents.map(event => {
            const start = new Date(event.startDate);
            const end = new Date(event.endDate);
            const top = timeToY(start);
            const durationMs = end.getTime() - start.getTime();
            const durationMin = durationMs / 60000;
            const height = Math.max((durationMin / 60) * HOUR_HEIGHT, 24);

            const meta = eventMeta.get(event.id) ?? { col: 0, numCols: 1 };
            const colWidth = (100 / meta.numCols);
            const left = LABEL_WIDTH + (meta.col * colWidth * (100 - LABEL_WIDTH)) / 100;
            // Simplified: divide remaining width by columns
            const eventWidth = `${100 / meta.numCols}%` as any;
            const eventLeft = LABEL_WIDTH + (meta.col * (100 - LABEL_WIDTH)) / meta.numCols;

            return (
              <TouchableOpacity
                key={event.id}
                onPress={() => onEventPress(event.id)}
                activeOpacity={0.8}
                style={[
                  styles.event,
                  {
                    top: top + 1,
                    height: height - 2,
                    left: eventLeft,
                    right: `${((meta.numCols - meta.col - 1) * (100 - LABEL_WIDTH)) / meta.numCols}%` as any,
                    backgroundColor: `${event.color}22`,
                    borderLeftColor: event.color,
                  },
                ]}
              >
                <Text style={[styles.eventTitle, { color: event.color }]} numberOfLines={height > 40 ? 2 : 1}>
                  {event.title}
                </Text>
                {height > 36 && (
                  <Text style={[styles.eventTime, { color: event.color }]} numberOfLines={1}>
                    {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {' – '}
                    {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Current time indicator */}
          {currentTimeY > 0 && (
            <View style={[styles.nowLine, { top: currentTimeY }]} pointerEvents="none">
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
  allDayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  allDayLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, width: LABEL_WIDTH - 12 },
  allDayEvents: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  allDayChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  allDayChipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
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
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    textAlign: 'right',
    paddingRight: 8,
    marginTop: -6,
  },
  hourLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    marginTop: 0,
  },
  event: {
    position: 'absolute',
    borderLeftWidth: 3,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  eventTitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold', lineHeight: 16 },
  eventTime: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 2 },
  nowLine: {
    position: 'absolute',
    left: LABEL_WIDTH - 4,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nowDot: { width: 8, height: 8, borderRadius: 4, marginRight: 0 },
  nowBar: { flex: 1, height: 1.5 },
});
