// ─── Module accent colours ─────────────────────────────────────────────────
// Vivid / neon variants chosen to pop on a pure-black background.
const moduleColors = {
  work:     '#2979FF', // electric blue (same family as primary)
  calendar: '#FF6B00', // neon orange
  notes:    '#00D48C', // neon green
  budget:   '#00BFFF', // electric cyan
  people:   '#A855F7', // vivid violet
  social:   '#FF2D55', // neon pink-red
};

// ─── Shared base tokens (colour-scheme independent) ────────────────────────
const base = {
  text:                 '#FFFFFF',
  tint:                 '#0057FF',
  foreground:           '#FFFFFF',
  cardForeground:       '#FFFFFF',
  primary:              '#0057FF', // electric blue
  primaryForeground:    '#FFFFFF',
  secondaryForeground:  '#AAAAAA',
  muted:                '#111111',
  mutedForeground:      '#555555',
  accent:               '#0057FF',
  accentForeground:     '#FFFFFF',
  destructive:          '#FF3B30',
  destructiveForeground:'#FFFFFF',
  ...moduleColors,
};

// ─── Palettes ───────────────────────────────────────────────────────────────
// Both are dark so the black + electric-blue look is consistent regardless
// of the device's system appearance setting. The "light" variant is a hair
// lighter than "dark" so the OS switch doesn't feel broken.
const colors = {
  light: {
    ...base,
    background: '#0A0A0A',
    card:        '#111111',
    secondary:   '#111111',
    border:      '#1E1E1E',
    input:       '#111111',
  },
  dark: {
    ...base,
    background: '#000000',
    card:        '#0D0D0D',
    secondary:   '#0D0D0D',
    border:      '#1A1A1A',
    input:       '#0D0D0D',
  },
  radius: 12,
};

export default colors;
export { moduleColors };
