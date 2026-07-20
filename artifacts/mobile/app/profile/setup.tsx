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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { Avatar } from '@/components/ui/Avatar';

const AVATAR_COLORS = [
  '#6366F1', '#3B82F6', '#10B981', '#F97316',
  '#F43F5E', '#8B5CF6', '#14B8A6', '#F59E0B',
  '#EC4899', '#06B6D4',
];

export default function ProfileSetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useApp();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarColor, setAvatarColor] = useState(profile.avatarColor);
  const [avatarUri, setAvatarUri] = useState('');
  const [step, setStep] = useState<'identity' | 'bio'>('identity');

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const canProceed = name.trim().length > 0;

  const handleFinish = useCallback(() => {
    updateProfile({
      name: name.trim(),
      username: username.trim().replace('@', ''),
      bio,
      avatarColor,
      avatarUri,
      onboarded: true,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  }, [name, username, bio, avatarColor, avatarUri]);

  const handleNext = useCallback(() => {
    if (!canProceed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep('bio');
  }, [canProceed]);

  const pickPhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

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
      setAvatarUri(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleAvatarTap = useCallback(() => {
    Alert.alert('Profile photo', undefined, [
      { text: 'Take photo', onPress: takePhoto },
      { text: 'Choose from library', onPress: pickPhoto },
      ...(avatarUri ? [{ text: 'Remove photo', style: 'destructive' as const, onPress: () => setAvatarUri('') }] : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [avatarUri, pickPhoto, takePhoto]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Progress header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        {step === 'bio' && (
          <TouchableOpacity onPress={() => setStep('identity')} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
        <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: step === 'identity' ? '50%' : '100%' }]} />
        </View>
        <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>
          {step === 'identity' ? '1 of 2' : '2 of 2'}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 'identity' ? (
          <>
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <TouchableOpacity onPress={handleAvatarTap} activeOpacity={0.85} style={styles.avatarWrap}>
                <Avatar name={name || '?'} color={avatarColor} size={88} uri={avatarUri || undefined} />
                <View style={[styles.cameraBtn, { backgroundColor: colors.primary }]}>
                  <Feather name="camera" size={12} color="#fff" />
                </View>
              </TouchableOpacity>
              {!avatarUri && (
                <>
                  <Text style={[styles.avatarHint, { color: colors.mutedForeground }]}>Or pick a color</Text>
                  <View style={styles.colorRow}>
                    {AVATAR_COLORS.map(c => (
                      <TouchableOpacity
                        key={c}
                        onPress={() => { setAvatarColor(c); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                        style={[
                          styles.colorDot,
                          {
                            backgroundColor: c,
                            borderWidth: avatarColor === c ? 3 : 1.5,
                            borderColor: avatarColor === c ? '#fff' : `${c}60`,
                            transform: [{ scale: avatarColor === c ? 1.2 : 1 }],
                          },
                        ]}
                      />
                    ))}
                  </View>
                </>
              )}
              {avatarUri ? (
                <TouchableOpacity onPress={() => setAvatarUri('')} style={[styles.removePhotoBtn, { backgroundColor: `${colors.calendar}12`, borderColor: `${colors.calendar}25` }]}>
                  <Feather name="x" size={12} color={colors.calendar} />
                  <Text style={[styles.removePhotoBtnText, { color: colors.calendar }]}>Remove photo</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.hero}>
              <Text style={[styles.heroTitle, { color: colors.foreground }]}>Welcome to Life OS</Text>
              <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>Let's set up your profile. You can change everything later.</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>DISPLAY NAME</Text>
                <TextInput
                  style={[styles.fieldInput, { color: colors.foreground }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your full name"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="words"
                  autoFocus
                  returnKeyType="next"
                />
              </View>
              <View style={[styles.fieldDivider, { backgroundColor: colors.border }]} />
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>USERNAME</Text>
                <View style={styles.usernameRow}>
                  <Text style={[styles.atSign, { color: colors.mutedForeground }]}>@</Text>
                  <TextInput
                    style={[styles.fieldInput, { color: colors.foreground, flex: 1 }]}
                    value={username}
                    onChangeText={t => setUsername(t.replace(/[^a-zA-Z0-9_.]/g, ''))}
                    placeholder="yourhandle"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleNext}
                  />
                </View>
                <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>Letters, numbers, _ and . only · Optional</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleNext}
              style={[styles.primaryBtn, { backgroundColor: canProceed ? colors.primary : colors.muted }]}
              disabled={!canProceed}
            >
              <Text style={[styles.primaryBtnText, { color: canProceed ? '#fff' : colors.mutedForeground }]}>Continue</Text>
              <Feather name="arrow-right" size={18} color={canProceed ? '#fff' : colors.mutedForeground} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.hero}>
              <View style={[styles.heroBadge, { backgroundColor: `${colors.primary}15` }]}>
                <Avatar name={name} color={avatarColor} size={56} uri={avatarUri || undefined} />
              </View>
              <Text style={[styles.heroTitle, { color: colors.foreground }]}>Hi, {name.split(' ')[0]}!</Text>
              <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
                Add a short bio so others know what you're about. Skip it anytime — you can fill it in from your profile.
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.fieldWrap}>
                <View style={styles.bioHeader}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>BIO</Text>
                  <Text style={[styles.charCount, { color: bio.length > 144 ? colors.calendar : colors.mutedForeground }]}>
                    {bio.length}/160
                  </Text>
                </View>
                <TextInput
                  style={[styles.fieldInput, styles.fieldInputMulti, { color: colors.foreground }]}
                  value={bio}
                  onChangeText={t => setBio(t.slice(0, 160))}
                  placeholder="A short tagline about yourself…"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  textAlignVertical="top"
                  autoFocus
                />
              </View>
            </View>

            <View style={[styles.privacyNote, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}20` }]}>
              <Feather name="shield" size={14} color={colors.primary} />
              <Text style={[styles.privacyNoteText, { color: colors.mutedForeground }]}>
                Your bio is <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>public</Text> by default. You can change any field's visibility in Profile settings.
              </Text>
            </View>

            <TouchableOpacity onPress={handleFinish} style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.primaryBtnText, { color: '#fff' }]}>
                {bio.trim() ? 'Finish setup' : 'Skip for now'}
              </Text>
              <Feather name="check" size={18} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { padding: 2 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  stepLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, gap: 20 },

  avatarSection: { alignItems: 'center', paddingTop: 8, gap: 12 },
  avatarWrap: { position: 'relative' },
  cameraBtn: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#fff',
  },
  avatarHint: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  removePhotoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1,
  },
  removePhotoBtnText: { fontSize: 12, fontFamily: 'Inter_500Medium' },

  hero: { alignItems: 'center', gap: 8, paddingTop: 4 },
  heroBadge: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  heroTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5, textAlign: 'center' },
  heroSub: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22, maxWidth: 300 },

  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  fieldWrap: { paddingHorizontal: 16, paddingVertical: 14 },
  fieldDivider: { height: StyleSheet.hairlineWidth },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, marginBottom: 8 },
  usernameRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  atSign: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  fieldInput: { fontSize: 15, fontFamily: 'Inter_400Regular', padding: 0, minHeight: 22 },
  fieldInputMulti: { minHeight: 80, lineHeight: 22 },
  fieldHint: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 6 },
  bioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  charCount: { fontSize: 11, fontFamily: 'Inter_400Regular' },

  privacyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  privacyNoteText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: 14,
  },
  primaryBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
