import React, { useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useWork, Task, TaskStatus } from '@/context/WorkContext';
import { TaskItem } from '@/components/work/TaskItem';
import { EmptyState } from '@/components/ui/EmptyState';

type Filter = 'all' | 'inprogress' | 'today' | 'priority' | 'done';

export default function WorkScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getRootTasks, toggleComplete } = useWork();
  const [filter, setFilter] = useState<Filter>('all');

  const allTasks = getRootTasks();

  const filteredTasks = allTasks.filter(task => {
    if (filter === 'done') return task.status === 'done';
    if (filter === 'all') return task.status !== 'done';
    if (filter === 'inprogress') return task.status === 'in-progress';
    if (filter === 'today') {
      if (!task.dueDate) return false;
      return new Date(task.dueDate).toDateString() === new Date().toDateString() && task.status !== 'done';
    }
    if (filter === 'priority') return task.priority === 'high' && task.status !== 'done';
    return true;
  });

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const inProgressCount = allTasks.filter(t => t.status === 'in-progress').length;

  const FILTERS: { key: Filter; label: string; badge?: number }[] = [
    { key: 'all', label: 'Active' },
    { key: 'inprogress', label: 'In Progress', badge: inProgressCount || undefined },
    { key: 'today', label: 'Today' },
    { key: 'priority', label: 'Priority' },
    { key: 'done', label: 'Done' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Work</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>{allTasks.filter(t => t.status !== 'done').length} active tasks</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/work/new')} style={[styles.addBtn, { backgroundColor: colors.work }]}>
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f.key} style={[styles.filterTab, filter === f.key && { borderBottomColor: colors.work, borderBottomWidth: 2 }]}
              onPress={() => setFilter(f.key)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text style={[styles.filterText, { color: filter === f.key ? colors.work : colors.mutedForeground }]}>{f.label}</Text>
                {f.badge ? (
                  <View style={{ backgroundColor: `${colors.work}25`, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 }}>
                    <Text style={{ fontSize: 10, fontFamily: 'Inter_600SemiBold', color: colors.work }}>{f.badge}</Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={t => t.id}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onPress={() => router.push(`/work/${item.id}`)}
            onToggle={() => toggleComplete(item.id)}
          />
        )}
        style={[styles.list, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.listContent, { paddingBottom: Platform.OS === 'web' ? 100 : 120 }]}
        ListEmptyComponent={
          <EmptyState
            icon="check-circle"
            title={filter === 'done' ? 'No completed tasks' : 'No tasks here'}
            subtitle={filter === 'all' ? 'Add your first task to get started' : 'Try a different filter'}
            actionLabel={filter === 'all' ? 'Add Task' : undefined}
            onAction={filter === 'all' ? () => router.push('/work/new') : undefined}
            accentColor={colors.work}
          />
        }
        ItemSeparatorComponent={() => null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 0, borderBottomWidth: StyleSheet.hairlineWidth },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  filterRow: { flexDirection: 'row' },
  filterTab: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filterText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  list: { flex: 1 },
  listContent: { flexGrow: 1 },
});
