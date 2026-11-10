# RoomPulse 
  
> **.Your Environment, Decoded by AI** 
> Real-time computer vision analysis and contextual commentary for classrooms and libraries.  
---      

## 1. Project Overview  

**RoomPulse** helps users understand what is happening in their immediate learning spaces through continuous, live camera analysis. 

The application focuses on two distinct environments:
1. **Classroom**
2. **Library**

When a user selects an environment and starts scanning:
- The mobile camera streams frame captures (~every 2 seconds) to a FastAPI backend.
- A pretrained YOLOv8n model runs real-time CPU object detection for key tracked objects (people, chairs, books, laptops, and screens).
- Activity level (Quiet, Moderate, Busy, Packed) is estimated using a transparent, approximate heuristic.
- Short, humorous, respectful AI commentary is generated strictly from verified detections.
- The user can pause, resume, or finish the session to view a final session summary.

---
 
## 2. Technology Stack  ss

| Layer | Technologies |
|---|---|
| **Mobile Frontend** | React Native, Expo SDK 51, Expo Router v3, JavaScript |
| **Camera & Media** | `expo-camera` v15 (continuous preview, silent capture) |
| **Styling & UI** | React Native StyleSheet, dark navy palette, responsive state badges |
| **Backend API** | Python 3.11, FastAPI, Uvicorn, Pydantic v2 |
| **Computer Vision** | `ultralytics` YOLOv8n (COCO pretrained), OpenCV (`opencv-python-headless`), NumPy |
| **Cloud Deployment** | Render Web Service (dynamic `$PORT`, CPU inference concurrency guard) |
| **Mobile Packaging**| Expo Application Services (EAS Build) for standalone Android APK / AAB |

---

## 3. Project Structure

```
ClassPulseAI/
├── render.yaml                     # Render Blueprint deployment definition
├── .gitignore                      # Git exclusion rules
├── README.md                       # Comprehensive operational guide
│
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application, lifespan, CORS, exception handling
│   │   ├── api/
│   │   │   └── routes.py           # GET /health, GET /ready, POST /detect
│   │   ├── services/
│   │   │   ├── detector.py         # YOLOv8n wrapper, image decoding & dimension validation
│   │   │   └── commentary.py       # Contextual commentary & activity estimation
│   │   ├── schemas/
│   │   │   └── detection.py        # Pydantic request/response schemas
│   │   └── core/
│   │       └── config.py           # Settings from environment variables & .env
│   ├── tests/
│   │   └── test_api_validation.py  # Fast unit/API validation tests (no weight download)
│   ├── test_backend.py             # Live integration smoke test script
│   ├── requirements.txt            # Python dependencies
│   └── .env.example                # Backend environment variable template
│
└── mobile/
    ├── app/                        # Expo Router Route Tree
    │   ├── _layout.js              # Root navigation stack & dark theme
    │   ├── index.js                # Screen 1: Home & Environment Selection
    │   ├── scanner.js              # Screen 2: Live Camera Scanner (9 reactive states)
    │   └── result.js               # Screen 3: Session Summary & Approximate Notice
    ├── src/
    │   ├── components/
    │   │   ├── EnvironmentCard.js  # Environment selector card
    │   │   ├── DetectionStats.js   # Counts grid with freshness & stale warning badge
    │   │   └── CommentaryCard.js   # AI commentary with fade animation
    │   ├── hooks/
    │   │   └── useLiveDetection.js # Serialized capture loop, abort & lifecycle handling
    │   ├── services/
    │   │   └── api.js              # HTTP client with request timeout & error parsing
    │   ├── constants/
    │   │   └── theme.js            # Design tokens, timing constants & EXPO_PUBLIC_API_BASE_URL
    │   └── utils/
    │       └── formatDetection.js  # Formatters, scanner state metadata, activity labels
    ├── app.json                    # Expo application manifest (permissions, package ID)
    ├── eas.json                    # EAS build profiles (Preview APK & Production AAB)
    ├── package.json                # Node dependencies & script
    └── .env.example                # Mobile environment variable template
```

---

## 4. Local Backend Setup

> [!NOTE]
> Run all commands in **Windows Command Prompt (`cmd.exe`)** or **Windows Terminal**. Avoid PowerShell if your environment has type initializer issues.

### Step 1: Create Virtual Environment & Install Dependencies

```cmd
cd "c:\python\Machine Learning\ClassPulseAI\backend"
python -m venv .venv
.venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 2: Configure Environment

```cmd
copy .env.example .env
```

Default settings are configured for local development:
- `PORT=8000`
- `HOST=0.0.0.0`
- `YOLO_MODEL=yolov8n.pt`
- `CONFIDENCE_THRESHOLD=0.40`
- `MAX_CONCURRENT_INFERENCES=1`
- `CORS_ORIGINS=*`

### Step 3: Start the Backend Server

```cmd
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- Swagger API Docs: `http://localhost:8000/docs`
- Liveness Probe: `http://localhost:8000/api/v1/health`
- Readiness Probe: `http://localhost:8000/api/v1/ready`

---

## 5. Local Mobile Setup & Configuration

### Step 1: Install Node Dependencies

```cmd
cd "c:\python\Machine Learning\ClassPulseAI\mobile"
npm install
```

### Step 2: Configure the API URL

Create a `.env` file in `mobile/`:

```cmd
copy .env.example .env
```

Edit `mobile/.env` to configure `EXPO_PUBLIC_API_BASE_URL`:

- **For testing on a Physical Android Phone (same Wi-Fi):**
  Find your computer's IPv4 address with `ipconfig` (e.g. `192.168.1.45`):
  ```env
  EXPO_PUBLIC_API_BASE_URL=http://192.168.1.45:8000
  ```

