import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { Task } from '@/context/WorkContext';

interface TaskItemProps {
  task: Task;
  onPress: () => void;
  onToggle: () => void;
  compact?: boolean;
}

export function TaskItem({ task, onPress, onToggle, compact }: TaskItemProps) {
  const colors = useColors();
  const isDone = task.status === 'done';
  const priorityColors = { high: '#EF4444', medium: '#F97316', low: colors.mutedForeground };
  const priorityColor = priorityColors[task.priority];

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date() && !isDone;
  const dueDateStr = dueDate ? dueDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) : null;

  return (
    <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={onPress} activeOpacity={0.7}>
      <TouchableOpacity onPress={handleToggle} style={styles.check} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <View style={[
          styles.checkCircle,
          { borderColor: isDone ? colors.work : `${priorityColor}60`, backgroundColor: isDone ? `${colors.work}22` : 'transparent' }
        ]}>
          {isDone && <Feather name="check" size={12} color={colors.work} />}
        </View>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground, textDecorationLine: isDone ? 'line-through' : 'none', opacity: isDone ? 0.5 : 1 }]} numberOfLines={compact ? 1 : 2}>
          {task.title}
        </Text>
        {!compact && (
          <View style={styles.meta}>
            {task.subtaskIds.length > 0 && (
              <View style={styles.metaItem}>
                <Feather name="git-branch" size={11} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{task.subtaskIds.length}</Text>
              </View>
            )}
            {dueDateStr && (
              <View style={styles.metaItem}>
                <Feather name="clock" size={11} color={isOverdue ? '#EF4444' : colors.mutedForeground} />
                <Text style={[styles.metaText, { color: isOverdue ? '#EF4444' : colors.mutedForeground }]}>{dueDateStr}</Text>
              </View>
            )}
            {task.tags.slice(0, 2).map(tag => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.muted }]}>
                <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} style={styles.chevron} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  check: { marginRight: 12 },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  title: { fontSize: 15, fontFamily: 'Inter_500Medium', marginBottom: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  tag: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  tagText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  priorityDot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 8 },
  chevron: { opacity: 0.4 },
});
