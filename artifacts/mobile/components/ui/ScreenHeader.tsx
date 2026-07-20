import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';

interface ScreenHeaderProps {
  title: string;
  /** Override the default router.back() behaviour */
  onBack?: () => void;
  /** Element rendered on the right side (e.g. an icon button) */
  rightElement?: React.ReactNode;
  /** Hide the bottom border */
  noBorder?: boolean;
}

/**
 * Consistent push-navigation header used across all non-modal detail screens.
 * Handles safe-area insets internally so callers don't have to.
 */
export function ScreenHeader({ title, onBack, rightElement, noBorder }: ScreenHeaderProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  return (
    <View
      style={[
        styles.header,
        { paddingTop: topPad + 14, backgroundColor: colors.background, borderBottomColor: colors.border },
        !noBorder && { borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
    >
      <TouchableOpacity
        onPress={onBack ?? (() => router.back())}
        style={styles.side}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="arrow-left" size={22} color={colors.foreground} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
        {title}
      </Text>

      <View style={[styles.side, styles.right]}>
        {rightElement ?? null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  side: { width: 40, alignItems: 'flex-start' },
  right: { alignItems: 'flex-end' },
  title: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
});
