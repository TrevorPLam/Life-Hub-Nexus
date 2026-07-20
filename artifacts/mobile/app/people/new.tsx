import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { usePeople, AVATAR_COLORS } from '@/context/PeopleContext';
import { Avatar } from '@/components/ui/Avatar';

export default function NewPersonScreen() {
  const colors = useColors();
  const { addPerson } = usePeople();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [birthday, setBirthday] = useState('');
  const [notes, setNotes] = useState('');
  const [stayInTouch, setStayInTouch] = useState('14');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);

  const handleCreate = () => {
    if (!name.trim()) return;
    const days = parseInt(stayInTouch) || 14;
    addPerson({
      name: name.trim(), email, phone, company, role, birthday,
      notes, avatarColor, linkedTaskIds: [], linkedEventIds: [], linkedNoteIds: [],
      stayInTouchDays: days, lastInteractionDate: new Date().toISOString(),
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancel, { color: colors.mutedForeground }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Contact</Text>
        <TouchableOpacity onPress={handleCreate} disabled={!name.trim()}
          style={[styles.createBtn, { backgroundColor: name.trim() ? colors.people : colors.muted }]}>
          <Text style={[styles.createBtnText, { color: name.trim() ? '#fff' : colors.mutedForeground }]}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Avatar preview + color picker */}
        <View style={styles.avatarSection}>
          <Avatar name={name || '?'} color={avatarColor} size={72} />
          <View style={styles.colorRow}>
            {AVATAR_COLORS.map(c => (
              <TouchableOpacity key={c} onPress={() => setAvatarColor(c)}
                style={[styles.colorDot, { backgroundColor: c, transform: [{ scale: avatarColor === c ? 1.2 : 1 }], borderWidth: avatarColor === c ? 2 : 0, borderColor: '#fff' }]} />
            ))}
          </View>
        </View>

        <Field label="Name *" placeholder="Full name" value={name} onChangeText={setName} autoFocus />
        <Field label="Email" placeholder="email@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Field label="Phone" placeholder="+1 (555) 000-0000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Company" placeholder="Acme Corp" value={company} onChangeText={setCompany} />
        <Field label="Role" placeholder="Product Manager" value={role} onChangeText={setRole} />
        <Field label="Birthday" placeholder="MM-DD (e.g. 03-25)" value={birthday} onChangeText={setBirthday} />

        {/* Stay in touch */}
        <View style={styles.fieldWrap}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Stay in touch every</Text>
          <View style={styles.touchRow}>
            {['7', '14', '30', '60', '90'].map(d => (
              <TouchableOpacity key={d} onPress={() => setStayInTouch(d)}
                style={[styles.touchBtn, { backgroundColor: stayInTouch === d ? `${colors.people}20` : colors.muted, borderColor: stayInTouch === d ? colors.people : 'transparent', borderWidth: 1 }]}>
                <Text style={[styles.touchBtnText, { color: stayInTouch === d ? colors.people : colors.mutedForeground }]}>{d}d</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldWrap}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Notes</Text>
          <TextInput
            style={[styles.notesInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
            placeholder="How you met, shared interests, context..."
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, placeholder, value, onChangeText, keyboardType, autoFocus }: any) {
  const colors = useColors();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoFocus={autoFocus}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  cancel: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  createBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  createBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 80 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  colorRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  colorDot: { width: 26, height: 26, borderRadius: 13 },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: 'Inter_400Regular' },
  touchRow: { flexDirection: 'row', gap: 8 },
  touchBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  touchBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  notesInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: 'Inter_400Regular', minHeight: 100 },
});
