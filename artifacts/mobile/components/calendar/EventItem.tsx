import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { CalendarEvent } from '@/context/CalendarContext';

interface EventItemProps {
  event: CalendarEvent;
  onPress: () => void;
}

export function EventItem({ event, onPress }: EventItemProps) {
  const colors = useColors();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const timeStr = event.allDay ? 'All day' : `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const duration = event.allDay ? null : Math.round((end.getTime() - start.getTime()) / 60000);

  return (
    <TouchableOpacity style={[styles.row, { borderRadius: colors.radius, backgroundColor: colors.card }]} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.colorBar, { backgroundColor: event.color }]} />
      <View style={styles.timeCol}>
        <Text style={[styles.time, { color: event.color }]}>{event.allDay ? 'All' : start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        {!event.allDay && <Text style={[styles.timeEnd, { color: colors.mutedForeground }]}>{end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>}
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>{event.title}</Text>
        {event.description ? <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={1}>{event.description}</Text> : null}
        {duration && <Text style={[styles.duration, { color: colors.mutedForeground }]}>{duration < 60 ? `${duration}min` : `${Math.floor(duration / 60)}h ${duration % 60 ? `${duration % 60}m` : ''}`}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 8,
    overflow: 'hidden',
  },
  colorBar: { width: 4, borderRadius: 2, marginRight: 12 },
  timeCol: { width: 52, paddingVertical: 12, justifyContent: 'center' },
  time: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  timeEnd: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  content: { flex: 1, paddingVertical: 12, paddingRight: 12 },
  title: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  desc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  duration: { fontSize: 11, fontFamily: 'Inter_400Regular' },
});
