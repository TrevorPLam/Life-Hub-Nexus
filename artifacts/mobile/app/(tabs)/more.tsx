import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useBudget } from '@/context/BudgetContext';
import { usePeople } from '@/context/PeopleContext';
import { useSocial } from '@/context/SocialContext';
import { useApp } from '@/context/AppContext';
import { Avatar } from '@/components/ui/Avatar';

interface ModuleCardProps {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  onPress: () => void;
  badge?: string;
}

function ModuleCard({ title, subtitle, icon, color, onPress, badge }: ModuleCardProps) {
  const colors = useColors();
  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.cardIcon, { backgroundColor: `${color}18` }]}>
        <Feather name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      </View>
      {badge && (
        <View style={[styles.badge, { backgroundColor: `${color}20` }]}>
          <Text style={[styles.badgeText, { color }]}>{badge}</Text>
        </View>
      )}
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getMonthlyBalance, getMonthlyExpenses } = useBudget();
  const { people, getOverdueTouchups, getTodayBirthdays } = usePeople();
  const { posts } = useSocial();
  const { profile } = useApp();

  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const balance = getMonthlyBalance();
  const expenses = getMonthlyExpenses();
  const overdueTouch = getOverdueTouchups().length;
  const birthdays = getTodayBirthdays().length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>More</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === 'web' ? 100 : 120 }]}>

        {/* Profile card */}
        <TouchableOpacity style={[styles.profileCard, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]} onPress={() => router.push('/profile')}>
          <Avatar name={profile.name || 'You'} color={profile.avatarColor} size={50} uri={profile.avatarUri || undefined} />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>{profile.name}</Text>
            <Text style={[styles.profileBio, { color: colors.mutedForeground }]}>{profile.bio || 'Living intentionally.'}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>MODULES</Text>

        <ModuleCard
          title="Budget"
          subtitle={`$${expenses.toLocaleString()} spent · $${Math.abs(balance).toLocaleString()} ${balance >= 0 ? 'left' : 'over'}`}
          icon="dollar-sign"
          color={colors.budget}
          onPress={() => router.push('/budget')}
        />

        <ModuleCard
          title="People"
          subtitle={`${people.length} contacts`}
          icon="users"
          color={colors.people}
          onPress={() => router.push('/people')}
          badge={overdueTouch + birthdays > 0 ? `${overdueTouch + birthdays}` : undefined}
        />

        <ModuleCard
          title="Social"
          subtitle={`${posts.length} posts in your feed`}
          icon="activity"
          color={colors.social}
          onPress={() => router.push('/social')}
        />

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SETTINGS</Text>

        <View style={[styles.settingsGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { icon: 'user', label: 'Profile', color: colors.primary, route: '/profile' },
            { icon: 'shield', label: 'Privacy', color: colors.budget, route: '/profile/edit' },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => router.push(item.route as any)}
              style={[styles.settingRow, i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
            >
              <View style={[styles.settingIcon, { backgroundColor: `${item.color}15` }]}>
                <Feather name={item.icon as any} size={16} color={item.color} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>{item.label}</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 10 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  profileBio: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginTop: 8, marginBottom: 4 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  cardIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  cardSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginRight: 4 },
  badgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  settingsGroup: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  settingIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
});