- **For Android Emulator (running on the same PC):**
  ```env
  EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000
  ```

- **For Deployed Render Backend:**
  ```env
  EXPO_PUBLIC_API_BASE_URL=https://your-app-name.onrender.com
  ```

### Step 3: Start Expo

```cmd
npx expo start
```

- Press `a` to open in Android Emulator.
- Or scan the QR code with the **Expo Go** app on your physical Android device.

---

## 6. Testing

### Fast API & Validation Tests (No Model Weights Needed)

Run the fast pytest suite to verify endpoints, error codes, and payload limits without waiting for YOLO model downloads:

```cmd
cd "c:\python\Machine Learning\ClassPulseAI\backend"
.venv\Scripts\activate
pytest tests/test_api_validation.py -v
```

### Live Integration Smoke Tests

With the backend running:

```cmd
cd "c:\python\Machine Learning\ClassPulseAI\backend"
.venv\Scripts\activate
python test_backend.py http://localhost:8000
```

---

## 7. Render Deployment Preparation

### Architecture on Render
- **Service Type:** Web Service
- **Environment:** Python 3.11
- **Root Directory:** `backend`
- **Build Command:** `pip install --upgrade pip && pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path:** `/api/v1/health`

### Render Blueprint Deployment (`render.yaml`)
A `render.yaml` file is provided in the repository root. You can deploy directly via:
1. Push your repository to GitHub.
2. In the Render Dashboard, click **New +** → **Blueprint**.
3. Select your repository. Render will automatically configure the Web Service from `render.yaml`.

### Manual Render Dashboard Configuration
If configuring manually in the Render dashboard:
1. **Name:** `classpulse-ai-backend`
2. **Root Directory:** `backend`
3. **Runtime:** `Python 3`
4. **Build Command:** `pip install --upgrade pip && pip install -r requirements.txt`
5. **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. **Environment Variables:**
   - `PYTHON_VERSION`: `3.11.9`
   - `YOLO_MODEL`: `yolov8n.pt`
   - `CONFIDENCE_THRESHOLD`: `0.40`
   - `MAX_CONCURRENT_INFERENCES`: `1`
   - `RATE_LIMIT_PER_MINUTE`: `60`
   - `CORS_ORIGINS`: `*`
7. **Health Check Path:** `/api/v1/health`

### Render Hardware & Memory Considerations
- **Free Tier Constraints (512 MB RAM / 0.1 CPU):**
  - PyTorch + YOLOv8n uses approximately 200–350 MB of RAM at idle.
  - The `MAX_CONCURRENT_INFERENCES=1` setting serializes detection requests with an `asyncio.Semaphore`. This prevents multiple simultaneous inferences from triggering an Out-Of-Memory (OOM) crash.
  - **Cold Starts:** Free instances spin down after 15 minutes of inactivity. The first request after a cold start can take 30–60 seconds as the container provisions and downloads weights. The mobile app handles this via its `connecting` state and retry logic.
  - For reliable production usage without cold-start delays, Render's **Starter Plan** (512 MB RAM, persistent CPU) or higher is recommended.

---

## 8. Android APK Generation with EAS (Expo Application Services)

The mobile project includes `eas.json` configured with three profiles:
- `development`: Debug client with hot reloading.
- `preview`: **Generates an installable `.apk` file** directly for side-loading on Android devices.
- `production`: Generates a Google Play `.aab` (Android App Bundle).

### Step 1: Install EAS CLI

```cmd
npm install -g eas-cli
```

### Step 2: Log into your Expo Account

```cmd
eas login
```

### Step 3: Configure Project Credentials

```cmd
cd "c:\python\Machine Learning\ClassPulseAI\mobile"
eas build:configure
```

### Step 4: Build Installable Android APK (Preview Profile)

```cmd
eas build --platform android --profile preview
```

EAS will upload your project to the Expo build cloud, package the APK, and provide a direct download link (and QR code) to install the `.apk` on any Android phone.

### Step 5: Build Production Android AAB (Google Play Store)

```cmd
eas build --platform android --profile production
```

---

## 9. Ultralytics YOLOv8 Licensing Notice

> [!IMPORTANT]
> **Open Source License vs. Commercial Use**
> 
>PoomPulse uses **YOLOv8n** from [Ultralytics](https://github.com/ultralytics/ultralytics).
> 
> - **AGPL-3.0 License:** Ultralytics YOLOv8 is licensed under the **GNU Affero General Public License v3.0**. Under Section 13 of the AGPL-3.0, if you run the backend on a server and allow remote users to interact with it across a network (e.g. mobile app communicating with FastAPI), you are obligated to make the complete source code of the software available to those network users under the AGPL-3.0.
> - **Commercial / Closed-Source Alternative:** If you plan to distribute ClassPulse AI as a proprietary, closed-source commercial product or SaaS without releasing your source code, you must obtain an **Enterprise License** directly from Ultralytics.
> - **Human Review Required:** Verify your organization's deployment model. If full AGPL-3.0 open-source compliance is acceptable, no further licensing action is required. If proprietary closed-source distribution is required, purchase an Ultralytics commercial license or consider migrating to an Apache-2.0 object detection architecture (e.g. YOLOv10 or RT-DETR).

---

## 10. Known Limitations

1. **Approximate Counts:** Computer vision detection relies on objects being unobstructed and within camera field-of-view. Detections should not be treated as official building code occupancy figures.
2. **Small Objects at Range:** Books or phones lying flat on distant desks may not be detected at steep camera angles.
3. **Render Free Tier Cold Starts:** Free instances sleep after 15 minutes. Waking up the server takes ~45 seconds. The mobile UI will show `Connecting to AI server` until the server responds.
4. **Lighting & Contrast:** Dim library lighting or glare on laptop screens can reduce detection confidence.
