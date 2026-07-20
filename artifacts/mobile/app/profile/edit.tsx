import React, { useState, useCallback } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp, PrivacyLevel, ProfilePrivacy } from '@/context/AppContext';
import { Avatar } from '@/components/ui/Avatar';
import { PrivacyBadge, cyclePrivacy } from '@/components/ui/PrivacyBadge';

type PrivacyField = keyof ProfilePrivacy;

const PRIVACY_ORDER: PrivacyLevel[] = ['public', 'friends', 'private'];

const PRIVACY_DESCRIPTION: Record<PrivacyLevel, string> = {
  public: 'Anyone can see this',
  friends: 'Friends only',
  private: 'Only you',
};

interface FieldRowProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  privacyField?: PrivacyField;
  privacy?: PrivacyLevel;
  onCyclePrivacy?: () => void;
  multiline?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  hint?: string;
  isLast?: boolean;
}

function FieldRow({ label, value, onChangeText, placeholder, privacyField, privacy, onCyclePrivacy, multiline, keyboardType, autoCapitalize, hint, isLast }: FieldRowProps) {
  const colors = useColors();
  return (
    <View style={[styles.fieldWrap, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
      <View style={styles.fieldHeader}>
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
        {privacy !== undefined && onCyclePrivacy && (
          <TouchableOpacity onPress={() => { onCyclePrivacy(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={styles.privacyBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <PrivacyBadge level={privacy} />
          </TouchableOpacity>
        )}
      </View>
      <TextInput
        style={[styles.fieldInput, { color: colors.foreground }, multiline && styles.fieldInputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        textAlignVertical={multiline ? 'top' : undefined}
      />
      {hint ? <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>{hint}</Text> : null}
    </View>
  );
}

function SectionHeader({ title, subtitle, icon, color }: { title: string; subtitle?: string; icon: string; color: string }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={[styles.sectionIcon, { backgroundColor: `${color}15` }]}>
        <Feather name={icon as any} size={15} color={color} />
      </View>
      <View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
        {subtitle && <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>}
      </View>
    </View>
  );
}

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, updatePrivacy } = useApp();

  // Local state mirrors
  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [about, setAbout] = useState(profile.about);
  const [birthday, setBirthday] = useState(profile.birthday);
  const [location, setLocation] = useState(profile.location);
  const [occupation, setOccupation] = useState(profile.occupation);
  const [website, setWebsite] = useState(profile.website);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);

  // Local privacy state (so changes are previewed live before saving)
  const [privacy, setPrivacy] = useState({ ...profile.privacy });

  const isDirty =
    name !== profile.name || username !== profile.username ||
    bio !== profile.bio || about !== profile.about ||
    birthday !== profile.birthday || location !== profile.location ||
    occupation !== profile.occupation || website !== profile.website ||
    phone !== profile.phone || email !== profile.email ||
    JSON.stringify(privacy) !== JSON.stringify(profile.privacy);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter at least a display name.');
      return;
    }
    updateProfile({ name: name.trim(), username: username.trim().replace('@', ''), bio, about, birthday, location, occupation, website, phone, email });
    // Save all privacy levels
    (Object.keys(privacy) as PrivacyField[]).forEach(field => {
      if (privacy[field] !== profile.privacy[field]) {
        updatePrivacy(field, privacy[field]);
      }
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [name, username, bio, about, birthday, location, occupation, website, phone, email, privacy]);

  const cycleField = useCallback((field: PrivacyField) => {
    setPrivacy(prev => ({ ...prev, [field]: cyclePrivacy(prev[field]) }));
  }, []);

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad > 20 ? topPad : 16, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => {
          if (isDirty) {
            Alert.alert('Discard changes?', 'You have unsaved changes.', [
              { text: 'Keep editing', style: 'cancel' },
              { text: 'Discard', style: 'destructive', onPress: () => router.back() },
            ]);
          } else {
            router.back();
          }
        }}>
          <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Edit Profile</Text>

        <TouchableOpacity onPress={handleSave}
          style={[styles.saveBtn, { backgroundColor: isDirty ? colors.primary : colors.muted }]}>
          <Text style={[styles.saveBtnText, { color: isDirty ? '#fff' : colors.mutedForeground }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Avatar preview */}
        <View style={styles.avatarPreview}>
          <Avatar name={name || 'You'} color={profile.avatarColor} size={72} />
          <TouchableOpacity onPress={() => router.back()} style={[styles.changeColorHint, { backgroundColor: `${colors.primary}12` }]}>
            <Feather name="droplet" size={12} color={colors.primary} />
            <Text style={[styles.changeColorHintText, { color: colors.primary }]}>Change color on profile page</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy legend */}
        <View style={[styles.legendCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>
            Tap the <Text style={{ fontFamily: 'Inter_600SemiBold' }}>🌐 Public · 👥 Friends · 🔒 Private</Text> badge next to any field to control who can see it.
          </Text>
        </View>

        {/* ─── IDENTITY ─── */}
        <View style={styles.sectionBlock}>
          <SectionHeader title="Identity" subtitle="How you appear to everyone" icon="user" color={colors.primary} />
          <View style={[styles.fieldCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <FieldRow
              label="Display name"
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              autoCapitalize="words"
            />
            <FieldRow
              label="Username"
              value={username}
              onChangeText={t => setUsername(t.replace(/[^a-zA-Z0-9_.]/g, ''))}
              placeholder="yourhandle"
              autoCapitalize="none"
              hint="Letters, numbers, _ and . only"
            />
            <FieldRow
              label="Bio"
              value={bio}
              onChangeText={setBio}
              placeholder="A short tagline about yourself"
              privacyField="bio"
              privacy={privacy.bio}
              onCyclePrivacy={() => cycleField('bio')}
              isLast
            />
          </View>
        </View>

        {/* ─── ABOUT ─── */}
        <View style={styles.sectionBlock}>
          <SectionHeader title="About" subtitle="Tell your story" icon="file-text" color={colors.notes} />
          <View style={[styles.fieldCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <FieldRow
              label="About me"
              value={about}
              onChangeText={setAbout}
              placeholder="Write a few sentences about yourself, your interests, what you're working on..."
              privacyField="about"
              privacy={privacy.about}
              onCyclePrivacy={() => cycleField('about')}
              multiline
              isLast
            />
          </View>
        </View>

        {/* ─── PERSONAL ─── */}
        <View style={styles.sectionBlock}>
          <SectionHeader title="Personal" subtitle="Background info" icon="heart" color={colors.social} />
          <View style={[styles.fieldCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <FieldRow
              label="Birthday"
              value={birthday}
              onChangeText={setBirthday}
              placeholder="YYYY-MM-DD (e.g. 1995-08-14)"
              privacyField="birthday"
              privacy={privacy.birthday}
              onCyclePrivacy={() => cycleField('birthday')}
              keyboardType="numbers-and-punctuation"
              hint="Used for birthday reminders in the People module"
            />
            <FieldRow
              label="Location"
              value={location}
              onChangeText={setLocation}
              placeholder="City, Country"
              privacyField="location"
              privacy={privacy.location}
              onCyclePrivacy={() => cycleField('location')}
            />
            <FieldRow
              label="Occupation"
              value={occupation}
              onChangeText={setOccupation}
              placeholder="What do you do?"
              privacyField="occupation"
              privacy={privacy.occupation}
              onCyclePrivacy={() => cycleField('occupation')}
              isLast
            />
          </View>
        </View>

        {/* ─── CONTACT ─── */}
        <View style={styles.sectionBlock}>
          <SectionHeader title="Contact" subtitle="Private by default — you control visibility" icon="mail" color={colors.budget} />
          <View style={[styles.fieldCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <FieldRow
              label="Website"
              value={website}
              onChangeText={setWebsite}
              placeholder="https://yoursite.com"
              privacyField="website"
              privacy={privacy.website}
              onCyclePrivacy={() => cycleField('website')}
              keyboardType="url"
              autoCapitalize="none"
            />
            <FieldRow
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              privacyField="email"
              privacy={privacy.email}
              onCyclePrivacy={() => cycleField('email')}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <FieldRow
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 (555) 000-0000"
              privacyField="phone"
              privacy={privacy.phone}
              onCyclePrivacy={() => cycleField('phone')}
              keyboardType="phone-pad"
              autoCapitalize="none"
              isLast
            />
          </View>
        </View>

        {/* ─── PRIVACY OVERVIEW ─── */}
        <View style={styles.sectionBlock}>
          <SectionHeader title="Privacy overview" subtitle="Summary of your current settings" icon="shield" color={colors.people} />
          <View style={[styles.privacyOverview, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {(Object.entries(privacy) as [PrivacyField, PrivacyLevel][]).map(([field, level], i, arr) => (
              <TouchableOpacity key={field} onPress={() => { cycleField(field); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[styles.privacyOverviewRow, i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <Text style={[styles.privacyOverviewField, { color: colors.foreground }]}>
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </Text>
                <View style={styles.privacyOverviewRight}>
                  <Text style={[styles.privacyOverviewDesc, { color: colors.mutedForeground }]}>{PRIVACY_DESCRIPTION[level]}</Text>
                  <PrivacyBadge level={level} compact />
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.privacyFootnote, { color: colors.mutedForeground }]}>
            Tap any row to cycle through Public → Friends → Private
          </Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  cancelText: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  avatarPreview: { alignItems: 'center', paddingVertical: 20, gap: 10 },
  changeColorHint: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  changeColorHintText: { fontSize: 12, fontFamily: 'Inter_500Medium' },

  legendCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 20 },
  legendText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },

  sectionBlock: { marginBottom: 22 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sectionIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  sectionSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },

  fieldCard: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  fieldWrap: { paddingHorizontal: 14, paddingVertical: 12 },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.4, textTransform: 'uppercase' },
  privacyBtn: {},
  fieldInput: { fontSize: 15, fontFamily: 'Inter_400Regular', padding: 0, minHeight: 22 },
  fieldInputMulti: { minHeight: 80, lineHeight: 22 },
  fieldHint: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4 },

  privacyOverview: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  privacyOverviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 },
  privacyOverviewField: { fontSize: 14, fontFamily: 'Inter_500Medium', flex: 1 },
  privacyOverviewRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  privacyOverviewDesc: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  privacyFootnote: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 8 },
});
