/**
 * ClassPulse AI — useLiveDetection Hook.
 *
 * Implements the 9-state reactive scanner lifecycle:
 *   - waiting_camera
 *   - connecting
 *   - ready
 *   - analyzing
 *   - updated
 *   - connection_lost
 *   - reconnecting
 *   - paused
 *   - stopped
 *
 * Guarantees:
 *   - Frame capture serialization (strictly one request in-flight).
 *   - Continuous, stutter-free camera preview.
 *   - Automatic shutter-sound muting where supported.
 *   - Stale result detection (freshness timestamp).
 *   - Safe component unmount cleanup with no memory leaks or setState on unmounted components.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { detectObjects, checkReadiness } from '../services/api';
import {
  ANALYSIS_INTERVAL_MS,
  FRAME_QUALITY,
  STALE_THRESHOLD_MS,
} from '../constants/theme';

export const SCANNER_STATES = {
  WAITING_CAMERA: 'waiting_camera',
  CONNECTING: 'connecting',
  READY: 'ready',
  ANALYZING: 'analyzing',
  UPDATED: 'updated',
  CONNECTION_LOST: 'connection_lost',
  RECONNECTING: 'reconnecting',
  PAUSED: 'paused',
  STOPPED: 'stopped',
};

export function useLiveDetection(cameraRef, environment, intervalMs = ANALYSIS_INTERVAL_MS) {
  const [scannerState, setScannerState] = useState(SCANNER_STATES.WAITING_CAMERA);
  const [lastResult, setLastResult] = useState(null);
  const [lastUpdatedTimestamp, setLastUpdatedTimestamp] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState(null);
  const [frameCount, setFrameCount] = useState(0);
  const [frameDimensions, setFrameDimensions] = useState({ width: 0, height: 0 });

  // Synchronization refs (do not trigger re-renders)
  const isMountedRef = useRef(true);
  const isRunningRef = useRef(false);
  const isPausedRef = useRef(false);
  const inFlightRef = useRef(false);
  const intervalRef = useRef(null);
  const freshnessTimerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const consecutiveErrorsRef = useRef(0);

  // Keep mounted status current
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Periodic freshness check (updates isStale flag if results get old)
  useEffect(() => {
    freshnessTimerRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      if (lastUpdatedTimestamp) {
        const age = Date.now() - lastUpdatedTimestamp;
        setIsStale(age > STALE_THRESHOLD_MS);
      }
    }, 1000);

    return () => {
      if (freshnessTimerRef.current) clearInterval(freshnessTimerRef.current);
    };
  }, [lastUpdatedTimestamp]);

  /**
   * Capture a single frame from the camera and transmit to backend.
   */
  const captureAndAnalyze = useCallback(async () => {
    if (!isMountedRef.current) return;
    if (!isRunningRef.current || isPausedRef.current) return;
    if (inFlightRef.current) return; // Prevent overlapping requests
    if (!cameraRef.current) return;

    inFlightRef.current = true;

    // Transition state to analyzing (or reconnecting if recovering)
    if (consecutiveErrorsRef.current > 0) {
      setScannerState(SCANNER_STATES.RECONNECTING);
    } else {
      setScannerState(SCANNER_STATES.ANALYZING);
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Capture frame — quality compressed, shutter muted
      const photo = await cameraRef.current.takePictureAsync({
        quality: FRAME_QUALITY,
        base64: false,
        skipProcessing: true,
        shutterSound: false,
      });

      if (!isMountedRef.current) return;
      if (!photo?.uri) {
        throw new Error('Camera did not return a valid frame image.');
      }

      // Send to backend with cancellation support
      const result = await detectObjects(photo.uri, environment, controller.signal);

      if (!isMountedRef.current) return;

      const imgWidth = result?.image_width || photo?.width || 0;
      const imgHeight = result?.image_height || photo?.height || 0;
      if (imgWidth > 0 && imgHeight > 0) {
        setFrameDimensions({ width: imgWidth, height: imgHeight });
      }

      const enrichedResult = {
        ...result,
        image_width: imgWidth,
        image_height: imgHeight,
      };

      // Reset error counter and update state
      consecutiveErrorsRef.current = 0;
      setLastResult(enrichedResult);
      setLastUpdatedTimestamp(Date.now());
      setIsStale(false);
      setError(null);
      setFrameCount(prev => prev + 1);
      setScannerState(SCANNER_STATES.UPDATED);
    } catch (err) {
      if (!isMountedRef.current) return;
      if (err.name === 'AbortError') {
        // Intentionally aborted (e.g. pause/stop/unmount)
        return;
      }

      consecutiveErrorsRef.current += 1;
      const errorMsg = err.message || 'Detection failed.';
      setError(errorMsg);

      if (consecutiveErrorsRef.current >= 2) {
        setScannerState(SCANNER_STATES.CONNECTION_LOST);
      }
    } finally {
      inFlightRef.current = false;
      abortControllerRef.current = null;
    }
  }, [cameraRef, environment]);

  /**
   * Start detection: ping server readiness, then initiate frame loop.
   */
  const startDetection = useCallback(async () => {
    if (!isMountedRef.current) return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    isRunningRef.current = true;
    isPausedRef.current = false;
    consecutiveErrorsRef.current = 0;
    setError(null);
    setScannerState(SCANNER_STATES.CONNECTING);

    // Initial server readiness ping
    const { ready, message } = await checkReadiness();
    if (!isMountedRef.current) return;

    if (!ready) {
      setError(message);
      setScannerState(SCANNER_STATES.CONNECTING);
    } else {
      setScannerState(SCANNER_STATES.READY);
    }

    // Run first capture tick, then schedule interval
    captureAndAnalyze();
    intervalRef.current = setInterval(captureAndAnalyze, intervalMs);
  }, [captureAndAnalyze, intervalMs]);

  /**
   * Stop detection and cleanly release active resources.
   */
  const stopDetection = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    inFlightRef.current = false;
    isRunningRef.current = false;
    isPausedRef.current = false;

    if (isMountedRef.current) {
      setScannerState(SCANNER_STATES.STOPPED);
    }
  }, []);

  /**
   * Toggle between paused and active scanning states.
   */
  const togglePause = useCallback(() => {
    if (!isRunningRef.current) return;

    if (isPausedRef.current) {
      // Resume scanning
      isPausedRef.current = false;
      setScannerState(SCANNER_STATES.ANALYZING);
      captureAndAnalyze();
    } else {
      // Pause scanning
      isPausedRef.current = true;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      inFlightRef.current = false;
      setScannerState(SCANNER_STATES.PAUSED);
    }
  }, [captureAndAnalyze]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      stopDetection();
      if (freshnessTimerRef.current) clearInterval(freshnessTimerRef.current);
    };
  }, [stopDetection]);

  return {
    scannerState,
    isRunning: isRunningRef.current,
    isPaused: isPausedRef.current,
    isAnalyzing: scannerState === SCANNER_STATES.ANALYZING || scannerState === SCANNER_STATES.RECONNECTING,
    lastResult,
    lastUpdatedTimestamp,
    isStale,
    error,
    frameCount,
    frameDimensions,
    startDetection,
    stopDetection,
    togglePause,
  };
}
