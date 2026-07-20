import colors from '@/constants/colors';

/**
 * Returns the design tokens for the current color scheme.
 *
 * The app uses a black + electric-blue design system. Both the light and
 * dark palettes in constants/colors.ts are dark, so we always return the
 * dark palette to guarantee the black look regardless of the device's
 * system appearance setting.
 */
export function useColors() {
  const palette = colors.dark;
  return { ...palette, radius: colors.radius };
}
