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
  background: '#091321',
  surface: '#101D2E',
  surfaceAlt: '#182A3E',
  card: '#111F32',

  // Accents
  primary: '#54C7E9',
  primaryDim: '#2AAED5',
  primaryGlow: 'rgba(84,199,233,0.12)',
  cyan: '#8BE0F2',
  cyanDim: 'rgba(139,224,242,0.16)',

  // Text
  textPrimary: '#F4F8FC',
  textSecondary: '#AAB9C9',
  textMuted: '#728399',

  // Status colors
  success: '#48CFA2',
  warning: '#E8B45D',
  error: '#F07878',
  live: '#ED7777',

  // Scanner State Colors
  stateWaiting: '#AAB9C9',
  stateConnecting: '#E8B45D',
  stateReady: '#54C7E9',
  stateAnalyzing: '#54C7E9',
  stateUpdated: '#48CFA2',
  stateLost: '#F07878',
  stateReconnecting: '#E8B45D',
  statePaused: '#E8B45D',
  stateStopped: '#728399',

  // Activity levels
  activityQuiet: '#48CFA2',
  activityModerate: '#54C7E9',
  activityBusy: '#E8B45D',
  activityPacked: '#F07878',
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
