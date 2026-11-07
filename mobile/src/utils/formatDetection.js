/**
 * ClassPulse AI — Detection Result & Scanner Formatting Utilities.
 */
import { COLORS } from '../constants/theme';
import { SCANNER_STATES } from '../hooks/useLiveDetection';

/**
 * Map an activity level string to a display color.
 */
export function activityColor(level) {
  const map = {
    quiet: COLORS.activityQuiet,
    moderate: COLORS.activityModerate,
    busy: COLORS.activityBusy,
    packed: COLORS.activityPacked,
  };
  return map[level] ?? COLORS.primary;
}

/**
 * Map an activity level to a human-readable label with indicator dot.
 */
export function activityLabel(level) {
  const map = {
    quiet: '🟢 Quiet',
    moderate: '🔵 Moderate',
    busy: '🟡 Busy',
    packed: '🔴 Packed',
  };
  return map[level] ?? level;
}

/**
 * Format milliseconds into human-readable string.
 */
export function formatProcessingTime(ms) {
  if (!ms) return '';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Format last successful update timestamp into human-readable freshness label.
 */
export function formatFreshness(timestamp) {
  if (!timestamp) return 'No scan data yet';
  const ageMs = Date.now() - timestamp;
  const ageSec = Math.floor(ageMs / 1000);

  if (ageSec < 2) return 'Updated just now';
  if (ageSec < 60) return `Updated ${ageSec}s ago`;
  const ageMin = Math.floor(ageSec / 60);
  return `Updated ${ageMin}m ago`;
}

/**
 * Retrieve metadata (badge label, color, icon) for each scanner lifecycle state.
 */
export function getScannerStateMeta(state) {
  switch (state) {
    case SCANNER_STATES.WAITING_CAMERA:
      return { label: 'Waiting for camera', color: COLORS.stateWaiting, dotColor: COLORS.stateWaiting };
    case SCANNER_STATES.CONNECTING:
      return { label: 'Connecting to AI server', color: COLORS.stateConnecting, dotColor: COLORS.stateConnecting };
    case SCANNER_STATES.READY:
      return { label: 'Camera ready', color: COLORS.stateReady, dotColor: COLORS.stateReady };
    case SCANNER_STATES.ANALYZING:
      return { label: 'Analyzing environment', color: COLORS.stateAnalyzing, dotColor: COLORS.stateAnalyzing };
    case SCANNER_STATES.UPDATED:
      return { label: 'Results updated', color: COLORS.stateUpdated, dotColor: COLORS.stateUpdated };
    case SCANNER_STATES.CONNECTION_LOST:
      return { label: 'Connection lost', color: COLORS.stateLost, dotColor: COLORS.stateLost };
    case SCANNER_STATES.RECONNECTING:
      return { label: 'Reconnecting...', color: COLORS.stateReconnecting, dotColor: COLORS.stateReconnecting };
    case SCANNER_STATES.PAUSED:
      return { label: 'Scanning paused', color: COLORS.statePaused, dotColor: COLORS.statePaused };
    case SCANNER_STATES.STOPPED:
      return { label: 'Scanning stopped', color: COLORS.stateStopped, dotColor: COLORS.stateStopped };
    default:
      return { label: 'Idle', color: COLORS.textMuted, dotColor: COLORS.textMuted };
  }
}

/**
 * Extract non-zero tracked detections for UI summary cards.
 */
export function buildDetectionSummary(result) {
  if (!result) return [];
  const items = [
    { key: 'people_count', label: 'People', icon: '👤' },
    { key: 'chair_count', label: 'Chairs', icon: '🪑' },
    { key: 'book_count', label: 'Books', icon: '📚' },
    { key: 'laptop_count', label: 'Laptops', icon: '💻' },
    { key: 'tv_count', label: 'Screens', icon: '🖥️' },
  ];

  return items
    .map(({ key, label, icon }) => ({
      label,
      icon,
      count: result[key] ?? 0,
    }))
    .filter(item => item.count > 0);
}

/**
 * Environment header icon helper.
 */
export function environmentIcon(environment) {
  return environment === 'library' ? '📖' : '🏫';
}
