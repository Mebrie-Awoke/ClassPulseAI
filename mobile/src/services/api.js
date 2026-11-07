/**
 * ClassPulse AI — API Client Service.
 *
 * Communicates with the FastAPI backend.
 * Enforces request timeouts and detailed, user-friendly error classifications.
 */
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../constants/theme';

/**
 * Check backend liveness.
 */
export async function checkHealth() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Check if the backend YOLO model is loaded and ready.
 */
export async function checkReadiness() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/ready`, {
      method: 'GET',
      signal: controller.signal,
    });
    if (response.status === 503) {
      return { ready: false, message: 'AI model is warming up...' };
    }
    if (!response.ok) {
      return { ready: false, message: `Server error (${response.status})` };
    }
    const data = await response.json();
    return { ready: data.model_loaded === true, message: 'Ready' };
  } catch (err) {
    return { ready: false, message: 'Cannot reach server' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Upload a camera frame for real-time YOLO object detection.
 *
 * @param {string} imageUri - File URI of captured frame
 * @param {string} environment - 'classroom' or 'library'
 * @param {AbortSignal} [externalSignal] - Parent abort signal for cancellation
 * @returns {Promise<DetectionResponse>}
 */
export async function detectObjects(imageUri, environment, externalSignal) {
  const formData = new FormData();

  formData.append('image', {
    uri: imageUri,
    name: 'frame.jpg',
    type: 'image/jpeg',
  });
  formData.append('environment', environment);

  // Setup internal timeout that aborts if request exceeds REQUEST_TIMEOUT_MS
  const timeoutController = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    timeoutController.abort();
  }, REQUEST_TIMEOUT_MS);

  // Combine external abort signal if provided
  if (externalSignal) {
    externalSignal.addEventListener('abort', () => {
      timeoutController.abort();
    });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/detect`, {
      method: 'POST',
      body: formData,
      signal: timeoutController.signal,
    });

    if (!response.ok) {
      let detailMsg = `HTTP ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson?.detail) {
          detailMsg = errorJson.detail;
        }
      } catch (_) {
        // Fallback to HTTP status
      }

      if (response.status === 429) {
        throw new Error('Analysis rate limit reached. Slowing down...');
      }
      if (response.status === 503) {
        throw new Error('AI Model is still loading. Retrying...');
      }
      if (response.status === 413) {
        throw new Error('Frame payload too large for processing.');
      }
      throw new Error(detailMsg);
    }

    return await response.json();
  } catch (err) {
    if (timedOut) {
      throw new Error('Server request timed out. Retrying...');
    }
    if (err.name === 'AbortError') {
      throw err; // Parent cancellation, re-throw as AbortError
    }
    if (err.message && err.message.toLowerCase().includes('network request failed')) {
      throw new Error('Cannot connect to AI server. Check Wi-Fi or server status.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
