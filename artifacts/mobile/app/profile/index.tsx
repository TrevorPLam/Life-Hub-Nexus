import React, { useState, useCallback } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp, PrivacyLevel, ProfilePrivacy } from '@/context/AppContext';
import { useWork } from '@/context/WorkContext';
import { useNotes } from '@/context/NotesContext';
import { usePeople } from '@/context/PeopleContext';
import { Avatar } from '@/components/ui/Avatar';
import { PrivacyIcon } from '@/components/ui/PrivacyBadge';

const AVATAR_COLORS = [
  '#6366F1', '#3B82F6', '#10B981', '#F97316',
  '#F43F5E', '#8B5CF6', '#14B8A6', '#F59E0B',
  '#EC4899', '#06B6D4',
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useApp();
  const { tasks } = useWork();
  const { notes } = useNotes();
  const { people } = usePeople();

  const [viewMode, setViewMode] = useState<'mine' | 'public'>('mine');
  const [pickingColor, setPickingColor] = useState(false);

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const pinnedNotes = notes.filter(n => n.isPinned).length;

  function isVisible(field: keyof ProfilePrivacy): boolean {
    if (viewMode === 'mine') return true;
    return profile.privacy[field] === 'public';
  }

  const formatBirthday = (iso: string) => {
    if (!iso) return '';
    const [year, month, day] = iso.split('-');
    return new Date(+year, +month - 1, +day).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const hasAnyPublicDetail = ['bio', 'location', 'occupation', 'website', 'birthday', 'about', 'phone', 'email']
    .some(f => profile[f as keyof typeof profile] && profile.privacy[f as keyof ProfilePrivacy] === 'public');

  const displayName = profile.name || 'Your Name';
  const displayUsername = profile.username ? `@${profile.username}` : '';
  const hasSocialLinks = profile.socialTwitter || profile.socialInstagram || profile.socialLinkedin;

  // ─── Photo picker ──────────────────────────────────────────────────────────
  const pickPhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled) {
      updateProfile({ avatarUri: result.assets[0].uri });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [updateProfile]);

  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access in Settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled) {
      updateProfile({ avatarUri: result.assets[0].uri });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [updateProfile]);

  const handleAvatarTap = useCallback(() => {
    if (viewMode !== 'mine') return;
    setPickingColor(false);
    Alert.alert('Profile photo', undefined, [
      { text: 'Take photo', onPress: takePhoto },
      { text: 'Choose from library', onPress: pickPhoto },
      ...(profile.avatarUri
        ? [{ text: 'Remove photo', style: 'destructive' as const, onPress: () => updateProfile({ avatarUri: '' }) }]
        : []
      ),
      { text: 'Change color', onPress: () => setPickingColor(p => !p) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [viewMode, pickPhoto, takePhoto, profile.avatarUri, updateProfile]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
        <TouchableOpacity
          onPress={() => router.push('/profile/edit')}
          style={[styles.editBtn, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}30` }]}
        >
          <Feather name="edit-2" size={14} color={colors.primary} />
          <Text style={[styles.editBtnText, { color: colors.primary }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* View mode toggle */}
        <View style={[styles.viewToggle, { backgroundColor: colors.muted }]}>
          {(['mine', 'public'] as const).map(mode => (
            <TouchableOpacity
              key={mode}
              onPress={() => setViewMode(mode)}
              style={[
                styles.viewToggleBtn,
                viewMode === mode && { backgroundColor: colors.card, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
              ]}
            >
              <Feather name={mode === 'mine' ? 'user' : 'globe'} size={14} color={viewMode === mode ? colors.foreground : colors.mutedForeground} />
              <Text style={[styles.viewToggleBtnText, { color: viewMode === mode ? colors.foreground : colors.mutedForeground }]}>
                {mode === 'mine' ? 'My View' : 'Public View'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {viewMode === 'public' && (
          <View style={[styles.publicBanner, { backgroundColor: `${colors.notes}12`, borderColor: `${colors.notes}30` }]}>
            <Feather name="eye" size={13} color={colors.notes} />
            <Text style={[styles.publicBannerText, { color: colors.notes }]}>This is how your profile appears to others</Text>
          </View>
        )}

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleAvatarTap} activeOpacity={0.85} style={styles.avatarWrap}>
            <Avatar name={displayName} color={profile.avatarColor} size={90} uri={profile.avatarUri || undefined} />
            {viewMode === 'mine' && (
              <View style={[styles.avatarEditBadge, { backgroundColor: colors.primary }]}>
                <Feather name="camera" size={11} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          {/* Color picker (shown when selected from action sheet) */}
          {pickingColor && viewMode === 'mine' && (
            <View style={[styles.colorPicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.colorPickerLabel, { color: colors.mutedForeground }]}>Pick a color</Text>
              <View style={styles.colorPickerRow}>
                {AVATAR_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => { updateProfile({ avatarColor: c }); setPickingColor(false); }}
                    style={[
                      styles.colorDot,
                      {
                        backgroundColor: c,
                        borderWidth: profile.avatarColor === c ? 3 : 1.5,
                        borderColor: profile.avatarColor === c ? '#fff' : `${c}60`,
                        transform: [{ scale: profile.avatarColor === c ? 1.15 : 1 }],
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          )}

          <Text style={[styles.displayName, { color: colors.foreground }]}>{displayName}</Text>

          {/* Username + pronouns row */}
          <View style={styles.subRow}>
            {displayUsername ? (
              <Text style={[styles.username, { color: colors.mutedForeground }]}>{displayUsername}</Text>
            ) : null}
            {isVisible('pronouns') && profile.pronouns ? (
              <View style={[styles.pronounsBadge, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}25` }]}>
                <Text style={[styles.pronounsText, { color: colors.primary }]}>{profile.pronouns}</Text>
                {viewMode === 'mine' && <PrivacyIcon level={profile.privacy.pronouns} />}
              </View>
            ) : null}
          </View>

          {isVisible('bio') && profile.bio ? (
            <Text style={[styles.bio, { color: colors.foreground }]}>{profile.bio}</Text>
          ) : null}

          {/* Meta chips: location, occupation, website */}
          <View style={styles.metaInline}>
            {isVisible('location') && profile.location ? (
              <View style={styles.metaChip}>
                <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                <Text style={[styles.metaChipText, { color: colors.mutedForeground }]}>{profile.location}</Text>
                {viewMode === 'mine' && <PrivacyIcon level={profile.privacy.location} />}
              </View>
            ) : null}
            {isVisible('occupation') && profile.occupation ? (
              <View style={styles.metaChip}>
                <Feather name="briefcase" size={12} color={colors.mutedForeground} />
                <Text style={[styles.metaChipText, { color: colors.mutedForeground }]}>{profile.occupation}</Text>
                {viewMode === 'mine' && <PrivacyIcon level={profile.privacy.occupation} />}
              </View>
            ) : null}
            {isVisible('website') && profile.website ? (
              <View style={styles.metaChip}>
                <Feather name="link" size={12} color={colors.primary} />
                <Text style={[styles.metaChipText, { color: colors.primary }]}>{profile.website.replace(/^https?:\/\//, '')}</Text>
                {viewMode === 'mine' && <PrivacyIcon level={profile.privacy.website} />}
              </View>
            ) : null}
          </View>

          {/* Social links */}
          {isVisible('socialLinks') && hasSocialLinks ? (
            <View style={styles.socialRow}>
              {profile.socialTwitter ? (
                <View style={[styles.socialChip, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}20` }]}>
                  <Text style={[styles.socialChipText, { color: colors.foreground }]}>𝕏 @{profile.socialTwitter}</Text>
                </View>
              ) : null}
              {profile.socialInstagram ? (
                <View style={[styles.socialChip, { backgroundColor: `${colors.social}10`, borderColor: `${colors.social}20` }]}>
                  <Text style={[styles.socialChipText, { color: colors.foreground }]}>IG @{profile.socialInstagram}</Text>
                </View>
              ) : null}
              {profile.socialLinkedin ? (
                <View style={[styles.socialChip, { backgroundColor: `${colors.people}10`, borderColor: `${colors.people}20` }]}>
                  <Feather name="linkedin" size={11} color={colors.people} />
                  <Text style={[styles.socialChipText, { color: colors.foreground }]}>
                    {profile.socialLinkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}
                  </Text>
                </View>
              ) : null}
              {viewMode === 'mine' && <PrivacyIcon level={profile.privacy.socialLinks} />}
            </View>
          ) : null}
        </View>

        {/* Stats — my view only */}
        {viewMode === 'mine' && (
          <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { num: completedTasks, label: 'Done' },
              { num: notes.length, label: 'Notes' },
              { num: people.length, label: 'Contacts' },
              { num: pinnedNotes, label: 'Pinned' },
            ].map((s, i, arr) => (
              <React.Fragment key={s.label}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNum, { color: colors.foreground }]}>{s.num}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                </View>
                {i < arr.length - 1 && <View style={[styles.statDivider, { backgroundColor: colors.border }]} />}
              </React.Fragment>
            ))}
          </View>
        )}

        {/* About */}
        {isVisible('about') && profile.about ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About</Text>
              {viewMode === 'mine' && <PrivacyIcon level={profile.privacy.about} />}
            </View>
            <View style={[styles.aboutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.aboutText, { color: colors.foreground }]}>{profile.about}</Text>
            </View>
          </View>
        ) : null}

        {/* Details */}
        {((isVisible('email') && profile.email) ||
          (isVisible('phone') && profile.phone) ||
          (isVisible('birthday') && profile.birthday)) ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Details</Text>
            <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {isVisible('email') && profile.email ? (
                <DetailRow icon="mail" value={profile.email} privacyLevel={profile.privacy.email} showPrivacy={viewMode === 'mine'} isLast={false} />
              ) : null}
              {isVisible('phone') && profile.phone ? (
                <DetailRow icon="phone" value={profile.phone} privacyLevel={profile.privacy.phone} showPrivacy={viewMode === 'mine'} isLast={false} />
              ) : null}
              {isVisible('birthday') && profile.birthday ? (
                <DetailRow icon="gift" value={formatBirthday(profile.birthday)} privacyLevel={profile.privacy.birthday} showPrivacy={viewMode === 'mine'} isLast />
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Empty public state */}
        {viewMode === 'public' && !profile.bio && !profile.location && !profile.occupation && !hasAnyPublicDetail && (
          <View style={[styles.emptyPublic, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="user-x" size={32} color={colors.mutedForeground} style={{ marginBottom: 10 }} />
            <Text style={[styles.emptyPublicTitle, { color: colors.foreground }]}>No public info yet</Text>
            <Text style={[styles.emptyPublicSub, { color: colors.mutedForeground }]}>Add details and set them to Public to share with others</Text>
            <TouchableOpacity
              onPress={() => router.push('/profile/edit')}
              style={[styles.emptyPublicBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Privacy summary */}
        {viewMode === 'mine' && (
          <TouchableOpacity
            onPress={() => router.push('/profile/edit')}
            style={[styles.privacySummary, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}25` }]}
          >
            <View style={[styles.privacySummaryIcon, { backgroundColor: `${colors.primary}20` }]}>
              <Feather name="shield" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.privacySummaryTitle, { color: colors.foreground }]}>Privacy & Details</Text>
              <Text style={[styles.privacySummarySub, { color: colors.mutedForeground }]}>Control what others can see · Tap to edit</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, value, privacyLevel, showPrivacy, isLast }: {
  icon: string; value: string; privacyLevel: PrivacyLevel; showPrivacy: boolean; isLast: boolean;
}) {
  const colors = useColors();
  return (
    <View style={[styles.detailRow, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
      <Feather name={icon as any} size={15} color={colors.mutedForeground} />
      <Text style={[styles.detailValue, { color: colors.foreground }]} numberOfLines={1}>{value}</Text>
      {showPrivacy && <PrivacyIcon level={privacyLevel} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: 'Inter_700Bold', textAlign: 'center', letterSpacing: -0.2 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
  },
  editBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  viewToggle: { flexDirection: 'row', borderRadius: 12, padding: 3, marginBottom: 12 },
  viewToggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 9, borderRadius: 10,
  },
  viewToggleBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  publicBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 12,
  },
  publicBannerText: { fontSize: 12, fontFamily: 'Inter_500Medium' },

  avatarSection: { alignItems: 'center', paddingVertical: 20 },
  avatarWrap: { marginBottom: 12, position: 'relative' },
  avatarEditBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#fff',
  },

  colorPicker: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14, width: '100%' },
  colorPickerLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  colorPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  colorDot: { width: 30, height: 30, borderRadius: 15 },

  displayName: { fontSize: 24, fontFamily: 'Inter_700Bold', letterSpacing: -0.4, marginBottom: 6 },
  subRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    flexWrap: 'wrap', justifyContent: 'center', marginBottom: 10,
  },
  username: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  pronounsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1,
  },
  pronounsText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  bio: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22, maxWidth: 280, marginBottom: 12 },

  metaInline: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaChipText: { fontSize: 13, fontFamily: 'Inter_400Regular' },

  socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 10, alignItems: 'center' },
  socialChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  socialChipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },

  statsRow: {
    flexDirection: 'row', borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth, marginBottom: 16, overflow: 'hidden',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statNum: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  statDivider: { width: StyleSheet.hairlineWidth },

  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.1 },

  aboutCard: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  aboutText: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 23 },

  detailsCard: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  detailValue: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },

  emptyPublic: { alignItems: 'center', padding: 32, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, marginTop: 8 },
  emptyPublicTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  emptyPublicSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  emptyPublicBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },

  privacySummary: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 4,
  },
  privacySummaryIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  privacySummaryTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  privacySummarySub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
