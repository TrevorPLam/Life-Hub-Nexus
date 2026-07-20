import React, { useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { usePeople, InteractionType } from '@/context/PeopleContext';
import { Avatar } from '@/components/ui/Avatar';
import { useWork } from '@/context/WorkContext';
import { TaskItem } from '@/components/work/TaskItem';

const INTERACTION_TYPES: { key: InteractionType; icon: string; label: string }[] = [
  { key: 'meeting', icon: 'users', label: 'Meeting' },
  { key: 'call', icon: 'phone', label: 'Call' },
  { key: 'message', icon: 'message-circle', label: 'Message' },
  { key: 'email', icon: 'mail', label: 'Email' },
  { key: 'note', icon: 'edit-3', label: 'Note' },
];

export default function PersonDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPerson, deletePerson, addInteraction } = usePeople();
  const { tasks, toggleComplete } = useWork();

  const person = getPerson(id as string);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [intType, setIntType] = useState<InteractionType>('meeting');
  const [intDesc, setIntDesc] = useState('');

  if (!person) return <View style={[styles.container, { backgroundColor: colors.background }]} />;

  const linkedTasks = tasks.filter(t => person.linkedTaskIds.includes(t.id));

  const today = new Date();
  const birthdayParts = person.birthday ? person.birthday.split('-') : null;
  const birthdayStr = birthdayParts ? new Date(2000, parseInt(birthdayParts[0]) - 1, parseInt(birthdayParts[1])).toLocaleDateString([], { month: 'long', day: 'numeric' }) : null;

  const daysSince = person.lastInteractionDate
    ? Math.floor((Date.now() - new Date(person.lastInteractionDate).getTime()) / 86400000)
    : null;

  const handleDelete = () => {
    Alert.alert('Remove Contact', 'Remove this person from your contacts?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { deletePerson(person.id); router.back(); } },
    ]);
  };

  const handleAddInteraction = () => {
    if (!intDesc.trim()) return;
    addInteraction(person.id, { type: intType, description: intDesc.trim(), date: new Date().toISOString() });
    setIntDesc('');
    setShowInteractionModal(false);
  };

  const getInteractionIcon = (type: InteractionType) => INTERACTION_TYPES.find(t => t.key === type)?.icon || 'circle';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === 'web' ? 80 : 100 }]}>

        {/* Profile header */}
        <View style={[styles.profileHeader, { backgroundColor: `${person.avatarColor}12` }]}>
          <Avatar name={person.name} color={person.avatarColor} size={80} />
          <Text style={[styles.name, { color: colors.foreground }]}>{person.name}</Text>
          {(person.role || person.company) && (
            <Text style={[styles.roleCompany, { color: colors.mutedForeground }]}>{[person.role, person.company].filter(Boolean).join(' · ')}</Text>
          )}

          {/* Action buttons */}
          <View style={styles.actionBtns}>
            {person.phone ? (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: `${person.avatarColor}20` }]}>
                <Feather name="phone" size={18} color={person.avatarColor} />
                <Text style={[styles.actionBtnText, { color: person.avatarColor }]}>Call</Text>
              </TouchableOpacity>
            ) : null}
            {person.email ? (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: `${person.avatarColor}20` }]}>
                <Feather name="mail" size={18} color={person.avatarColor} />
                <Text style={[styles.actionBtnText, { color: person.avatarColor }]}>Email</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: `${person.avatarColor}20` }]} onPress={() => setShowInteractionModal(true)}>
              <Feather name="edit-3" size={18} color={person.avatarColor} />
              <Text style={[styles.actionBtnText, { color: person.avatarColor }]}>Log</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact info */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {person.email ? <InfoRow icon="mail" label={person.email} /> : null}
          {person.phone ? <InfoRow icon="phone" label={person.phone} /> : null}
          {birthdayStr ? <InfoRow icon="gift" label={`Birthday · ${birthdayStr}`} /> : null}
          {daysSince !== null ? (
            <InfoRow icon="clock" label={`Last contact · ${daysSince === 0 ? 'Today' : `${daysSince} days ago`}`} accent={person.stayInTouchDays && daysSince > person.stayInTouchDays ? colors.social : undefined} />
          ) : null}
          {person.notes ? <InfoRow icon="file-text" label={person.notes} /> : null}
        </View>

        {/* Linked tasks */}
        {linkedTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Linked Tasks</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {linkedTasks.map(t => (
                <TaskItem key={t.id} task={t} compact
                  onPress={() => router.push(`/work/${t.id}`)}
                  onToggle={() => toggleComplete(t.id)} />
              ))}
            </View>
          </View>
        )}

        {/* Interaction log */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Interaction Log</Text>
            <TouchableOpacity onPress={() => setShowInteractionModal(true)}>
              <Feather name="plus" size={18} color={colors.people} />
            </TouchableOpacity>
          </View>
          {person.interactions.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No interactions logged yet</Text>
          ) : (
            person.interactions.map(int => (
              <View key={int.id} style={[styles.intRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.intIcon, { backgroundColor: `${person.avatarColor}15` }]}>
                  <Feather name={getInteractionIcon(int.type) as any} size={14} color={person.avatarColor} />
                </View>
                <View style={styles.intContent}>
                  <Text style={[styles.intDesc, { color: colors.foreground }]}>{int.description}</Text>
                  <Text style={[styles.intDate, { color: colors.mutedForeground }]}>
                    {new Date(int.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Delete */}
        <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: `${colors.destructive}12` }]} onPress={handleDelete}>
          <Feather name="user-x" size={16} color={colors.destructive} />
          <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>Remove Contact</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Log interaction modal */}
      <Modal visible={showInteractionModal} transparent animationType="slide" onRequestClose={() => setShowInteractionModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Log Interaction</Text>
            <View style={styles.intTypeRow}>
              {INTERACTION_TYPES.map(t => (
                <TouchableOpacity key={t.key} onPress={() => setIntType(t.key)}
                  style={[styles.intTypeBtn, { backgroundColor: intType === t.key ? `${colors.people}20` : colors.muted }]}>
                  <Feather name={t.icon as any} size={14} color={intType === t.key ? colors.people : colors.mutedForeground} />
                  <Text style={[styles.intTypeBtnText, { color: intType === t.key ? colors.people : colors.mutedForeground }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.intDescInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="What happened?"
              placeholderTextColor={colors.mutedForeground}
              value={intDesc}
              onChangeText={setIntDesc}
              multiline
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowInteractionModal(false)} style={[styles.modalCancel, { borderColor: colors.border }]}>
                <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddInteraction} style={[styles.modalConfirm, { backgroundColor: colors.people }]}>
                <Text style={{ color: '#fff', fontFamily: 'Inter_600SemiBold' }}>Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoRow({ icon, label, accent }: { icon: string; label: string; accent?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <Feather name={icon as any} size={14} color={accent || colors.mutedForeground} />
      <Text style={[styles.infoLabel, { color: accent || colors.foreground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  profileHeader: { borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 12 },
  name: { fontSize: 24, fontFamily: 'Inter_700Bold', marginTop: 14, marginBottom: 4 },
  roleCompany: { fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 16 },
  actionBtns: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20 },
  actionBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  infoLabel: { fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 20 },
  section: { marginBottom: 16 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingVertical: 20 },
  intRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, marginBottom: 8 },
  intIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  intContent: { flex: 1 },
  intDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  intDate: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, marginTop: 8 },
  deleteBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  intTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  intTypeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16 },
  intTypeBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  intDescInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, padding: 12, minHeight: 80, fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 14 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  modalConfirm: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
});
