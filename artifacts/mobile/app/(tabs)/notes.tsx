import React, { useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useNotes } from '@/context/NotesContext';
import { NoteCard } from '@/components/notes/NoteCard';
import { EmptyState } from '@/components/ui/EmptyState';

export default function NotesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { notes, folders, searchNotes, getNotesForFolder } = useNotes();
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const displayNotes = search.length > 1
    ? searchNotes(search)
    : getNotesForFolder(selectedFolder || undefined);

  const sortedNotes = [...displayNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Notes</Text>
          <TouchableOpacity onPress={() => router.push('/notes/new')} style={[styles.addBtn, { backgroundColor: colors.notes }]}>
            <Feather name="edit-3" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search notes..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Folder filter */}
        {!search && (
          <View style={styles.foldersRow}>
            <TouchableOpacity onPress={() => setSelectedFolder(null)}
              style={[styles.folderChip, !selectedFolder && { backgroundColor: `${colors.notes}20`, borderColor: `${colors.notes}40` }, { borderColor: colors.border }]}>
              <Text style={[styles.folderChipText, { color: !selectedFolder ? colors.notes : colors.mutedForeground }]}>All</Text>
            </TouchableOpacity>
            {folders.map(f => (
              <TouchableOpacity key={f.id} onPress={() => setSelectedFolder(selectedFolder === f.id ? null : f.id)}
                style={[styles.folderChip, { borderColor: selectedFolder === f.id ? `${f.color}40` : colors.border, backgroundColor: selectedFolder === f.id ? `${f.color}20` : 'transparent' }]}>
                <View style={[styles.folderDot, { backgroundColor: f.color }]} />
                <Text style={[styles.folderChipText, { color: selectedFolder === f.id ? f.color : colors.mutedForeground }]}>{f.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <FlatList
        data={sortedNotes}
        keyExtractor={n => n.id}
        renderItem={({ item }) => {
          const folder = folders.find(f => f.id === item.folderId);
          return (
            <NoteCard note={item} accentColor={folder?.color || colors.notes}
              onPress={() => router.push(`/notes/${item.id}`)} />
          );
        }}
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingBottom: Platform.OS === 'web' ? 100 : 120 }]}
        ListEmptyComponent={
          <EmptyState
            icon="file-text"
            title={search ? 'No results' : 'No notes yet'}
            subtitle={search ? 'Try a different search' : 'Start writing your thoughts'}
            actionLabel={!search ? 'New Note' : undefined}
            onAction={!search ? () => router.push('/notes/new') : undefined}
            accentColor={colors.notes}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, height: 40, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', padding: 0 },
  foldersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  folderChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  folderDot: { width: 7, height: 7, borderRadius: 3.5 },
  folderChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  list: { flex: 1 },
  listContent: { padding: 16, flexGrow: 1 },
});
