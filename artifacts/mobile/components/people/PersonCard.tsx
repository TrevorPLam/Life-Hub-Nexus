import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Person } from '@/context/PeopleContext';
import { Avatar } from '@/components/ui/Avatar';

interface PersonCardProps {
  person: Person;
  onPress: () => void;
}

export function PersonCard({ person, onPress }: PersonCardProps) {
  const colors = useColors();

  const daysSince = person.lastInteractionDate
    ? Math.floor((Date.now() - new Date(person.lastInteractionDate).getTime()) / 86400000)
    : null;

  const isOverdue = person.stayInTouchDays && daysSince !== null && daysSince > person.stayInTouchDays;

  const today = new Date();
  const birthdayParts = person.birthday ? person.birthday.split('-') : null;
  const isUpcomingBirthday = birthdayParts &&
    parseInt(birthdayParts[0]) === today.getMonth() + 1 &&
    Math.abs(parseInt(birthdayParts[1]) - today.getDate()) <= 7;

  return (
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
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
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
    gap: 12,
  },
  content: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  name: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  role: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  lastContact: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  nudgeDot: { width: 7, height: 7, borderRadius: 3.5 },
});
