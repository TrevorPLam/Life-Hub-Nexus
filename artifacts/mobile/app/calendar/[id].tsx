import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useCalendar } from '@/context/CalendarContext';
import { usePeople } from '@/context/PeopleContext';
import { Avatar } from '@/components/ui/Avatar';

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
  const dateStr = start.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = event.allDay ? 'All day' : `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const duration = event.allDay ? null : Math.round((end.getTime() - start.getTime()) / 60000);
  const durationStr = duration ? (duration < 60 ? `${duration} min` : `${Math.floor(duration / 60)}h ${duration % 60 ? `${duration % 60}m` : ''}`) : null;

  const handleDelete = () => {
    Alert.alert('Delete Event', 'Delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteEvent(event.id); router.back(); } },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={[styles.content, { paddingBottom: 80 }]}>
      {/* Color bar */}
      <View style={[styles.colorHeader, { backgroundColor: `${event.color}20` }]}>
        <View style={[styles.colorStripe, { backgroundColor: event.color }]} />
        <Text style={[styles.title, { color: colors.foreground }]}>{event.title}</Text>
        <View style={styles.timeRow}>
          <Feather name="clock" size={14} color={event.color} />
          <Text style={[styles.timeText, { color: event.color }]}>{timeStr}</Text>
          {durationStr && <Text style={[styles.duration, { color: colors.mutedForeground }]}>· {durationStr}</Text>}
        </View>
      </View>

      {/* Date */}
      <View style={[styles.metaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.metaRow}>
          <View style={[styles.metaIcon, { backgroundColor: `${event.color}15` }]}>
            <Feather name="calendar" size={16} color={event.color} />
          </View>
          <View>
            <Text style={[styles.metaTitle, { color: colors.foreground }]}>{dateStr}</Text>
            <Text style={[styles.metaSub, { color: colors.mutedForeground }]}>{timeStr}{durationStr ? ` · ${durationStr}` : ''}</Text>
          </View>
        </View>
      </View>

      {/* Description */}
      {event.description ? (
        <View style={[styles.descCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.descLabel, { color: colors.mutedForeground }]}>Notes</Text>
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
              <TouchableOpacity key={pid} style={[styles.personRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/people/${pid}`)}>
                <Avatar name={person.name} color={person.avatarColor} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.personName, { color: colors.foreground }]}>{person.name}</Text>
                  <Text style={[styles.personRole, { color: colors.mutedForeground }]}>{person.role}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Delete */}
      <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: `${colors.destructive}12` }]} onPress={handleDelete}>
        <Feather name="trash-2" size={16} color={colors.destructive} />
        <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>Delete Event</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  colorHeader: { borderRadius: 14, padding: 18, marginBottom: 12, overflow: 'hidden' },
  colorStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', marginBottom: 8, marginLeft: 10 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 10 },
  timeText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  duration: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  metaCard: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  metaIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  metaTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  metaSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  descCard: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 14, marginBottom: 12 },
  descLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, marginBottom: 6 },
  descText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 10 },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, marginBottom: 8 },
  personName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  personRole: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, marginTop: 8 },
  deleteBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
