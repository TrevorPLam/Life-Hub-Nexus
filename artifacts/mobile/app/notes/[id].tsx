import React, { useState, useCallback, useRef } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { useColors } from '@/hooks/useColors';
import { useNotes } from '@/context/NotesContext';
import { LinkedItems } from '@/components/ui/LinkedItems';

export default function NoteEditorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const { getNote, addNote, updateNote, deleteNote, folders } = useNotes();

  const existingNote = isNew ? null : getNote(id as string);
  const [title, setTitle] = useState(existingNote?.title || '');
  const [content, setContent] = useState(existingNote?.content || '');
  const [isSaved, setIsSaved] = useState(!isNew);
  const noteIdRef = useRef<string | null>(isNew ? null : (id as string));

  const handleSave = useCallback(() => {
    if (!title.trim() && !content.trim()) return;
    if (noteIdRef.current) {
      updateNote(noteIdRef.current, { title: title || 'Untitled', content });
    } else {
      const newNote = addNote({ title: title || 'Untitled', content, folderId: undefined, tags: [], linkedTaskIds: [], linkedPersonIds: [], isPinned: false });
      noteIdRef.current = newNote.id;
    }
    setIsSaved(true);
  }, [title, content]);

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

  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
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

        {/* Word count */}
        <Text style={[styles.wordCount, { color: colors.mutedForeground }]}>
          {content.split(/\s+/).filter(Boolean).length} words
        </Text>

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
  titleInput: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, lineHeight: 34, marginBottom: 6 },
  wordCount: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 16 },
  contentInput: { fontSize: 16, fontFamily: 'Inter_400Regular', lineHeight: 26, minHeight: 300 },
  linksSection: { marginTop: 24, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(128,128,128,0.2)' },
  linksSectionTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginBottom: 10 },
});
