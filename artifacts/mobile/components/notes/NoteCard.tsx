import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Note } from '@/context/NotesContext';

interface NoteCardProps {
  note: Note;
  onPress: () => void;
  accentColor?: string;
}

export function NoteCard({ note, onPress, accentColor }: NoteCardProps) {
  const colors = useColors();
  const preview = note.content.replace(/#{1,6}\s/g, '').replace(/\*\*/g, '').replace(/\n/g, ' ').trim().slice(0, 120);
  const updatedAt = new Date(note.updatedAt);
  const isToday = updatedAt.toDateString() === new Date().toDateString();
  const dateStr = isToday ? updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : updatedAt.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]} onPress={onPress} activeOpacity={0.8}>
      {note.isPinned && (
        <View style={[styles.pin, { backgroundColor: accentColor ? `${accentColor}20` : colors.muted }]}>
          <Feather name="bookmark" size={11} color={accentColor || colors.mutedForeground} />
        </View>
      )}
      <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>{note.title || 'Untitled'}</Text>
      {preview ? <Text style={[styles.preview, { color: colors.mutedForeground }]} numberOfLines={2}>{preview}</Text> : null}
      <View style={styles.footer}>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>{dateStr}</Text>
        <View style={styles.tags}>
          {note.tags.slice(0, 2).map(tag => (
            <View key={tag} style={[styles.tag, { backgroundColor: colors.muted }]}>
              <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pin: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 6 },
  title: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  preview: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, marginBottom: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  tags: { flexDirection: 'row', gap: 4 },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
});
