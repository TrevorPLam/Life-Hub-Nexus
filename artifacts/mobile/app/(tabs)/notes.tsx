import React, { useState } from 'react';
import { FlatList, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useNotes } from '@/context/NotesContext';
import { NoteCard } from '@/components/notes/NoteCard';
import { EmptyState } from '@/components/ui/EmptyState';

const FOLDER_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F97316', '#F43F5E', '#14B8A6', '#F59E0B', '#6366F1'];

export default function NotesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { notes, folders, searchNotes, getNotesForFolder, addFolder } = useNotes();
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);

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
            {/* New folder chip */}
            <TouchableOpacity onPress={() => setShowNewFolder(true)}
              style={[styles.folderChip, { borderColor: colors.border, borderStyle: 'dashed' }]}>
              <Feather name="plus" size={11} color={colors.mutedForeground} />
              <Text style={[styles.folderChipText, { color: colors.mutedForeground }]}>New</Text>
            </TouchableOpacity>
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

      {/* New Folder Modal */}
      <Modal visible={showNewFolder} transparent animationType="slide" onRequestClose={() => setShowNewFolder(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowNewFolder(false)} />
        <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Folder</Text>

          <TextInput
            style={[styles.folderNameInput, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]}
            placeholder="Folder name..."
            placeholderTextColor={colors.mutedForeground}
            value={newFolderName}
            onChangeText={setNewFolderName}
            autoFocus
          />

          <Text style={[styles.colorLabel, { color: colors.mutedForeground }]}>COLOR</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
            {FOLDER_COLORS.map(c => (
              <TouchableOpacity key={c} onPress={() => setNewFolderColor(c)}
                style={[styles.colorDot, { backgroundColor: c, borderWidth: newFolderColor === c ? 2.5 : 0, borderColor: '#fff', marginRight: 10 }]} />
            ))}
          </ScrollView>

          <View style={styles.modalBtns}>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.muted }]} onPress={() => setShowNewFolder(false)}>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: newFolderName.trim() ? newFolderColor : colors.muted }]}
              onPress={() => {
                if (!newFolderName.trim()) return;
                addFolder({ name: newFolderName.trim(), color: newFolderColor });
                setNewFolderName('');
                setNewFolderColor(FOLDER_COLORS[0]);
                setShowNewFolder(false);
              }}
            >
              <Text style={{ color: newFolderName.trim() ? '#fff' : colors.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, padding: 20, paddingBottom: 44 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  folderNameInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: 'Inter_400Regular', marginBottom: 16 },
  colorLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, marginBottom: 10 },
  colorScroll: { marginBottom: 20 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  folderDot: { width: 7, height: 7, borderRadius: 3.5 },
  folderChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  list: { flex: 1 },
  listContent: { padding: 16, flexGrow: 1 },
});
