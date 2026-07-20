import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface TagProps {
  label: string;
  color?: string;
  onRemove?: () => void;
  small?: boolean;
}

export function Tag({ label, color, onRemove, small }: TagProps) {
  const colors = useColors();
  const bg = color ? `${color}22` : colors.muted;
  const textColor = color || colors.mutedForeground;

  return (
    <View style={[styles.tag, { backgroundColor: bg, borderRadius: colors.radius / 1.5 }, small && styles.small]}>
      <Text style={[styles.label, { color: textColor }, small && styles.smallLabel]}>{label}</Text>
      {onRemove && (
        <TouchableOpacity onPress={onRemove} style={styles.remove} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Text style={[styles.removeText, { color: textColor }]}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high';
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const color = priority === 'high' ? '#EF4444' : priority === 'medium' ? '#F97316' : '#6B7280';
  return <Tag label={priority} color={color} small />;
}

interface StatusBadgeProps {
  status: 'todo' | 'in-progress' | 'done';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const color = status === 'done' ? '#10B981' : status === 'in-progress' ? '#3B82F6' : '#6B7280';
  const label = status === 'in-progress' ? 'In Progress' : status === 'todo' ? 'To Do' : 'Done';
  return <Tag label={label} color={color} small />;
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 4,
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.2,
  },
  smallLabel: {
    fontSize: 10,
  },
  remove: {
    marginLeft: 4,
  },
  removeText: {
    fontSize: 14,
    lineHeight: 14,
  },
});
