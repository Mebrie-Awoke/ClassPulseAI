/**
 * ClassPulse AI — Live Scanner Screen
 *
 * Opens the camera, runs periodic object detection, displays results
 * as an overlay over the camera preview.
 *
 * Key design decisions:
 * - CameraView from expo-camera fills the screen
 * - takePictureAsync captures frames for analysis
 * - Detection stats and commentary overlay the camera preview
 * - Analysis stops cleanly on unmount (no memory leaks)
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
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
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';
import { useLiveDetection } from '../hooks/useLiveDetection';
import DetectionStats from '../components/DetectionStats';
import CommentaryCard from '../components/CommentaryCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CAMERA_HEIGHT = SCREEN_HEIGHT * 0.52;

export default function ScannerScreen() {
  const router = useRouter();
  const { environment } = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const {
    isRunning,
    isPaused,
    isAnalyzing,
    lastResult,
    error,
    frameCount,
    startDetection,
    stopDetection,
    togglePause,
  } = useLiveDetection(cameraRef, environment);

  // Request permission on mount
  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission().then(result => {
        if (!result.granted) {
          Alert.alert(
            'Camera Permission Required',
            'RoomPulse needs camera access to analyze your environment. Please enable it in your device settings.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
        }
      });
    }
  }, [permission]);

  // Start detection when camera is ready and permission granted
  const handleCameraReady = useCallback(() => {
    if (!isRunning) {
      startDetection();
    }
  }, [isRunning, startDetection]);

  // Stop and navigate to results
  const handleStop = useCallback(() => {
    stopDetection();
    router.push({
      pathname: '/result',
      params: {
        environment,
        result: lastResult ? JSON.stringify(lastResult) : null,
      },
    });
  }, [stopDetection, lastResult, environment, router]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, []);

  const envLabel = environment === 'library' ? '📖 Library' : '🏫 Classroom';

  // --- Permission loading ---
  if (!permission) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Checking camera permission…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- Permission denied ---
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>📷</Text>
          <Text style={styles.errorTitle}>Camera Access Needed</Text>
          <Text style={styles.errorBody}>
            RoomPulse needs camera access to analyze your environment.
          </Text>
          <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
            <Text style={styles.permButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backTap}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.envLabel}>{envLabel}</Text>
        <View style={styles.liveIndicator}>
          <View style={[styles.liveDot, !isRunning && styles.liveDotOff]} />
          <Text style={styles.liveText}>{isRunning ? (isPaused ? 'PAUSED' : 'LIVE') : 'IDLE'}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Camera Preview */}
        <View style={[styles.cameraContainer, { height: CAMERA_HEIGHT }]}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            onCameraReady={handleCameraReady}
          />

          {/* Camera overlay */}
          {isAnalyzing && (
            <View style={styles.scanOverlay}>
              <View style={styles.scanLine} />
              <Text style={styles.scanningLabel}>Scanning…</Text>
            </View>
          )}

          {/* Frame counter */}
          <View style={styles.frameCounter}>
            <Text style={styles.frameCounterText}>
              {frameCount} frame{frameCount !== 1 ? 's' : ''} analyzed
            </Text>
          </View>
        </View>

        {/* Error banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠ {error}</Text>
          </View>
        )}

        {/* Detection stats */}
        <View style={styles.statsContainer}>
          <DetectionStats result={lastResult} isAnalyzing={isAnalyzing} />
        </View>

        {/* Commentary */}
        <CommentaryCard
          commentary={lastResult?.commentary}
          isAnalyzing={isAnalyzing}
        />

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, styles.pauseButton]}
            onPress={togglePause}
            disabled={!isRunning}
          >
            <Text style={styles.controlButtonText}>
              {isPaused ? '▶  Resume' : '⏸  Pause'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.stopButton]}
            onPress={handleStop}
          >
            <Text style={styles.stopButtonText}>⏹  Stop & Results</Text>
          </TouchableOpacity>
        </View>

        {/* Processing time */}
        {lastResult?.processing_time_ms && (
          <Text style={styles.processingTime}>
            Last analysis: {Math.round(lastResult.processing_time_ms)}ms
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
  },
  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceAlt,
  },
  backTap: {
    padding: SPACING.xs,
  },
  backArrow: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.xl,
    fontWeight: '600',
  },
  envLabel: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,71,87,0.15)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.live,
    marginRight: 5,
  },
  liveDotOff: {
    backgroundColor: COLORS.textMuted,
  },
  liveText: {
    color: COLORS.live,
    fontSize: FONTS.sizes.xs,
    fontWeight: '800',
    letterSpacing: 1,
  },
  // Camera
  cameraContainer: {
    width: '100%',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,180,216,0.08)',
  },
  scanLine: {
    width: '80%',
    height: 2,
    backgroundColor: COLORS.primary,
    opacity: 0.6,
  },
  scanningLabel: {
    marginTop: SPACING.sm,
    color: COLORS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    letterSpacing: 2,
  },
  frameCounter: {
    position: 'absolute',
    bottom: SPACING.xs,
    right: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  frameCounterText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FONTS.sizes.xs,
  },
  // Error banner
  errorBanner: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
    padding: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  errorBannerText: {
    color: COLORS.error,
    fontSize: FONTS.sizes.sm,
  },
  // Stats
  statsContainer: {
    marginTop: SPACING.md,
  },
  // Controls
  controls: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  controlButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseButton: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  stopButton: {
    backgroundColor: COLORS.primary,
  },
  controlButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: FONTS.sizes.md,
  },
  stopButtonText: {
    color: COLORS.background,
    fontWeight: '700',
    fontSize: FONTS.sizes.md,
  },
  processingTime: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
    marginTop: SPACING.sm,
  },
  // Permission screens
  errorText: {
    fontSize: 56,
    marginBottom: SPACING.md,
  },
  errorTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  errorBody: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  permButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  permButtonText: {
    color: COLORS.background,
    fontWeight: '700',
    fontSize: FONTS.sizes.md,
  },
  backButton: {
    padding: SPACING.md,
  },
  backButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
  },
});
