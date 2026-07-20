import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { Person, InteractionType } from '@/context/PeopleContext';
import { Avatar } from '@/components/ui/Avatar';
import { usePeople } from '@/context/PeopleContext';

const QUICK_TYPES: { key: InteractionType; icon: string }[] = [
  { key: 'call', icon: 'phone' },
  { key: 'message', icon: 'message-circle' },
  { key: 'meeting', icon: 'users' },
  { key: 'email', icon: 'mail' },
];

interface PersonCardProps {
  person: Person;
  onPress: () => void;
}

export function PersonCard({ person, onPress }: PersonCardProps) {
  const colors = useColors();
  const { addInteraction } = usePeople();

  const [showLog, setShowLog] = useState(false);
  const [logType, setLogType] = useState<InteractionType>('call');
  const [logDesc, setLogDesc] = useState('');

  const daysSince = person.lastInteractionDate
    ? Math.floor((Date.now() - new Date(person.lastInteractionDate).getTime()) / 86400000)
    : null;

  const isOverdue = person.stayInTouchDays && daysSince !== null && daysSince > person.stayInTouchDays;

  const today = new Date();
  const birthdayParts = person.birthday ? person.birthday.split('-') : null;
  const isUpcomingBirthday = birthdayParts &&
    parseInt(birthdayParts[0]) === today.getMonth() + 1 &&
    Math.abs(parseInt(birthdayParts[1]) - today.getDate()) <= 7;

  const handleLog = () => {
    addInteraction(person.id, {
      type: logType,
      description: logDesc.trim() || `Quick ${logType}`,
      date: new Date().toISOString(),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLogDesc('');
    setShowLog(false);
  };

  return (
    <>
      <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={onPress} activeOpacity={0.7}>
        <Avatar name={person.name} color={person.avatarColor} size={44} />
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.foreground }]}>{person.name}</Text>
            {isUpcomingBirthday && <Feather name="gift" size={13} color={colors.social} />}
            {isOverdue && <View style={[styles.nudgeDot, { backgroundColor: colors.social }]} />}
          </View>
          <Text style={[styles.role, { color: colors.mutedForeground }]} numberOfLines={1}>
            {[person.role, person.company].filter(Boolean).join(' · ')}
          </Text>
          {daysSince !== null && (
            <Text style={[styles.lastContact, { color: isOverdue ? colors.social : colors.mutedForeground }]}>
              {daysSince === 0 ? 'Contacted today' : `${daysSince}d ago`}
            </Text>
          )}
        </View>

        {/* Quick log button */}
        <TouchableOpacity
          onPress={e => { e.stopPropagation?.(); setShowLog(true); }}
          style={[styles.logBtn, { backgroundColor: isOverdue ? `${colors.people}20` : colors.muted }]}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Feather name="plus" size={14} color={isOverdue ? colors.people : colors.mutedForeground} />
        </TouchableOpacity>

        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>

      {/* Quick interaction modal */}
      <Modal visible={showLog} transparent animationType="slide" onRequestClose={() => setShowLog(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowLog(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Log interaction with {person.name}</Text>

          {/* Type selector */}
          <View style={styles.typeRow}>
            {QUICK_TYPES.map(t => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setLogType(t.key)}
                style={[styles.typeBtn, {
                  backgroundColor: logType === t.key ? `${colors.people}20` : colors.muted,
                  borderWidth: 1,
                  borderColor: logType === t.key ? colors.people : 'transparent',
                }]}
              >
                <Feather name={t.icon as any} size={16} color={logType === t.key ? colors.people : colors.mutedForeground} />
                <Text style={[styles.typeBtnText, { color: logType === t.key ? colors.people : colors.mutedForeground }]}>
                  {t.key.charAt(0).toUpperCase() + t.key.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Optional note */}
          <TextInput
            style={[styles.noteInput, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]}
            placeholder="Add a note (optional)..."
            placeholderTextColor={colors.mutedForeground}
            value={logDesc}
            onChangeText={setLogDesc}
            multiline
          />

          <View style={styles.sheetBtns}>
            <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: colors.muted }]} onPress={() => setShowLog(false)}>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: colors.people }]} onPress={handleLog}>
              <Feather name="check" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>Log</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  content: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  name: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  role: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  lastContact: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  nudgeDot: { width: 7, height: 7, borderRadius: 3.5 },
  logBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, padding: 20, paddingBottom: 40 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 10 },
  typeBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  noteInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, padding: 12, minHeight: 70, fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 16 },
  sheetBtns: { flexDirection: 'row', gap: 10 },
  sheetBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12 },
});
