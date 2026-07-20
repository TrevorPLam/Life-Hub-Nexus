import React, { useState, useCallback, useRef } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { useColors } from '@/hooks/useColors';
import { useNotes } from '@/context/NotesContext';
import { LinkedItems } from '@/components/ui/LinkedItems';

const FOLDER_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F97316', '#F43F5E', '#14B8A6', '#F59E0B', '#6366F1'];

export default function NoteEditorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const { getNote, addNote, updateNote, deleteNote, folders, addFolder } = useNotes();

  const existingNote = isNew ? null : getNote(id as string);
  const [title, setTitle] = useState(existingNote?.title || '');
  const [content, setContent] = useState(existingNote?.content || '');
  const [folderId, setFolderId] = useState<string | undefined>(existingNote?.folderId);
  const [isPinned, setIsPinned] = useState(existingNote?.isPinned ?? false);
  const [isSaved, setIsSaved] = useState(!isNew);
  const noteIdRef = useRef<string | null>(isNew ? null : (id as string));

  // Folder picker state
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  // New folder state
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);

  const currentFolder = folders.find(f => f.id === folderId);

  const handleSave = useCallback(() => {
    if (!title.trim() && !content.trim()) return;
    if (noteIdRef.current) {
      updateNote(noteIdRef.current, { title: title || 'Untitled', content, folderId, isPinned });
    } else {
      const newNote = addNote({ title: title || 'Untitled', content, folderId, tags: [], linkedTaskIds: [], linkedPersonIds: [], isPinned });
      noteIdRef.current = newNote.id;
    }
    setIsSaved(true);
  }, [title, content, folderId, isPinned]);

  const handleDelete = () => {
    if (!noteIdRef.current) { router.back(); return; }
    Alert.alert('Delete Note', 'Delete this note permanently?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteNote(noteIdRef.current!); router.back(); } },
    ]);
  };

  const handleTitleChange = (t: string) => { setTitle(t); setIsSaved(false); };
  const handleContentChange = (c: string) => { setContent(c); setIsSaved(false); };

  const insertFormatting = (prefix: string, suffix = '') => {
    setContent(prev => `${prev}${prefix}${suffix}`);
    setIsSaved(false);
  };

  const handlePinToggle = () => {
    const next = !isPinned;
    setIsPinned(next);
    setIsSaved(false);
    // Immediately persist if note already exists
    if (noteIdRef.current) {
      updateNote(noteIdRef.current, { isPinned: next });
      setIsSaved(true);
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    addFolder({ name: newFolderName.trim(), color: newFolderColor });
    setNewFolderName('');
    setNewFolderColor(FOLDER_COLORS[0]);
    setShowNewFolder(false);
  };

  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Toolbar */}
      <View style={[styles.toolbar, { paddingTop: topPad + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.toolbarLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: isSaved ? colors.muted : colors.notes }]}>
            <Text style={[styles.saveBtnText, { color: isSaved ? colors.mutedForeground : '#fff' }]}>{isSaved ? 'Saved' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.toolbarRight}>
          {/* Pin toggle */}
          <TouchableOpacity onPress={handlePinToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="bookmark" size={18} color={isPinned ? colors.notes : colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => insertFormatting('**', '**')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.formatBtn, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>B</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => insertFormatting('_', '_')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.formatBtn, { color: colors.foreground, fontFamily: 'Inter_400Regular', fontStyle: 'italic' }]}>I</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => insertFormatting('\n# ')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.formatBtn, { color: colors.foreground }]}>H1</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => insertFormatting('\n- ')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="list" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="trash-2" size={18} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.editor} contentContainerStyle={[styles.editorContent, { paddingBottom: 120 }]} keyboardShouldPersistTaps="handled">
        {/* Title */}
        <TextInput
          style={[styles.titleInput, { color: colors.foreground }]}
          placeholder="Title"
          placeholderTextColor={colors.mutedForeground}
          value={title}
          onChangeText={handleTitleChange}
          multiline
        />

        {/* Folder + word count row */}
        <View style={styles.metaRow}>
          <Text style={[styles.wordCount, { color: colors.mutedForeground }]}>
            {content.split(/\s+/).filter(Boolean).length} words
          </Text>
          <TouchableOpacity
            style={[styles.folderChip, { backgroundColor: currentFolder ? `${currentFolder.color}20` : colors.muted, borderColor: currentFolder ? `${currentFolder.color}40` : colors.border }]}
            onPress={() => setShowFolderPicker(true)}
          >
            {currentFolder ? (
              <>
                <View style={[styles.folderDot, { backgroundColor: currentFolder.color }]} />
                <Text style={[styles.folderChipText, { color: currentFolder.color }]}>{currentFolder.name}</Text>
              </>
            ) : (
              <>
                <Feather name="folder" size={11} color={colors.mutedForeground} />
                <Text style={[styles.folderChipText, { color: colors.mutedForeground }]}>No folder</Text>
              </>
            )}
            <Feather name="chevron-down" size={11} color={currentFolder ? currentFolder.color : colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <TextInput
          style={[styles.contentInput, { color: colors.foreground }]}
          placeholder="Start writing..."
          placeholderTextColor={colors.mutedForeground}
          value={content}
          onChangeText={handleContentChange}
          multiline
          textAlignVertical="top"
          scrollEnabled={false}
        />

        {/* Links section */}
        {noteIdRef.current && (
          <View style={styles.linksSection}>
            <Text style={[styles.linksSectionTitle, { color: colors.mutedForeground }]}>LINKED TO</Text>
            <LinkedItems
              linkedTaskIds={existingNote?.linkedTaskIds || []}
              linkedPersonIds={existingNote?.linkedPersonIds || []}
            />
          </View>
        )}
      </ScrollView>

      {/* Folder picker modal */}
      <Modal visible={showFolderPicker} transparent animationType="slide" onRequestClose={() => setShowFolderPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFolderPicker(false)} />
        <View style={[styles.pickerSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.pickerHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.pickerTitle, { color: colors.foreground }]}>Choose Folder</Text>

          {/* No folder option */}
          <TouchableOpacity
            style={[styles.folderRow, folderId === undefined && { backgroundColor: `${colors.notes}12` }]}
            onPress={() => { setFolderId(undefined); setIsSaved(false); setShowFolderPicker(false); }}
          >
            <View style={[styles.folderRowDot, { backgroundColor: colors.mutedForeground }]} />
            <Text style={[styles.folderRowName, { color: folderId === undefined ? colors.foreground : colors.mutedForeground }]}>No folder</Text>
            {folderId === undefined && <Feather name="check" size={16} color={colors.notes} />}
          </TouchableOpacity>

          {folders.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[styles.folderRow, folderId === f.id && { backgroundColor: `${f.color}12` }]}
              onPress={() => { setFolderId(f.id); setIsSaved(false); setShowFolderPicker(false); }}
            >
              <View style={[styles.folderRowDot, { backgroundColor: f.color }]} />
              <Text style={[styles.folderRowName, { color: folderId === f.id ? colors.foreground : colors.mutedForeground }]}>{f.name}</Text>
              {folderId === f.id && <Feather name="check" size={16} color={f.color} />}
            </TouchableOpacity>
          ))}

          {/* Create new folder */}
          {showNewFolder ? (
            <View style={styles.newFolderRow}>
              <TextInput
                style={[styles.newFolderInput, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]}
                placeholder="Folder name..."
                placeholderTextColor={colors.mutedForeground}
                value={newFolderName}
                onChangeText={setNewFolderName}
                autoFocus
              />
              <View style={styles.colorRow}>
                {FOLDER_COLORS.map(c => (
                  <TouchableOpacity key={c} onPress={() => setNewFolderColor(c)}
                    style={[styles.colorDot, { backgroundColor: c, borderWidth: newFolderColor === c ? 2 : 0, borderColor: '#fff' }]} />
                ))}
              </View>
              <View style={styles.newFolderBtns}>
                <TouchableOpacity style={[styles.newFolderBtn, { backgroundColor: colors.muted }]} onPress={() => setShowNewFolder(false)}>
                  <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 14 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.newFolderBtn, { backgroundColor: newFolderColor }]} onPress={handleCreateFolder}>
                  <Text style={{ color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.newFolderTrigger} onPress={() => setShowNewFolder(true)}>
              <Feather name="plus" size={16} color={colors.notes} />
              <Text style={[styles.newFolderTriggerText, { color: colors.notes }]}>New folder</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  toolbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {},
  toolbarRight: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 16 },
  saveBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  formatBtn: { fontSize: 16, width: 22, textAlign: 'center' },
  editor: { flex: 1 },
  editorContent: { paddingHorizontal: 20, paddingTop: 20 },
  titleInput: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, lineHeight: 34, marginBottom: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  wordCount: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  folderChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  folderDot: { width: 7, height: 7, borderRadius: 3.5 },
  folderChipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  contentInput: { fontSize: 16, fontFamily: 'Inter_400Regular', lineHeight: 26, minHeight: 300 },
  linksSection: { marginTop: 24, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(128,128,128,0.2)' },
  linksSectionTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginBottom: 10 },
  // Folder picker modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  pickerSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, padding: 20, paddingBottom: 40 },
  pickerHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  pickerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  folderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 10, marginBottom: 4 },
  folderRowDot: { width: 10, height: 10, borderRadius: 5 },
  folderRowName: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  newFolderTrigger: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 8, marginTop: 4 },
  newFolderTriggerText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  newFolderRow: { marginTop: 8 },
  newFolderInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, fontFamily: 'Inter_400Regular', marginBottom: 12 },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  colorDot: { width: 26, height: 26, borderRadius: 13 },
  newFolderBtns: { flexDirection: 'row', gap: 10 },
  newFolderBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
});
