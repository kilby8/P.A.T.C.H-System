// ============================================================
// P.A.T.C.H. SYSTEM — Cyber-Gladiatorial Theme
// Aesthetic: dystopian corporate media terminal
// ============================================================
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

// ── Color Palette ────────────────────────────────────────────
export const Colors = {
  // Backgrounds
  bgVoid: '#050507',
  bgDeep: '#0a0c10',
  bgCard: '#0e1118',
  bgElevated: '#141820',

  // Neon Cyan — data / Overshield metrics
  cyan: '#00ffe7',
  cyanDim: '#00bfac',
  cyanGlow: 'rgba(0, 255, 231, 0.18)',

  // Warning Amber — caution states
  amber: '#ffb300',
  amberDim: '#cc8f00',
  amberGlow: 'rgba(255, 179, 0, 0.2)',

  // Crimson — Hardware Trauma / critical alerts
  crimson: '#ff2d55',
  crimsonDim: '#cc0033',
  crimsonGlow: 'rgba(255, 45, 85, 0.22)',

  // Matrix Green — accents / active nodes
  green: '#39ff14',
  greenDim: '#27b30e',
  greenGlow: 'rgba(57, 255, 20, 0.15)',

  // Neural Shock — pulsing magenta alert
  shock: '#ff00ff',
  shockGlow: 'rgba(255, 0, 255, 0.25)',

  // Typography
  textPrimary: '#e8eaf0',
  textSecondary: '#7a8299',
  textMuted: '#3d4358',

  // Borders
  borderDefault: '#1e2535',
  borderActive: '#00ffe7',
  borderDanger: '#ff2d55',
} as const;

// ── Typography ───────────────────────────────────────────────
export const Typography = {
  displayLarge: { fontSize: 32, fontWeight: '900', letterSpacing: 4, textTransform: 'uppercase' } as TextStyle,
  displayMedium: { fontSize: 24, fontWeight: '800', letterSpacing: 3, textTransform: 'uppercase' } as TextStyle,
  heading: { fontSize: 18, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' } as TextStyle,
  subheading: { fontSize: 14, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' } as TextStyle,
  body: { fontSize: 14, fontWeight: '400', letterSpacing: 0.5 } as TextStyle,
  mono: { fontSize: 12, fontWeight: '400', fontFamily: 'monospace', letterSpacing: 1 } as TextStyle,
  stat: { fontSize: 28, fontWeight: '900', letterSpacing: 2 } as TextStyle,
  statSmall: { fontSize: 20, fontWeight: '800', letterSpacing: 1.5 } as TextStyle,
} as const;

// ── Spacing ──────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// ── Border Radii ─────────────────────────────────────────────
export const Radius = {
  sm: 4,
  md: 6,
  lg: 10,
  pill: 999,
} as const;

// ── Glow / Shadow Helpers ────────────────────────────────────
export const Shadows = {
  cyanGlow: {
    shadowColor: Colors.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  } as ViewStyle,
  crimsonGlow: {
    shadowColor: Colors.crimson,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 8,
  } as ViewStyle,
  amberGlow: {
    shadowColor: Colors.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  } as ViewStyle,
  shockGlow: {
    shadowColor: Colors.shock,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 12,
  } as ViewStyle,
  greenGlow: {
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  } as ViewStyle,
} as const;

// ── Reusable Card Styles ─────────────────────────────────────
// "Glitch border" effect is achieved by layering a thin glowing border
// on top of the card background with a subtle offset scan-line accent.
export const CardStyles = StyleSheet.create({
  base: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    padding: Spacing.lg,
  },
  glow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cyan,
    padding: Spacing.lg,
    ...Shadows.cyanGlow,
  },
  danger: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.crimson,
    padding: Spacing.lg,
    ...Shadows.crimsonGlow,
  },
  warning: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.amber,
    padding: Spacing.lg,
    ...Shadows.amberGlow,
  },
  shock: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.shock,
    padding: Spacing.lg,
    ...Shadows.shockGlow,
  },
});

// ── Global Screen Container ───────────────────────────────────
export const GlobalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgVoid,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgVoid,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderDefault,
    marginVertical: Spacing.md,
  },
  dividerGlow: {
    height: 1,
    backgroundColor: Colors.cyan,
    marginVertical: Spacing.md,
    opacity: 0.4,
  },
});
