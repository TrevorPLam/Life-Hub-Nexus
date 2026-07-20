import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useCalendar, Recurrence } from '@/context/CalendarContext';
import { usePeople } from '@/context/PeopleContext';
import { Avatar } from '@/components/ui/Avatar';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

const RECURRENCE_LABELS: Record<Recurrence, string> = {
  none: '',
  daily: 'Repeats daily',
  weekly: 'Repeats weekly',
  biweekly: 'Repeats every 2 weeks',
  monthly: 'Repeats monthly',
};

export default function EventDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEvent, deleteEvent } = useCalendar();
  const { getPerson } = usePeople();
  const event = getEvent(id as string);

  if (!event) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const dateStr = start.toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = event.allDay
    ? 'All day'
    : `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const duration = event.allDay ? null : Math.round((end.getTime() - start.getTime()) / 60000);
  const durationStr = duration
    ? duration < 60
      ? `${duration} min`
      : `${Math.floor(duration / 60)}h${duration % 60 ? ` ${duration % 60}m` : ''}`
    : null;

  const recurrenceLabel = RECURRENCE_LABELS[event.recurrence ?? 'none'];

  const handleDelete = () => {
    Alert.alert('Delete Event', 'Delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteEvent(event.id);
          router.back();
        },
      },
    ]);
  };

  const editButton = (
    <TouchableOpacity
      onPress={() => router.push(`/calendar/new?id=${event.id}`)}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Feather name="edit-2" size={18} color={colors.calendar} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Event" rightElement={editButton} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 80 }]}>
        {/* Color header card */}
        <View style={[styles.colorHeader, { backgroundColor: `${event.color}18` }]}>
          <View style={[styles.colorStripe, { backgroundColor: event.color }]} />
          <View style={styles.colorHeaderBody}>
            <Text style={[styles.title, { color: colors.foreground }]}>{event.title}</Text>
            <View style={styles.timeRow}>
              <Feather name="clock" size={14} color={event.color} />
              <Text style={[styles.timeText, { color: event.color }]}>{timeStr}</Text>
              {durationStr && (
                <Text style={[styles.duration, { color: colors.mutedForeground }]}>· {durationStr}</Text>
              )}
            </View>
            {recurrenceLabel ? (
              <View style={styles.recurrenceRow}>
                <Feather name="refresh-cw" size={12} color={colors.mutedForeground} />
                <Text style={[styles.recurrenceText, { color: colors.mutedForeground }]}>
                  {recurrenceLabel}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Date & time card */}
        <View style={[styles.metaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.metaRow}>
            <View style={[styles.metaIcon, { backgroundColor: `${event.color}15` }]}>
              <Feather name="calendar" size={16} color={event.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.metaTitle, { color: colors.foreground }]}>{dateStr}</Text>
              <Text style={[styles.metaSub, { color: colors.mutedForeground }]}>
                {timeStr}
                {durationStr ? ` · ${durationStr}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {event.description ? (
          <View style={[styles.descCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.descLabel, { color: colors.mutedForeground }]}>NOTES</Text>
            <Text style={[styles.descText, { color: colors.foreground }]}>{event.description}</Text>
          </View>
        ) : null}

        {/* People */}
        {event.linkedPersonIds.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>People</Text>
            {event.linkedPersonIds.map(pid => {
              const person = getPerson(pid);
              if (!person) return null;
              return (
                <TouchableOpacity
                  key={pid}
                  style={[
                    styles.personRow,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                  onPress={() => router.push(`/people/${pid}`)}
                >
                  <Avatar name={person.name} color={person.avatarColor} size={36} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.personName, { color: colors.foreground }]}>{person.name}</Text>
                    <Text style={[styles.personRole, { color: colors.mutedForeground }]}>
                      {person.role}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Delete */}
        <TouchableOpacity
          style={[styles.deleteBtn, { borderColor: `${colors.destructive}40` }]}
          onPress={handleDelete}
        >
          <Feather name="trash-2" size={16} color={colors.destructive} />
          <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>Delete event</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  colorHeader: { borderRadius: 14, padding: 16, flexDirection: 'row', gap: 12, overflow: 'hidden' },
  colorStripe: { width: 4, borderRadius: 2, minHeight: 40 },
  colorHeaderBody: { flex: 1, gap: 6 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', lineHeight: 28 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  duration: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  recurrenceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  recurrenceText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  metaCard: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  metaIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  metaTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  metaSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  descCard: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  descLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, marginBottom: 6 },
  descText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  personName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  personRole: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  deleteBtnText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
});
