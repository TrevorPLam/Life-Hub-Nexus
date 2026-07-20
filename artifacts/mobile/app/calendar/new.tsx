import React, { useState, useEffect } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useCalendar, Recurrence } from '@/context/CalendarContext';
import { usePeople } from '@/context/PeopleContext';
import { useWork } from '@/context/WorkContext';
import { Avatar } from '@/components/ui/Avatar';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { TimePickerModal } from '@/components/ui/TimePickerModal';

const EVENT_COLORS = ['#3B82F6', '#F97316', '#10B981', '#8B5CF6', '#F43F5E', '#14B8A6', '#F59E0B', '#6366F1'];
const RECURRENCES: { value: Recurrence; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
];

/** Format a date to "YYYY-MM-DD" for DatePickerModal */
function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Apply a "YYYY-MM-DD" string to a Date (preserve time) */
function applyDateStr(base: Date, str: string): Date {
  const [y, m, day] = str.split('-').map(Number);
  const result = new Date(base);
  result.setFullYear(y, m - 1, day);
  return result;
}

function nextRoundedHour(offset = 1): Date {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + offset);
  return d;
}

export default function NewEventScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id: editId } = useLocalSearchParams<{ id?: string }>();
  const { addEvent, updateEvent, getEvent } = useCalendar();
  const { people } = usePeople();
  const { tasks } = useWork();

  const existing = editId ? getEvent(editId) : undefined;

  // ── Core fields ──────────────────────────────────────────────────────────
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [color, setColor] = useState(existing?.color ?? EVENT_COLORS[0]);
  const [allDay, setAllDay] = useState(existing?.allDay ?? false);
  const [recurrence, setRecurrence] = useState<Recurrence>(existing?.recurrence ?? 'none');
  const [linkedPersonIds, setLinkedPersonIds] = useState<string[]>(existing?.linkedPersonIds ?? []);
  const [linkedTaskIds, setLinkedTaskIds] = useState<string[]>(existing?.linkedTaskIds ?? []);

  // ── Dates ────────────────────────────────────────────────────────────────
  const [startDate, setStartDate] = useState<Date>(
    existing ? new Date(existing.startDate) : nextRoundedHour(1),
  );
  const [endDate, setEndDate] = useState<Date>(
    existing ? new Date(existing.endDate) : nextRoundedHour(2),
  );

  // ── Picker visibility ────────────────────────────────────────────────────
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);
  const [showPeoplePicker, setShowPeoplePicker] = useState(false);
  const [showTaskPicker, setShowTaskPicker] = useState(false);

  const isEditing = !!editId;
  const canSave = title.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const payload = {
      title: title.trim(),
      description,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      allDay,
      color,
      recurrence,
      linkedTaskIds,
      linkedPersonIds,
    };
    if (isEditing && editId) {
      updateEvent(editId, payload);
    } else {
      addEvent(payload);
    }
    router.back();
  };

  const handleDateConfirm = (str: string) => {
    const newStart = applyDateStr(startDate, str);
    // Preserve duration
    const duration = endDate.getTime() - startDate.getTime();
    setStartDate(newStart);
    setEndDate(new Date(newStart.getTime() + duration));
    setShowDatePicker(false);
  };

  const handleStartTimeConfirm = (d: Date) => {
    const newStart = d;
    const duration = Math.max(endDate.getTime() - startDate.getTime(), 30 * 60 * 1000);
    const newEnd = new Date(newStart.getTime() + duration);
    setStartDate(newStart);
    setEndDate(newEnd);
    setShowStartTime(false);
  };

  const handleEndTimeConfirm = (d: Date) => {
    // Ensure end is after start
    if (d.getTime() <= startDate.getTime()) {
      const adjusted = new Date(startDate.getTime() + 30 * 60 * 1000);
      setEndDate(adjusted);
    } else {
      setEndDate(d);
    }
    setShowEndTime(false);
  };

  const fmtDate = (d: Date) =>
    d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const fmtTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const linkedPeople = people.filter(p => linkedPersonIds.includes(p.id));
  const linkedTasks = tasks.filter(t => linkedTaskIds.includes(t.id));
  const availablePeople = people.filter(p => !linkedPersonIds.includes(p.id));
  const availableTasks = tasks.filter(t => !linkedTaskIds.includes(t.id));

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.border, paddingTop: Platform.OS === 'ios' ? insets.top + 12 : 16 },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancel, { color: colors.mutedForeground }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {isEditing ? 'Edit Event' : 'New Event'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave}
          style={[styles.saveBtn, { backgroundColor: canSave ? colors.calendar : colors.muted }]}
        >
          <Text style={[styles.saveBtnText, { color: canSave ? '#fff' : colors.mutedForeground }]}>
            {isEditing ? 'Save' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <TextInput
          style={[styles.titleInput, { color: colors.foreground, borderBottomColor: colors.border }]}
          placeholder="Event title"
          placeholderTextColor={colors.mutedForeground}
          value={title}
          onChangeText={setTitle}
          autoFocus={!isEditing}
        />

        {/* Description */}
        <TextInput
          style={[
            styles.descInput,
            { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card },
          ]}
          placeholder="Add description..."
          placeholderTextColor={colors.mutedForeground}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />

        {/* Date + Time card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Date row */}
          <TouchableOpacity style={styles.cardRow} onPress={() => setShowDatePicker(true)}>
            <View style={[styles.cardIcon, { backgroundColor: `${colors.calendar}18` }]}>
              <Feather name="calendar" size={16} color={colors.calendar} />
            </View>
            <Text style={[styles.cardLabel, { color: colors.foreground }]}>{fmtDate(startDate)}</Text>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* All-day toggle */}
          <TouchableOpacity style={styles.cardRow} onPress={() => setAllDay(p => !p)}>
            <View style={[styles.cardIcon, { backgroundColor: `${colors.calendar}18` }]}>
              <Feather name="sun" size={16} color={colors.calendar} />
            </View>
            <Text style={[styles.cardLabel, { color: colors.foreground }]}>All day</Text>
            <View style={[styles.toggle, { backgroundColor: allDay ? colors.calendar : colors.muted }]}>
              <View style={[styles.knob, { left: allDay ? 18 : 2 }]} />
            </View>
          </TouchableOpacity>

          {!allDay && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Start time */}
              <TouchableOpacity style={styles.cardRow} onPress={() => setShowStartTime(true)}>
                <View style={[styles.cardIcon, { backgroundColor: `${colors.calendar}18` }]}>
                  <Feather name="clock" size={16} color={colors.calendar} />
                </View>
                <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Start</Text>
                <Text style={[styles.cardValue, { color: colors.foreground }]}>{fmtTime(startDate)}</Text>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* End time */}
              <TouchableOpacity style={styles.cardRow} onPress={() => setShowEndTime(true)}>
                <View style={[styles.cardIcon, { backgroundColor: `${colors.calendar}18` }]}>
                  <Feather name="clock" size={16} color={colors.calendar} />
                </View>
                <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>End</Text>
                <Text style={[styles.cardValue, { color: colors.foreground }]}>{fmtTime(endDate)}</Text>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Recurrence */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>REPEAT</Text>
          <View style={styles.pills}>
            {RECURRENCES.map(r => {
              const active = recurrence === r.value;
              return (
                <TouchableOpacity
                  key={r.value}
                  onPress={() => setRecurrence(r.value)}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: active ? `${colors.calendar}22` : colors.card,
                      borderColor: active ? colors.calendar : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: active ? colors.calendar : colors.mutedForeground },
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Color */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>COLOR</Text>
          <View style={styles.colorRow}>
            {EVENT_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.colorDot,
                  {
                    backgroundColor: c,
                    borderWidth: color === c ? 3 : 0,
                    borderColor: '#fff',
                    transform: [{ scale: color === c ? 1.15 : 1 }],
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* People */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PEOPLE</Text>
            {availablePeople.length > 0 && (
              <TouchableOpacity onPress={() => setShowPeoplePicker(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="user-plus" size={16} color={colors.people} />
              </TouchableOpacity>
            )}
          </View>
          {linkedPeople.length === 0 ? (
            <TouchableOpacity
              onPress={() => setShowPeoplePicker(true)}
              style={[styles.emptyLink, { borderColor: colors.border }]}
            >
              <Feather name="user-plus" size={14} color={colors.mutedForeground} />
              <Text style={[styles.emptyLinkText, { color: colors.mutedForeground }]}>Add people</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.chips}>
              {linkedPeople.map(p => (
                <View key={p.id} style={[styles.personChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Avatar name={p.name} color={p.avatarColor} size={22} />
                  <Text style={[styles.chipText, { color: colors.foreground }]}>{p.name}</Text>
                  <TouchableOpacity
                    onPress={() => setLinkedPersonIds(ids => ids.filter(i => i !== p.id))}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="x" size={13} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ))}
              {availablePeople.length > 0 && (
                <TouchableOpacity
                  onPress={() => setShowPeoplePicker(true)}
                  style={[styles.addChip, { borderColor: colors.people }]}
                >
                  <Feather name="plus" size={13} color={colors.people} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>LINKED TASKS</Text>
            {availableTasks.length > 0 && (
              <TouchableOpacity onPress={() => setShowTaskPicker(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="plus-circle" size={16} color={colors.work} />
              </TouchableOpacity>
            )}
          </View>
          {linkedTasks.length === 0 ? (
            <TouchableOpacity
              onPress={() => setShowTaskPicker(true)}
              style={[styles.emptyLink, { borderColor: colors.border }]}
            >
              <Feather name="check-circle" size={14} color={colors.mutedForeground} />
              <Text style={[styles.emptyLinkText, { color: colors.mutedForeground }]}>Link tasks</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.taskList}>
              {linkedTasks.map(t => (
                <View key={t.id} style={[styles.taskChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="check-circle" size={13} color={colors.work} />
                  <Text style={[styles.taskChipText, { color: colors.foreground }]} numberOfLines={1}>
                    {t.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setLinkedTaskIds(ids => ids.filter(i => i !== t.id))}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="x" size={13} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ))}
              {availableTasks.length > 0 && (
                <TouchableOpacity
                  onPress={() => setShowTaskPicker(true)}
                  style={[styles.addChip, { borderColor: colors.work }]}
                >
                  <Feather name="plus" size={13} color={colors.work} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Preview */}
        <View style={[styles.preview, { backgroundColor: `${color}15`, borderColor: `${color}30` }]}>
          <View style={[styles.previewBar, { backgroundColor: color }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.previewTitle, { color: colors.foreground }]}>{title || 'Event title'}</Text>
            <Text style={[styles.previewTime, { color }]}>
              {allDay
                ? `All day · ${fmtDate(startDate)}`
                : `${fmtTime(startDate)} – ${fmtTime(endDate)} · ${startDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Pickers */}
      <DatePickerModal
        visible={showDatePicker}
        title="Select Date"
        value={toDateStr(startDate)}
        onConfirm={handleDateConfirm}
        onDismiss={() => setShowDatePicker(false)}
      />
      <TimePickerModal
        visible={showStartTime}
        title="Start Time"
        value={startDate}
        onConfirm={handleStartTimeConfirm}
        onDismiss={() => setShowStartTime(false)}
      />
      <TimePickerModal
        visible={showEndTime}
        title="End Time"
        value={endDate}
        onConfirm={handleEndTimeConfirm}
        onDismiss={() => setShowEndTime(false)}
      />

      {/* People picker modal */}
      <Modal visible={showPeoplePicker} transparent animationType="slide" onRequestClose={() => setShowPeoplePicker(false)}>
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerSheet, { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.pickerTitle, { color: colors.foreground }]}>Add person</Text>
              <TouchableOpacity onPress={() => setShowPeoplePicker(false)}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={availablePeople}
              keyExtractor={p => p.id}
              renderItem={({ item: p }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setLinkedPersonIds(ids => [...ids, p.id]);
                    setShowPeoplePicker(false);
                  }}
                >
                  <Avatar name={p.name} color={p.avatarColor} size={32} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickerItemName, { color: colors.foreground }]}>{p.name}</Text>
                    {p.role ? <Text style={[styles.pickerItemSub, { color: colors.mutedForeground }]}>{p.role}</Text> : null}
                  </View>
                  <Feather name="plus" size={16} color={colors.people} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={[styles.pickerEmpty, { color: colors.mutedForeground }]}>No more people to add</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Task picker modal */}
      <Modal visible={showTaskPicker} transparent animationType="slide" onRequestClose={() => setShowTaskPicker(false)}>
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerSheet, { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.pickerTitle, { color: colors.foreground }]}>Link task</Text>
              <TouchableOpacity onPress={() => setShowTaskPicker(false)}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={availableTasks}
              keyExtractor={t => t.id}
              renderItem={({ item: t }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setLinkedTaskIds(ids => [...ids, t.id]);
                    setShowTaskPicker(false);
                  }}
                >
                  <Feather name="check-circle" size={18} color={colors.work} />
                  <Text style={[styles.pickerItemName, { color: colors.foreground, flex: 1 }]} numberOfLines={1}>
                    {t.title}
                  </Text>
                  <Feather name="plus" size={16} color={colors.work} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={[styles.pickerEmpty, { color: colors.mutedForeground }]}>No tasks to link</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancel: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 16 },
  titleInput: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 4,
  },
  descInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 14,
    minHeight: 72,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  cardValue: { fontSize: 15, fontFamily: 'Inter_500Medium', marginRight: 4 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  toggle: { width: 42, height: 24, borderRadius: 12, justifyContent: 'center', position: 'relative' },
  knob: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', top: 2 },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.6 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  colorRow: { flexDirection: 'row', gap: 12 },
  colorDot: { width: 30, height: 30, borderRadius: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  personChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  taskList: { gap: 6 },
  taskChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  taskChipText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  addChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
  },
  emptyLinkText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  preview: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  previewBar: { width: 4, height: '100%', borderRadius: 2, minHeight: 36 },
  previewTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 3 },
  previewTime: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  // Picker modals
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 16, maxHeight: '60%' },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerItemName: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  pickerItemSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  pickerEmpty: { textAlign: 'center', padding: 24, fontFamily: 'Inter_400Regular' },
});
