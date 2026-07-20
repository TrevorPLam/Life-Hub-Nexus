import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useWork, TaskPriority, TaskStatus } from '@/context/WorkContext';

export default function NewTaskScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addTask } = useWork();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [tag, setTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const handleCreate = () => {
    if (!title.trim()) return;
    addTask({ title: title.trim(), description, priority, status, subtaskIds: [], tags, linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [] });
    router.back();
  };

  const addTag = () => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags(prev => [...prev, tag.trim()]);
      setTag('');
    }
  };

  const PRIORITIES: { key: TaskPriority; color: string }[] = [
    { key: 'low', color: '#6B7280' },
    { key: 'medium', color: '#F97316' },
    { key: 'high', color: '#EF4444' },
  ];

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: 16, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancel, { color: colors.mutedForeground }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Task</Text>
        <TouchableOpacity onPress={handleCreate} disabled={!title.trim()}
          style={[styles.createBtn, { backgroundColor: title.trim() ? colors.work : colors.muted }]}>
          <Text style={[styles.createBtnText, { color: title.trim() ? '#fff' : colors.mutedForeground }]}>Create</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Title */}
        <TextInput
          style={[styles.titleInput, { color: colors.foreground, borderBottomColor: colors.border }]}
          placeholder="Task title"
          placeholderTextColor={colors.mutedForeground}
          value={title}
          onChangeText={setTitle}
          autoFocus
          returnKeyType="next"
          multiline
        />

        {/* Description */}
        <TextInput
          style={[styles.descInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
          placeholder="Add notes..."
          placeholderTextColor={colors.mutedForeground}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />

        {/* Priority */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Priority</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map(p => (
              <TouchableOpacity key={p.key} onPress={() => setPriority(p.key)}
                style={[styles.priorityBtn, { backgroundColor: priority === p.key ? `${p.color}20` : colors.muted, borderColor: priority === p.key ? p.color : 'transparent', borderWidth: 1 }]}>
                <Text style={[styles.priorityBtnText, { color: priority === p.key ? p.color : colors.mutedForeground }]}>
                  {p.key.charAt(0).toUpperCase() + p.key.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Status */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Status</Text>
          <View style={styles.priorityRow}>
            {([
              { key: 'todo' as TaskStatus, label: 'To Do', color: '#6B7280' },
              { key: 'in-progress' as TaskStatus, label: 'In Progress', color: '#3B82F6' },
            ]).map(s => (
              <TouchableOpacity key={s.key} onPress={() => setStatus(s.key)}
                style={[styles.priorityBtn, { backgroundColor: status === s.key ? `${s.color}20` : colors.muted, borderColor: status === s.key ? s.color : 'transparent', borderWidth: 1 }]}>
                <Text style={[styles.priorityBtnText, { color: status === s.key ? s.color : colors.mutedForeground }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tags */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Tags</Text>
          <View style={styles.tagInput}>
            <TextInput
              style={[styles.tagField, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
              placeholder="Add tag..."
              placeholderTextColor={colors.mutedForeground}
              value={tag}
              onChangeText={setTag}
              onSubmitEditing={addTag}
              returnKeyType="done"
            />
          </View>
          {tags.length > 0 && (
            <View style={styles.tagsRow}>
              {tags.map(t => (
                <TouchableOpacity key={t} style={[styles.tagChip, { backgroundColor: `${colors.work}20` }]}
                  onPress={() => setTags(prev => prev.filter(x => x !== t))}>
                  <Text style={[styles.tagChipText, { color: colors.work }]}>{t} ×</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  cancel: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  createBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  createBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  titleInput: { fontSize: 22, fontFamily: 'Inter_700Bold', marginBottom: 16, borderBottomWidth: 1, paddingBottom: 12 },
  descInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, padding: 14, minHeight: 100, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, marginBottom: 20 },
  field: { marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  priorityBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  tagInput: {},
  tagField: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 8 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  tagChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
});
