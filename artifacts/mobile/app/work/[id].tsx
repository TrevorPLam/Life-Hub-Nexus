import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useWork, TaskStatus } from '@/context/WorkContext';
import { TaskItem } from '@/components/work/TaskItem';
import { LinkedItems } from '@/components/ui/LinkedItems';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { DatePickerModal } from '@/components/ui/DatePickerModal';

const STATUS_OPTIONS: { key: TaskStatus; label: string; icon: string; color: string }[] = [
  { key: 'todo', label: 'To Do', icon: 'circle', color: '#6B7280' },
  { key: 'in-progress', label: 'In Progress', icon: 'loader', color: '#3B82F6' },
  { key: 'done', label: 'Done', icon: 'check-circle', color: '#10B981' },
];

export default function TaskDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTask, updateTask, deleteTask, getSubtasks, linkItem, unlinkItem, addTask } = useWork();

  const task = getTask(id as string);
  const subtasks = getSubtasks(id as string);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(task?.title || '');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descVal, setDescVal] = useState(task?.description || '');
  const [newSubtask, setNewSubtask] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.mutedForeground }}>Task not found</Text>
      </View>
    );
  }

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const dueDateStr = dueDate ? dueDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) : 'Set due date';
  const isOverdue = dueDate && dueDate < new Date() && task.status !== 'done';

  const handleDelete = () => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteTask(task.id); router.back(); } },
    ]);
  };

  const handleStatusChange = (status: TaskStatus) => {
    updateTask(task.id, {
      status,
      completedAt: status === 'done' ? new Date().toISOString() : undefined,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    addTask({ title: newSubtask.trim(), description: '', status: 'todo', priority: 'medium', parentId: task.id, subtaskIds: [], tags: [], linkedEventIds: [], linkedNoteIds: [], linkedPersonIds: [], linkedTransactionIds: [] });
    setNewSubtask('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const deleteButton = (
    <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <Feather name="trash-2" size={18} color={colors.destructive} />
    </TouchableOpacity>
  );

  // Format date to YYYY-MM-DD for DatePickerModal
  const dueDateISO = dueDate
    ? `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`
    : (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; })();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Task" rightElement={deleteButton} />
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === 'web' ? 60 : 80 }]}>

          {/* 3-state Status Picker */}
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map(opt => {
              const isActive = task.status === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => handleStatusChange(opt.key)}
                  style={[
                    styles.statusBtn,
                    { borderColor: isActive ? opt.color : `${opt.color}30`, backgroundColor: isActive ? `${opt.color}18` : 'transparent' },
                  ]}
                >
                  <Feather name={opt.icon as any} size={14} color={isActive ? opt.color : colors.mutedForeground} />
                  <Text style={[styles.statusBtnText, { color: isActive ? opt.color : colors.mutedForeground }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Title */}
          {isEditingTitle ? (
            <TextInput
              style={[styles.titleInput, { color: colors.foreground, borderBottomColor: colors.work }]}
              value={titleVal}
              onChangeText={setTitleVal}
              onBlur={() => { setIsEditingTitle(false); if (titleVal.trim()) updateTask(task.id, { title: titleVal.trim() }); }}
              autoFocus
              multiline
            />
          ) : (
            <TouchableOpacity onPress={() => setIsEditingTitle(true)}>
              <Text style={[styles.title, { color: colors.foreground, textDecorationLine: task.status === 'done' ? 'line-through' : 'none', opacity: task.status === 'done' ? 0.5 : 1 }]}>
                {task.title}
              </Text>
            </TouchableOpacity>
          )}

          {/* Meta card */}
          <View style={[styles.metaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Priority */}
            <View style={styles.metaRow}>
              <Feather name="flag" size={14} color={colors.mutedForeground} />
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Priority</Text>
              <View style={styles.metaValueRow}>
                {(['low', 'medium', 'high'] as const).map(p => {
                  const pc = p === 'high' ? '#EF4444' : p === 'medium' ? '#F97316' : '#6B7280';
                  return (
                    <TouchableOpacity key={p} onPress={() => { updateTask(task.id, { priority: p }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                      style={[styles.priorityBtn, { backgroundColor: task.priority === p ? `${pc}20` : colors.muted, borderWidth: 1, borderColor: task.priority === p ? pc : 'transparent' }]}>
                      <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: task.priority === p ? pc : colors.mutedForeground, textTransform: 'capitalize' }}>{p}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Due date — tappable */}
            <TouchableOpacity style={styles.metaRow} onPress={() => setShowDatePicker(true)}>
              <Feather name="clock" size={14} color={isOverdue ? colors.destructive : colors.mutedForeground} />
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Due</Text>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[styles.metaValue, { color: isOverdue ? colors.destructive : task.dueDate ? colors.foreground : colors.mutedForeground }]}>
                  {dueDateStr}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Feather name="edit-2" size={12} color={colors.mutedForeground} />
                  {task.dueDate && (
                    <TouchableOpacity onPress={() => { updateTask(task.id, { dueDate: undefined }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Feather name="x" size={14} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {task.tags.length > 0 && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.metaRow}>
                  <Feather name="tag" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Tags</Text>
                  <Text style={[styles.metaValue, { color: colors.foreground }]}>{task.tags.join(', ')}</Text>
                </View>
              </>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Notes</Text>
            {isEditingDesc ? (
              <TextInput
                style={[styles.descInput, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]}
                value={descVal}
                onChangeText={setDescVal}
                onBlur={() => { setIsEditingDesc(false); updateTask(task.id, { description: descVal }); }}
                multiline
                autoFocus
                textAlignVertical="top"
              />
            ) : (
              <TouchableOpacity onPress={() => setIsEditingDesc(true)} style={[styles.descTap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.descText, { color: task.description ? colors.foreground : colors.mutedForeground }]}>
                  {task.description || 'Add notes...'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Subtasks */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Subtasks ({subtasks.length})</Text>
            {subtasks.length > 0 && (
              <View style={[styles.subtaskList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {subtasks.map(sub => (
                  <TaskItem key={sub.id} task={sub} compact
                    onPress={() => router.push(`/work/${sub.id}`)}
                    onToggle={() => { updateTask(sub.id, { status: sub.status !== 'done' ? 'done' : 'todo', completedAt: sub.status !== 'done' ? new Date().toISOString() : undefined }); }} />
                ))}
              </View>
            )}
            <View style={[styles.addSubtaskRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <TextInput
                style={[styles.addSubtaskInput, { color: colors.foreground }]}
                value={newSubtask}
                onChangeText={setNewSubtask}
                placeholder="Add subtask..."
                placeholderTextColor={colors.mutedForeground}
                onSubmitEditing={handleAddSubtask}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={handleAddSubtask} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="plus-circle" size={20} color={colors.work} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Links */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Links</Text>
            <LinkedItems
              linkedTaskIds={[]}
              linkedEventIds={task.linkedEventIds}
              linkedNoteIds={task.linkedNoteIds}
              linkedPersonIds={task.linkedPersonIds}
              onLink={(type, itemId) => linkItem(task.id, type as any, itemId)}
              onUnlink={(type, itemId) => unlinkItem(task.id, type as any, itemId)}
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Due date picker */}
      <DatePickerModal
        visible={showDatePicker}
        value={dueDateISO}
        onConfirm={iso => {
          const [y, m, d] = iso.split('-').map(Number);
          const picked = new Date(y, m - 1, d, 12, 0, 0);
          updateTask(task.id, { dueDate: picked.toISOString() });
          setShowDatePicker(false);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onDismiss={() => setShowDatePicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  kav: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statusBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
  statusBtnText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, lineHeight: 34, marginBottom: 16 },
  titleInput: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, lineHeight: 34, marginBottom: 16, borderBottomWidth: 2, paddingBottom: 4 },
  metaCard: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, marginBottom: 20, overflow: 'hidden' },
  metaRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  metaLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', width: 60 },
  metaValue: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1 },
  metaValueRow: { flex: 1, flexDirection: 'row', gap: 6 },
  priorityBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 10 },
  descTap: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 14, minHeight: 80 },
  descText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  descInput: { borderRadius: 12, borderWidth: 1, padding: 14, minHeight: 100, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  subtaskList: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: 8 },
  addSubtaskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  addSubtaskInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', padding: 0 },
});
