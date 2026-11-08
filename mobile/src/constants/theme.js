/**
 * ClassPulse AI — Theme & Configuration Constants.
 *
 * API URL Configuration:
 * In development and production, this reads from the EXPO_PUBLIC_API_BASE_URL
 * environment variable (automatically inlined by Expo during bundling).
 *
 * For local testing on a physical phone:
 * Set EXPO_PUBLIC_API_BASE_URL=http://<YOUR_LAN_IP>:8000 in mobile/.env
 *
 * For Android emulator testing:
 * http://10.0.2.2:8000 maps directly to the host machine's localhost.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://classpulseai.onrender.com';

export const COLORS = {
  // Backgrounds
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF3F7',
  card: '#FFFFFF',
  border: '#DFE6ED',

  // Accents
  primary: '#087E9A',
  primaryDim: '#06677F',
  primaryGlow: 'rgba(8,126,154,0.09)',
  cyan: '#48AFC7',
  cyanDim: 'rgba(8,126,154,0.12)',

  // Text
  textPrimary: '#17283A',
  textSecondary: '#526477',
  textMuted: '#718094',

  // Status colors
  success: '#168A64',
  warning: '#A86700',
  error: '#B54747',
  live: '#B54747',

  // Scanner State Colors
  stateWaiting: '#526477',
  stateConnecting: '#A86700',
  stateReady: '#087E9A',
  stateAnalyzing: '#087E9A',
  stateUpdated: '#168A64',
  stateLost: '#B54747',
  stateReconnecting: '#A86700',
  statePaused: '#A86700',
  stateStopped: '#718094',

  // Activity levels
  activityQuiet: '#168A64',
  activityModerate: '#087E9A',
  activityBusy: '#A86700',
  activityPacked: '#B54747',
};

export const FONTS = {
  regular: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 26,
    xxxl: 32,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

/** Analysis loop interval in milliseconds */
export const ANALYSIS_INTERVAL_MS = 2000;

/** Network request timeout in milliseconds */
export const REQUEST_TIMEOUT_MS = 10000;

/** Time after which unrefreshed detections are flagged as stale */
export const STALE_THRESHOLD_MS = 6000;

/** Frame JPEG compression quality (0.0 to 1.0) */
export const FRAME_QUALITY = 0.4;
