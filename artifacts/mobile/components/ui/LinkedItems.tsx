import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useWork } from '@/context/WorkContext';
import { useCalendar } from '@/context/CalendarContext';
import { useNotes } from '@/context/NotesContext';
import { usePeople } from '@/context/PeopleContext';

type LinkType = 'task' | 'event' | 'note' | 'person';

interface LinkedItemsProps {
  linkedTaskIds?: string[];
  linkedEventIds?: string[];
  linkedNoteIds?: string[];
  linkedPersonIds?: string[];
  onLink?: (type: LinkType, id: string) => void;
  onUnlink?: (type: LinkType, id: string) => void;
}

function Chip({ label, color, icon, onRemove }: { label: string; color: string; icon: string; onRemove?: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.chip, { backgroundColor: `${color}18`, borderColor: `${color}40`, borderRadius: colors.radius / 1.5 }]}>
      <Feather name={icon as any} size={11} color={color} />
      <Text style={[styles.chipLabel, { color }]} numberOfLines={1}>{label}</Text>
      {onRemove && (
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="x" size={11} color={color} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export function LinkedItems({ linkedTaskIds = [], linkedEventIds = [], linkedNoteIds = [], linkedPersonIds = [], onLink, onUnlink }: LinkedItemsProps) {
  const colors = useColors();
  const { tasks } = useWork();
  const { events } = useCalendar();
  const { notes } = useNotes();
  const { people } = usePeople();
  const [modal, setModal] = useState<LinkType | null>(null);

  const linkedTasks = tasks.filter(t => linkedTaskIds.includes(t.id));
  const linkedEvents = events.filter(e => linkedEventIds.includes(e.id));
  const linkedNotes = notes.filter(n => linkedNoteIds.includes(n.id));
  const linkedPeople = people.filter(p => linkedPersonIds.includes(p.id));

  const hasLinks = linkedTasks.length + linkedEvents.length + linkedNotes.length + linkedPeople.length > 0;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getModalItems = () => {
    if (modal === 'task') return tasks.filter(t => !linkedTaskIds.includes(t.id));
    if (modal === 'event') return events.filter(e => !linkedEventIds.includes(e.id));
    if (modal === 'note') return notes.filter(n => !linkedNoteIds.includes(n.id));
    if (modal === 'person') return people.filter(p => !linkedPersonIds.includes(p.id));
    return [];
  };

  const getModalLabel = (item: any) => {
    if (modal === 'task') return item.title;
    if (modal === 'event') return `${item.title} · ${formatTime(item.startDate)}`;
    if (modal === 'note') return item.title;
    if (modal === 'person') return item.name;
    return '';
  };

  return (
    <View>
      {hasLinks && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={styles.chipsContent}>
          {linkedTasks.map(t => (
            <Chip key={t.id} label={t.title} color={colors.work} icon="check-circle"
              onRemove={onUnlink ? () => onUnlink('task', t.id) : undefined} />
          ))}
          {linkedEvents.map(e => (
            <Chip key={e.id} label={e.title} color={colors.calendar} icon="calendar"
              onRemove={onUnlink ? () => onUnlink('event', e.id) : undefined} />
          ))}
          {linkedNotes.map(n => (
            <Chip key={n.id} label={n.title} color={colors.notes} icon="file-text"
              onRemove={onUnlink ? () => onUnlink('note', n.id) : undefined} />
          ))}
          {linkedPeople.map(p => (
            <Chip key={p.id} label={p.name} color={colors.people} icon="user"
              onRemove={onUnlink ? () => onUnlink('person', p.id) : undefined} />
          ))}
        </ScrollView>
      )}

      {onLink && (
        <View style={styles.addRow}>
          <Text style={[styles.addLabel, { color: colors.mutedForeground }]}>Link to</Text>
          {(['task', 'event', 'note', 'person'] as LinkType[]).map(type => {
            const icons: Record<LinkType, string> = { task: 'check-circle', event: 'calendar', note: 'file-text', person: 'user' };
            const moduleColors = { task: colors.work, event: colors.calendar, note: colors.notes, person: colors.people };
            const c = moduleColors[type];
            return (
              <TouchableOpacity key={type} onPress={() => setModal(type)}
                style={[styles.addBtn, { backgroundColor: `${c}15`, borderColor: `${c}30`, borderRadius: colors.radius / 2 }]}>
                <Feather name={icons[type] as any} size={14} color={c} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Modal visible={modal !== null} transparent animationType="slide" onRequestClose={() => setModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Link a {modal}
              </Text>
              <TouchableOpacity onPress={() => setModal(null)}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={getModalItems()}
              keyExtractor={(item: any) => item.id}
              renderItem={({ item }: { item: any }) => (
                <TouchableOpacity style={[styles.modalItem, { borderBottomColor: colors.border }]}
                  onPress={() => { onLink?.(modal!, item.id); setModal(null); }}>
                  <Text style={[styles.modalItemText, { color: colors.foreground }]}>{getModalLabel(item)}</Text>
                  <Feather name="plus" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No items to link</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { marginBottom: 8 },
  chipsContent: { paddingBottom: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, marginRight: 6, borderWidth: 1 },
  chipLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', maxWidth: 100 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  addBtn: { padding: 8, borderWidth: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 16, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.2)' },
  modalTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  modalItemText: { fontSize: 15, fontFamily: 'Inter_400Regular', flex: 1 },
  emptyText: { textAlign: 'center', padding: 24, fontFamily: 'Inter_400Regular' },
});
