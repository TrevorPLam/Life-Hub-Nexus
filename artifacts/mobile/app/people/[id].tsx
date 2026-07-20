import React, { useState, useEffect } from 'react';
import {
  Alert,
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
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
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

function formatBirthday(mmdd: string): string {
  const [mm, dd] = mmdd.split('-');
  if (!mm || !dd) return mmdd;
  const d = new Date(2000, parseInt(mm) - 1, parseInt(dd));
  return d.toLocaleDateString([], { month: 'long', day: 'numeric' });
}

export default function PersonDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPerson, deletePerson, addInteraction } = usePeople();
  const { tasks, toggleComplete } = useWork();
  const navigation = useNavigation();

  const person = getPerson(id as string);

  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [intType, setIntType] = useState<InteractionType>('meeting');
  const [intDesc, setIntDesc] = useState('');

  // Wire edit button into native header
  useEffect(() => {
    if (!person) return;
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => router.push(`/people/new?id=${person.id}`)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ marginRight: Platform.OS === 'ios' ? 0 : 8 }}
        >
          <Feather name="edit-2" size={18} color={colors.people} />
        </TouchableOpacity>
      ),
    });
  }, [person?.id, colors.people, navigation]);

  if (!person) return <View style={[styles.container, { backgroundColor: colors.background }]} />;

  const linkedTasks = tasks.filter(t => person.linkedTaskIds.includes(t.id));

  const birthdayStr = person.birthday ? formatBirthday(person.birthday) : null;

  const daysSince = person.lastInteractionDate
    ? Math.floor((Date.now() - new Date(person.lastInteractionDate).getTime()) / 86400000)
    : null;

  const isOverdue = !!(person.stayInTouchDays && daysSince !== null && daysSince > person.stayInTouchDays);

  const handleDelete = () => {
    Alert.alert('Remove Contact', 'Remove this person from your contacts?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          deletePerson(person.id);
          router.back();
        },
      },
    ]);
  };

  const handleAddInteraction = () => {
    if (!intDesc.trim()) return;
    addInteraction(person.id, {
      type: intType,
      description: intDesc.trim(),
      date: new Date().toISOString(),
    });
    setIntDesc('');
    setShowInteractionModal(false);
  };

  const getInteractionIcon = (type: InteractionType) =>
    INTERACTION_TYPES.find(t => t.key === type)?.icon || 'circle';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === 'web' ? 80 : 100 },
        ]}
      >
        {/* Profile hero */}
        <View style={[styles.profileHeader, { backgroundColor: `${person.avatarColor}12` }]}>
          <Avatar name={person.name} color={person.avatarColor} size={80} />
          <Text style={[styles.name, { color: colors.foreground }]}>{person.name}</Text>
          {(person.role || person.company) && (
            <Text style={[styles.roleCompany, { color: colors.mutedForeground }]}>
              {[person.role, person.company].filter(Boolean).join(' · ')}
            </Text>
          )}

          {/* Quick action buttons */}
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
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: `${person.avatarColor}20` }]}
              onPress={() => setShowInteractionModal(true)}
            >
              <Feather name="edit-3" size={18} color={person.avatarColor} />
              <Text style={[styles.actionBtnText, { color: person.avatarColor }]}>Log</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stay-in-touch status */}
        {person.stayInTouchDays > 0 && (
          <View
            style={[
              styles.touchStatus,
              {
                backgroundColor: isOverdue ? `${colors.social}12` : `${colors.people}10`,
                borderColor: isOverdue ? `${colors.social}30` : `${colors.people}25`,
              },
            ]}
          >
            <Feather
              name={isOverdue ? 'alert-circle' : 'clock'}
              size={14}
              color={isOverdue ? colors.social : colors.people}
            />
            <Text style={[styles.touchStatusText, { color: isOverdue ? colors.social : colors.people }]}>
              {isOverdue
                ? `Overdue — last contact ${daysSince}d ago (every ${person.stayInTouchDays}d)`
                : daysSince === 0
                ? `Contacted today · check in every ${person.stayInTouchDays}d`
                : `${daysSince}d since last contact · every ${person.stayInTouchDays}d`}
            </Text>
          </View>
        )}

        {/* Contact info card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {person.email ? <InfoRow icon="mail" label={person.email} /> : null}
          {person.phone ? <InfoRow icon="phone" label={person.phone} /> : null}
          {birthdayStr ? <InfoRow icon="gift" label={`Birthday · ${birthdayStr}`} /> : null}
          {person.notes ? <InfoRow icon="file-text" label={person.notes} last /> : null}
        </View>

        {/* Linked tasks */}
        {linkedTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Linked Tasks</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {linkedTasks.map(t => (
                <TaskItem
                  key={t.id}
                  task={t}
                  compact
                  onPress={() => router.push(`/work/${t.id}`)}
                  onToggle={() => toggleComplete(t.id)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Interaction log */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Interaction Log</Text>
            <TouchableOpacity
              onPress={() => setShowInteractionModal(true)}
              style={[styles.logBtn, { backgroundColor: `${colors.people}15`, borderColor: `${colors.people}30` }]}
            >
              <Feather name="plus" size={13} color={colors.people} />
              <Text style={[styles.logBtnText, { color: colors.people }]}>Log</Text>
            </TouchableOpacity>
          </View>
          {person.interactions.length === 0 ? (
            <View style={[styles.emptyInteractions, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="message-square" size={24} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No interactions logged yet</Text>
              <TouchableOpacity onPress={() => setShowInteractionModal(true)}>
                <Text style={[styles.emptyAction, { color: colors.people }]}>Log your first interaction</Text>
              </TouchableOpacity>
            </View>
          ) : (
            person.interactions.map((int, idx) => (
              <View
                key={int.id}
                style={[
                  styles.intRow,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  idx < person.interactions.length - 1 && styles.intRowGap,
                ]}
              >
                <View style={[styles.intIcon, { backgroundColor: `${person.avatarColor}15` }]}>
                  <Feather name={getInteractionIcon(int.type) as any} size={14} color={person.avatarColor} />
                </View>
                <View style={styles.intContent}>
                  <View style={styles.intHeader}>
                    <Text style={[styles.intType, { color: colors.mutedForeground }]}>
                      {INTERACTION_TYPES.find(t => t.key === int.type)?.label}
                    </Text>
                    <Text style={[styles.intDate, { color: colors.mutedForeground }]}>
                      {new Date(int.date).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <Text style={[styles.intDesc, { color: colors.foreground }]}>{int.description}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Delete */}
        <TouchableOpacity
          style={[styles.deleteBtn, { backgroundColor: `${colors.destructive}10`, borderColor: `${colors.destructive}25` }]}
          onPress={handleDelete}
        >
          <Feather name="user-x" size={16} color={colors.destructive} />
          <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>Remove Contact</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Log interaction modal */}
      <Modal
        visible={showInteractionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInteractionModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowInteractionModal(false)}
        />
        <View style={[styles.modalContent, { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Log Interaction</Text>

          {/* Type selector */}
          <View style={styles.intTypeRow}>
            {INTERACTION_TYPES.map(t => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setIntType(t.key)}
                style={[
                  styles.intTypeBtn,
                  {
                    backgroundColor: intType === t.key ? `${colors.people}18` : colors.muted,
                    borderColor: intType === t.key ? colors.people : 'transparent',
                    borderWidth: 1.5,
                  },
                ]}
              >
                <Feather
                  name={t.icon as any}
                  size={14}
                  color={intType === t.key ? colors.people : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.intTypeBtnText,
                    { color: intType === t.key ? colors.people : colors.mutedForeground },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[
              styles.intDescInput,
              { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
            ]}
            placeholder="What happened?"
            placeholderTextColor={colors.mutedForeground}
            value={intDesc}
            onChangeText={setIntDesc}
            multiline
            textAlignVertical="top"
            autoFocus
          />
          <View style={styles.modalActions}>
            <TouchableOpacity
              onPress={() => setShowInteractionModal(false)}
              style={[styles.modalCancel, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAddInteraction}
              disabled={!intDesc.trim()}
              style={[
                styles.modalConfirm,
                { backgroundColor: intDesc.trim() ? colors.people : colors.muted },
              ]}
            >
              <Text
                style={{
                  color: intDesc.trim() ? '#fff' : colors.mutedForeground,
                  fontFamily: 'Inter_600SemiBold',
                }}
              >
                Log
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  accent,
  last,
}: {
  icon: string;
  label: string;
  accent?: string;
  last?: boolean;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.infoRow,
        { borderBottomColor: colors.border },
        last && styles.infoRowLast,
      ]}
    >
      <Feather name={icon as any} size={14} color={accent || colors.mutedForeground} />
      <Text style={[styles.infoLabel, { color: accent || colors.foreground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, gap: 0 },
  profileHeader: { borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 10 },
  name: { fontSize: 24, fontFamily: 'Inter_700Bold', marginTop: 14, marginBottom: 4 },
  roleCompany: { fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 16 },
  actionBtns: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  actionBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  touchStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  touchStatusText: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1 },

  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 20 },

  section: { marginBottom: 16 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  logBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  emptyInteractions: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    paddingVertical: 28,
    gap: 6,
  },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  emptyAction: { fontSize: 14, fontFamily: 'Inter_500Medium', marginTop: 2 },

  intRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  intRowGap: { marginBottom: 8 },
  intIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  intContent: { flex: 1 },
  intHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  intType: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.4 },
  intDate: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  intDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 19 },

  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  deleteBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  intTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  intTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  intTypeBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  intDescInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 14,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  modalConfirm: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
});
