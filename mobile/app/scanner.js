/**
 * ClassPulse AI — Live Scanner Screen.
 *
 * Implements:
 *   - Continuous, flicker-free CameraView preview.
 *   - 9-state reactive scanner state badge.
 *   - Frame rate / freshness / stale indicator.
 *   - Contextual commentary overlay.
 *   - Pause, resume, retry, and stop controls.
 *   - Safe lifecycle cleanup on unmount.
 */
import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AlertTriangle, Camera, ChevronLeft, Pause, Play, RefreshCw, Square } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONTS } from '../src/constants/theme';
import { useLiveDetection, SCANNER_STATES } from '../src/hooks/useLiveDetection';
import { getScannerStateMeta, formatProcessingTime } from '../src/utils/formatDetection';
import DetectionStats from '../src/components/DetectionStats';
import CommentaryCard from '../src/components/CommentaryCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CAMERA_HEIGHT = Math.round(SCREEN_HEIGHT * 0.48);

export default function ScannerScreen() {
  const router = useRouter();
  const { environment } = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const {
    scannerState,
    isRunning,
    isPaused,
    isAnalyzing,
    lastResult,
    lastUpdatedTimestamp,
    isStale,
    error,
    frameCount,
    startDetection,
    stopDetection,
    togglePause,
  } = useLiveDetection(cameraRef, environment);

  // Handle camera permissions
  useEffect(() => {
    if (permission && !permission.granted && !permission.canAskAgain) {
      Alert.alert(
        'Camera Permission Required',
        'ClassPulse AI needs camera access to analyze your environment. Please enable it in your device settings.',
        [{ text: 'Return Home', onPress: () => router.back() }]
      );
    }
  }, [permission, router]);

  // When camera view initializes, kick off detection
  const handleCameraReady = useCallback(() => {
    if (!isRunning) {
      startDetection();
    }
  }, [isRunning, startDetection]);

  // Finish scan session and navigate to results screen
  const handleStopAndShowResults = useCallback(() => {
    stopDetection();
    router.push({
      pathname: '/result',
      params: {
        environment: environment ?? 'classroom',
        result: lastResult ? JSON.stringify(lastResult) : null,
      },
    });
  }, [stopDetection, lastResult, environment, router]);

  // State metadata
  const stateMeta = getScannerStateMeta(scannerState);
  const envTitle = environment === 'library' ? 'Library' : 'Classroom';

  // Permission: loading
  if (!permission) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Initializing camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Permission: denied
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <View style={styles.permIcon}>
            <Camera color={COLORS.primary} size={27} strokeWidth={1.8} />
          </View>
          <Text style={styles.permTitle}>Camera Permission Required</Text>
          <Text style={styles.permBody}>
            ClassPulse AI needs real-time camera access to detect environment density, chairs, and books.
          </Text>
          <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
            <Text style={styles.grantButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
            <Text style={styles.goBackText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => {
            stopDetection();
            router.back();
          }}
          style={styles.backTap}
        >
          <View style={styles.exitContent}>
            <ChevronLeft color={COLORS.textSecondary} size={17} strokeWidth={2} />
            <Text style={styles.backArrow}>Exit</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.envLabel}>{envTitle}</Text>

        {/* Reactive Scanner State Pill */}
        <View style={[styles.statePill, { borderColor: stateMeta.color }]}>
          <View style={[styles.stateDot, { backgroundColor: stateMeta.dotColor }]} />
          <Text style={[styles.stateText, { color: stateMeta.color }]}>
            {stateMeta.label.toUpperCase()}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Continuous Camera Preview */}
        <View style={[styles.cameraWrap, { height: CAMERA_HEIGHT }]}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            onCameraReady={handleCameraReady}
          />

          {/* Analysis Active Scan Overlay */}
          {isAnalyzing && (
            <View style={styles.scanOverlay} pointerEvents="none">
              <View style={styles.scanLine} />
              <Text style={styles.scanLabel}>ANALYZING ENVIRONMENT...</Text>
            </View>
          )}

          {/* Frame Counter Badge */}
          <View style={styles.frameBadge}>
            <Text style={styles.frameBadgeText}>
              {frameCount} frame{frameCount !== 1 ? 's' : ''} evaluated
            </Text>
          </View>
        </View>

        {/* Connection Failure / Error Banner with Retry */}
        {error ? (
          <View style={styles.errorBanner}>
            <View style={styles.errorTextRow}>
              <AlertTriangle color={COLORS.error} size={16} strokeWidth={1.8} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
            {scannerState === SCANNER_STATES.CONNECTION_LOST && (
              <TouchableOpacity style={styles.retryBtn} onPress={startDetection}>
                <RefreshCw color={COLORS.error} size={13} />
                <Text style={styles.retryBtnText}>Retry Connection</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* Live Detection Statistics */}
        <View style={styles.statsWrap}>
          <DetectionStats
            result={lastResult}
            isAnalyzing={isAnalyzing}
            isStale={isStale}
            lastUpdatedTimestamp={lastUpdatedTimestamp}
          />
        </View>

        {/* Contextual Commentary Card */}
        <CommentaryCard
          commentary={lastResult?.commentary ?? null}
          isAnalyzing={isAnalyzing}
        />

        {/* Control Action Buttons */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.btn, styles.btnPause, !isRunning && styles.btnDisabled]}
            onPress={togglePause}
            disabled={!isRunning}
            activeOpacity={0.8}
          >
            {isPaused ? <Play color={COLORS.textSecondary} size={16} /> : <Pause color={COLORS.textSecondary} size={16} />}
            <Text style={styles.btnPauseText}>{isPaused ? 'Resume' : 'Pause'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnStop]}
            onPress={handleStopAndShowResults}
            activeOpacity={0.8}
          >
            <Square color={COLORS.background} size={15} fill={COLORS.background} />
            <Text style={styles.btnStopText}>Stop & Results</Text>
          </TouchableOpacity>
        </View>

        {/* Processing Metric Footnote */}
        {lastResult?.processing_time_ms ? (
          <Text style={styles.procTime}>
            Inference latency: {formatProcessingTime(lastResult.processing_time_ms)} · CPU Pipeline
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: SPACING.xl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  loadingText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.xs,
  },
  backTap: { paddingVertical: SPACING.xs, paddingRight: SPACING.xs },
  exitContent: { flexDirection: 'row', alignItems: 'center' },
  backArrow: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  envLabel: { flex: 1, color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: '700', textAlign: 'center' },

  statePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F4F7',
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    maxWidth: '43%',
  },
  stateDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  stateText: { flexShrink: 1, fontSize: FONTS.sizes.xs - 1, fontWeight: '700' },

  // Camera Wrap
  cameraWrap: { width: '100%', backgroundColor: '#000', overflow: 'hidden' },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8,126,154,0.1)',
  },
  scanLine: { width: '78%', height: 2, backgroundColor: COLORS.primary, opacity: 0.75 },
  scanLabel: {
    marginTop: SPACING.sm,
    color: COLORS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: '800',
    letterSpacing: 0,
  },
  frameBadge: {
    position: 'absolute',
    bottom: SPACING.xs,
    right: SPACING.sm,
    backgroundColor: 'rgba(9,19,33,0.88)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  frameBadgeText: { color: 'rgba(255, 255, 255, 0.7)', fontSize: FONTS.sizes.xs - 1 },

  // Error Banner
  errorBanner: {
    backgroundColor: 'rgba(181,71,71,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(181,71,71,0.24)',
    padding: SPACING.sm + 2,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  errorTextRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: 2 },
  errorBannerText: { flex: 1, color: COLORS.error, fontSize: FONTS.sizes.xs + 1, fontWeight: '600' },
  retryBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
    backgroundColor: 'rgba(181,71,71,0.08)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  retryBtnText: { color: COLORS.error, fontSize: FONTS.sizes.xs, fontWeight: '700' },

  // Stats Wrap
  statsWrap: { marginTop: SPACING.md },

  // Action Controls
  controls: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  btn: {
    flex: 1,
    paddingVertical: SPACING.md - 2,
    borderRadius: RADIUS.md,
    minHeight: 50,
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPause: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnStop: { backgroundColor: COLORS.primary },
  btnDisabled: { opacity: 0.4 },
  btnPauseText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: FONTS.sizes.sm },
  btnStopText: { color: COLORS.background, fontWeight: '700', fontSize: FONTS.sizes.sm },

  procTime: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs - 1,
    marginTop: SPACING.sm,
  },

  // Permission Fallback Screen
  permIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  permTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  permBody: {
    fontSize: FONTS.sizes.md - 1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  grantButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  grantButtonText: { color: COLORS.background, fontWeight: '700', fontSize: FONTS.sizes.md },
  goBackButton: { padding: SPACING.md },
  goBackText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
});
