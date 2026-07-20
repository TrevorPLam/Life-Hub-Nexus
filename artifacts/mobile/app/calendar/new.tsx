import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useCalendar } from '@/context/CalendarContext';

const EVENT_COLORS = ['#3B82F6', '#F97316', '#10B981', '#8B5CF6', '#F43F5E', '#14B8A6', '#F59E0B', '#6366F1'];

export default function NewEventScreen() {
  const colors = useColors();
  const { addEvent } = useCalendar();

  const now = new Date();
  const roundedHour = new Date(now); roundedHour.setMinutes(0, 0, 0); roundedHour.setHours(now.getHours() + 1);
  const endHour = new Date(roundedHour); endHour.setHours(endHour.getHours() + 1);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(EVENT_COLORS[0]);
  const [allDay, setAllDay] = useState(false);

  const handleCreate = () => {
    if (!title.trim()) return;
    addEvent({
      title: title.trim(),
      description,
      startDate: roundedHour.toISOString(),
      endDate: endHour.toISOString(),
      allDay,
      color,
      linkedTaskIds: [],
      linkedPersonIds: [],
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancel, { color: colors.mutedForeground }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Event</Text>
        <TouchableOpacity onPress={handleCreate} disabled={!title.trim()}
          style={[styles.createBtn, { backgroundColor: title.trim() ? colors.calendar : colors.muted }]}>
          <Text style={[styles.createBtnText, { color: title.trim() ? '#fff' : colors.mutedForeground }]}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TextInput
          style={[styles.titleInput, { color: colors.foreground, borderBottomColor: colors.border }]}
          placeholder="Event title"
          placeholderTextColor={colors.mutedForeground}
          value={title}
          onChangeText={setTitle}
          autoFocus
        />

        <TextInput
          style={[styles.descInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
          placeholder="Add description..."
          placeholderTextColor={colors.mutedForeground}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />

        {/* All day toggle */}
        <TouchableOpacity style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setAllDay(p => !p)}>
          <Text style={[styles.toggleLabel, { color: colors.foreground }]}>All day</Text>
          <View style={[styles.toggle, { backgroundColor: allDay ? colors.calendar : colors.muted }]}>
            <View style={[styles.toggleKnob, { left: allDay ? 18 : 2 }]} />
          </View>
        </TouchableOpacity>

        {/* Color picker */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Color</Text>
          <View style={styles.colorRow}>
            {EVENT_COLORS.map(c => (
              <TouchableOpacity key={c} onPress={() => setColor(c)}
                style={[styles.colorDot, { backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: '#fff', transform: [{ scale: color === c ? 1.1 : 1 }] }]} />
            ))}
          </View>
        </View>

        {/* Time preview */}
        <View style={[styles.timePreview, { backgroundColor: `${color}15`, borderColor: `${color}30` }]}>
          <View style={[styles.colorBar2, { backgroundColor: color }]} />
          <View>
            <Text style={[styles.previewTitle, { color: colors.foreground }]}>{title || 'Event title'}</Text>
            <Text style={[styles.previewTime, { color: color }]}>
              {allDay ? 'All day · ' : `${roundedHour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${endHour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · `}
              {roundedHour.toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  cancel: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  createBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  createBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  titleInput: { fontSize: 22, fontFamily: 'Inter_700Bold', borderBottomWidth: 1, paddingBottom: 12, marginBottom: 16 },
  descInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, padding: 14, minHeight: 80, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, marginBottom: 16 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, marginBottom: 16 },
  toggleLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  toggle: { width: 42, height: 24, borderRadius: 12, justifyContent: 'center' },
  toggleKnob: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', top: 2 },
  field: { marginBottom: 20 },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },
  colorRow: { flexDirection: 'row', gap: 12 },
  colorDot: { width: 30, height: 30, borderRadius: 15 },
  timePreview: { borderRadius: 10, borderWidth: 1, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'center' },
  colorBar2: { width: 4, height: '100%', borderRadius: 2 },
  previewTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 3 },
  previewTime: { fontSize: 12, fontFamily: 'Inter_500Medium' },
});
