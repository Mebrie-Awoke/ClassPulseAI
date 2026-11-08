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
  background: '#0D1B2A',
  surface: '#152235',
  surfaceAlt: '#1C2E44',
  card: '#1A2D42',

  // Accents
  primary: '#00B4D8',
  primaryDim: '#0096C7',
  primaryGlow: 'rgba(0,180,216,0.15)',
  cyan: '#48CAE4',
  cyanDim: 'rgba(72,202,228,0.2)',

  // Text
  textPrimary: '#E8F4FD',
  textSecondary: '#8BACC8',
  textMuted: '#5A7B9B',

  // Status colors
  success: '#00D4AA',
  warning: '#FFB347',
  error: '#FF6B6B',
  live: '#FF4757',

  // Scanner State Colors
  stateWaiting: '#8BACC8',
  stateConnecting: '#FFB347',
  stateReady: '#00B4D8',
  stateAnalyzing: '#00B4D8',
  stateUpdated: '#00D4AA',
  stateLost: '#FF6B6B',
  stateReconnecting: '#FFB347',
  statePaused: '#FFB347',
  stateStopped: '#5A7B9B',

  // Activity levels
  activityQuiet: '#00D4AA',
  activityModerate: '#00B4D8',
  activityBusy: '#FFB347',
  activityPacked: '#FF6B6B',
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
