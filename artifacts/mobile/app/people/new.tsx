import React, { useState, useCallback } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { usePeople, AVATAR_COLORS } from '@/context/PeopleContext';
import { Avatar } from '@/components/ui/Avatar';
import { DatePickerModal } from '@/components/ui/DatePickerModal';

// Birthday is stored as "MM-DD". DatePickerModal works with "YYYY-MM-DD".
function toPickerDate(mmdd: string): string {
  if (!mmdd) return '';
  const [mm, dd] = mmdd.split('-');
  if (!mm || !dd) return '';
  return `2000-${mm}-${dd}`;
}

function fromPickerDate(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length < 3) return '';
  return `${parts[1]}-${parts[2]}`;
}

function formatBirthday(mmdd: string): string {
  if (!mmdd) return '';
  const [mm, dd] = mmdd.split('-');
  if (!mm || !dd) return '';
  const d = new Date(2000, parseInt(mm) - 1, parseInt(dd));
  return d.toLocaleDateString([], { month: 'long', day: 'numeric' });
}

const TOUCH_OPTIONS = ['7', '14', '30', '60', '90'];

export default function NewPersonScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { addPerson, getPerson, updatePerson } = usePeople();

  const isEditing = !!id;
  const existing = isEditing ? getPerson(id as string) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [company, setCompany] = useState(existing?.company ?? '');
  const [role, setRole] = useState(existing?.role ?? '');
  const [birthday, setBirthday] = useState(existing?.birthday ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [stayInTouch, setStayInTouch] = useState(String(existing?.stayInTouchDays ?? 14));
  const [avatarColor, setAvatarColor] = useState(existing?.avatarColor ?? AVATAR_COLORS[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isDirty =
    isEditing &&
    (name !== (existing?.name ?? '') ||
      email !== (existing?.email ?? '') ||
      phone !== (existing?.phone ?? '') ||
      company !== (existing?.company ?? '') ||
      role !== (existing?.role ?? '') ||
      birthday !== (existing?.birthday ?? '') ||
      notes !== (existing?.notes ?? '') ||
      stayInTouch !== String(existing?.stayInTouchDays ?? 14) ||
      avatarColor !== (existing?.avatarColor ?? AVATAR_COLORS[0]));

  const handleCancel = useCallback(() => {
    if (isDirty) {
      Alert.alert('Discard Changes?', 'You have unsaved changes. Discard them?', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  }, [isDirty]);

  const handleSave = useCallback(() => {
    if (!name.trim()) return;
    const days = parseInt(stayInTouch) || 14;
    if (isEditing && existing) {
      updatePerson(existing.id, {
        name: name.trim(),
        email,
        phone,
        company,
        role,
        birthday,
        notes,
        avatarColor,
        stayInTouchDays: days,
      });
    } else {
      addPerson({
        name: name.trim(),
        email,
        phone,
        company,
        role,
        birthday,
        notes,
        avatarColor,
        linkedTaskIds: [],
        linkedEventIds: [],
        linkedNoteIds: [],
        stayInTouchDays: days,
        lastInteractionDate: new Date().toISOString(),
      });
    }
    router.back();
  }, [name, email, phone, company, role, birthday, notes, avatarColor, stayInTouch, isEditing, existing, updatePerson, addPerson]);

  const canSave = name.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[styles.cancel, { color: colors.mutedForeground }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {isEditing ? 'Edit Contact' : 'New Contact'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave}
          style={[styles.saveBtn, { backgroundColor: canSave ? colors.people : colors.muted }]}
        >
          <Text style={[styles.saveBtnText, { color: canSave ? '#fff' : colors.mutedForeground }]}>
            {isEditing ? 'Save' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar + color picker */}
        <View style={styles.avatarSection}>
          <Avatar name={name || '?'} color={avatarColor} size={72} />
          <Text style={[styles.avatarHint, { color: colors.mutedForeground }]}>Pick an avatar colour</Text>
          <View style={styles.colorRow}>
            {AVATAR_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setAvatarColor(c)}
                style={[
                  styles.colorDot,
                  {
                    backgroundColor: c,
                    transform: [{ scale: avatarColor === c ? 1.2 : 1 }],
                    borderWidth: avatarColor === c ? 2.5 : 0,
                    borderColor: '#fff',
                    shadowColor: avatarColor === c ? c : 'transparent',
                    shadowOpacity: avatarColor === c ? 0.5 : 0,
                    shadowRadius: 4,
                    elevation: avatarColor === c ? 3 : 0,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Basic info */}
        <SectionHeader label="Basic Info" />
        <Field label="Name *" placeholder="Full name" value={name} onChangeText={setName} autoFocus={!isEditing} />
        <Field label="Email" placeholder="email@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Field label="Phone" placeholder="+1 (555) 000-0000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        {/* Work */}
        <SectionHeader label="Work" />
        <Field label="Company" placeholder="Acme Corp" value={company} onChangeText={setCompany} />
        <Field label="Role / Title" placeholder="Product Manager" value={role} onChangeText={setRole} />

        {/* Birthday */}
        <SectionHeader label="Personal" />
        <View style={styles.fieldWrap}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Birthday</Text>
          <TouchableOpacity
            style={[styles.fieldInput, styles.pickerRow, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Feather name="gift" size={15} color={birthday ? colors.people : colors.mutedForeground} />
            <Text
              style={[
                styles.pickerText,
                { color: birthday ? colors.foreground : colors.mutedForeground },
              ]}
            >
              {birthday ? formatBirthday(birthday) : 'Select birthday'}
            </Text>
            {birthday ? (
              <TouchableOpacity
                onPress={() => setBirthday('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x-circle" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ) : (
              <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
            )}
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <View style={styles.fieldWrap}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Notes</Text>
          <TextInput
            style={[
              styles.notesInput,
              { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card },
            ]}
            placeholder="How you met, shared interests, context..."
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Stay in touch */}
        <SectionHeader label="Relationship" />
        <View style={styles.fieldWrap}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Stay in touch every</Text>
          <View style={styles.touchRow}>
            {TOUCH_OPTIONS.map(d => (
              <TouchableOpacity
                key={d}
                onPress={() => setStayInTouch(d)}
                style={[
                  styles.touchBtn,
                  {
                    backgroundColor: stayInTouch === d ? `${colors.people}18` : colors.muted,
                    borderColor: stayInTouch === d ? colors.people : 'transparent',
                    borderWidth: 1.5,
                  },
                ]}
              >
                <Text style={[styles.touchBtnText, { color: stayInTouch === d ? colors.people : colors.mutedForeground }]}>
                  {d}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.touchHint, { color: colors.mutedForeground }]}>
            You'll get a reminder when this interval passes without contact.
          </Text>
        </View>
      </ScrollView>

      <DatePickerModal
        visible={showDatePicker}
        value={birthday ? toPickerDate(birthday) : ''}
        onConfirm={iso => {
          setBirthday(fromPickerDate(iso));
          setShowDatePicker(false);
        }}
        onDismiss={() => setShowDatePicker(false)}
      />
    </KeyboardAvoidingView>
  );
}

function SectionHeader({ label }: { label: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>{label}</Text>
  );
}

function Field({ label, placeholder, value, onChangeText, keyboardType, autoFocus, autoCapitalize }: any) {
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
        autoCapitalize={autoCapitalize ?? 'words'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancel: { fontSize: 16, fontFamily: 'Inter_400Regular', minWidth: 56 },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, minWidth: 56, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 80 },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarHint: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 10, marginBottom: 4 },
  colorRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  sectionHeader: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 8,
  },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickerText: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  touchRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  touchBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  touchBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  touchHint: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 8, lineHeight: 16 },
  notesInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    minHeight: 100,
  },
});
