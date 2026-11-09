/**
 * RoomPulse — API Client Service.
 *
 * Communicates with the FastAPI backend.
 * Provides universal multipart frame upload compatible with Expo's WinterCG fetch,
 * legacy React Native fetch, and mobile Android networking.
 *
 * Enforces request timeouts and detailed, user-friendly error classifications.
 */
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../constants/theme';

/**
 * Check backend liveness.
 */
export async function checkHealth() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

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
 * Includes cold-start allowance for Render free tier.
 */
export async function checkReadiness() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/ready`, {
      method: 'GET',
      signal: controller.signal,
    });
    if (response.status === 503) {
      return { ready: false, message: 'AI model is initializing...' };
    }
    if (!response.ok) {
      return { ready: false, message: `Server status: HTTP ${response.status}` };
    }
    const data = await response.json();
    return { ready: data.model_loaded === true, message: 'Ready' };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { ready: false, message: 'Server warming up (cold start)...' };
    }
    return { ready: false, message: 'Connecting to AI server...' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Upload a camera frame for real-time YOLO object detection.
 *
 * Compatible with Expo SDK 58 / React Native 0.88 WinterCG fetch:
 * Resolves local file URI into a binary Blob with .bytes() implementation
 * and .name/.type properties to satisfy convertFormDataAsync and getFormDataPartHeaders.
 *
 * @param {string} imageUri - File URI of captured frame
 * @param {string} environment - 'classroom' or 'library'
 * @param {AbortSignal} [externalSignal] - Parent abort signal for cancellation
 * @returns {Promise<DetectionResponse>}
 */
export async function detectObjects(imageUri, environment, externalSignal) {
  const formData = new FormData();

  // 1. Build universal binary image part
  try {
    const fileResponse = await fetch(imageUri);
    const blob = await fileResponse.blob();

    // Augment blob with properties required by both WinterCG convertFormData and legacy RN fetch
    blob.name = 'frame.jpg';
    blob.type = 'image/jpeg';
    blob.uri = imageUri;
    blob.bytes = async () => {
      if (typeof blob.arrayBuffer === 'function') {
        const buffer = await blob.arrayBuffer();
        return new Uint8Array(buffer);
      }
      return new Uint8Array();
    };

    formData.append('image', blob, 'frame.jpg');
  } catch (blobErr) {
    // Fallback if local blob extraction fails
    const fallbackPart = {
      uri: imageUri,
      name: 'frame.jpg',
      type: 'image/jpeg',
      bytes: async () => new Uint8Array(),
    };
    formData.append('image', fallbackPart, 'frame.jpg');
  }

  // 2. Append environment parameter
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
    if (externalSignal.aborted) {
      timeoutController.abort();
    } else {
      externalSignal.addEventListener('abort', () => {
        timeoutController.abort();
      });
    }
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
        throw new Error('Analysis rate limit reached. Throttling requests...');
      }
      if (response.status === 503) {
        throw new Error('AI Model is initializing. Retrying...');
      }
      if (response.status === 413) {
        throw new Error('Frame payload too large for processing.');
      }
      if (response.status === 415) {
        throw new Error('Image format unsupported. Frame must be JPEG.');
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
      throw new Error('Cannot reach AI server. Please check internet connection.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
