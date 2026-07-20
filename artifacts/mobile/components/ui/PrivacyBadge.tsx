import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PrivacyLevel } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

interface PrivacyBadgeProps {
  level: PrivacyLevel;
  onPress?: () => void;
  compact?: boolean;
}

const PRIVACY_META: Record<PrivacyLevel, { icon: string; label: string; color: string }> = {
  public:  { icon: 'globe',   label: 'Public',  color: '#10B981' },
  friends: { icon: 'users',   label: 'Friends', color: '#F97316' },
  private: { icon: 'lock',    label: 'Private', color: '#EF4444' },
};

export function PrivacyBadge({ level, onPress, compact = false }: PrivacyBadgeProps) {
  const colors = useColors();
  const meta = PRIVACY_META[level];

  const content = (
    <View style={[
      styles.badge,
      { backgroundColor: `${meta.color}15`, borderColor: `${meta.color}30` },
      compact && styles.badgeCompact,
    ]}>
      <Feather name={meta.icon as any} size={compact ? 10 : 11} color={meta.color} />
      {!compact && <Text style={[styles.label, { color: meta.color }]}>{meta.label}</Text>}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>{content}</TouchableOpacity>;
  }
  return content;
}

/** Cycles through privacy levels: public → friends → private → public */
export function cyclePrivacy(current: PrivacyLevel): PrivacyLevel {
  const order: PrivacyLevel[] = ['public', 'friends', 'private'];
  const next = (order.indexOf(current) + 1) % order.length;
  return order[next];
}

/** Icon-only pill for showing on the profile view */
export function PrivacyIcon({ level }: { level: PrivacyLevel }) {
  const meta = PRIVACY_META[level];
  return <Feather name={meta.icon as any} size={12} color={meta.color} />;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeCompact: {
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
});
