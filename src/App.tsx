import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { Header } from './components/Header';
import { Controls, Mode, TriggerEvent } from './components/Controls';
import { UserGuideModal } from './components/UserGuideModal';
import { AmbientBackground } from './components/AmbientBackground';
import { smoothLandmarks, clearLandmarkCache, Point3D } from './utils/smoothing';
import { audioEngine } from './utils/audio';
import { visualEffectsEngine } from './utils/effects';

const PIANO_KEYS = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'] as const;
const NOTE_COLORS = [
  '#00f3ff', '#3a86ff', '#8338ec', '#ff007f', '#ff0055',
  '#ffbe0b', '#fb5607', '#00f3ff', '#3a86ff', '#8338ec'
];

// Reordered Drum Zones with Middle Drum Beat
const DRUM_ZONES = [
  { name: 'Tom', x: 0.05, y: 0.08, w: 0.26, h: 0.24, color: '#00f79f', sound: 'tom' },
  { name: 'Crash', x: 0.69, y: 0.08, w: 0.26, h: 0.24, color: '#9d4edd', sound: 'crash' },
  { name: '808 Perc', x: 0.37, y: 0.37, w: 0.26, h: 0.24, color: '#ffbe0b', sound: '808 perc' },
  { name: 'Kick', x: 0.05, y: 0.66, w: 0.26, h: 0.24, color: '#ff007f', sound: 'kick' },
  { name: 'Snare', x: 0.37, y: 0.66, w: 0.26, h: 0.24, color: '#00f3ff', sound: 'snare' },
  { name: 'Hi-Hat', x: 0.69, y: 0.66, w: 0.26, h: 0.24, color: '#3a86ff', sound: 'hi-hat' },
];

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

export function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);

  // Active pinch trigger zone debounce map
  const activeFingerZonesRef = useRef<Record<string, number>>({});
  const recordingRef = useRef<TriggerEvent[]>([]);
  const noteHistoryRef = useRef<TriggerEvent[]>([]);

  // State
  const [mode, setMode] = useState<Mode>('piano');
  const [cameraOn, setCameraOn] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [visualEffectsOn, setVisualEffectsOn] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [modelReady, setModelReady] = useState(false);
  const [status, setStatus] = useState('Initializing MediaPipe...');
  const [handCount, setHandCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [noteHistory, setNoteHistory] = useState<TriggerEvent[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isBottomLayout, setIsBottomLayout] = useState(false);

  // Active Key Highlights for UI
  const [activePianoKeys, setActivePianoKeys] = useState<Set<string>>(new Set());
  const [activeDrumPads, setActiveDrumPads] = useState<Set<string>>(new Set());

  // FPS Counter tracking
  const frameTimesRef = useRef<number[]>([]);
  // Throttle counter — only update React state every N frames to reduce re-renders
  const frameCountRef = useRef(0);

  useEffect(() => {
    const initMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.4,
          minTrackingConfidence: 0.2,
        });

        landmarkerRef.current = handLandmarker;
        setModelReady(true);
        setStatus('Tracker ready. Start camera to play.');
      } catch (err) {
        console.error('Failed to load MediaPipe:', err);
        setStatus('Failed to load Hand Tracker. Please refresh.');
      }
    };

    initMediaPipe();
  }, []);

  const triggerNoteEvent = (
    label: string,
    source: 'piano' | 'drum' | 'freestyle',
    x: number,
    y: number,
    record: boolean = true
  ) => {
    let color = '#00f3ff';
    if (source === 'piano') {
      const idx = PIANO_KEYS.indexOf(label as (typeof PIANO_KEYS)[number]);
      if (idx !== -1) color = NOTE_COLORS[idx % NOTE_COLORS.length];
      audioEngine.playPianoNote(label);

      // Trigger UI key highlight
      setActivePianoKeys((prev) => {
        const next = new Set(prev);
        next.add(label);
        return next;
      });
      setTimeout(() => {
        setActivePianoKeys((prev) => {
          const next = new Set(prev);
          next.delete(label);
          return next;
        });
      }, 220);
    } else if (source === 'drum') {
      const pad = DRUM_ZONES.find((d) => d.name === label);
      if (pad) color = pad.color;
      audioEngine.playDrum(label);

      setActiveDrumPads((prev) => {
        const next = new Set(prev);
        next.add(label);
        return next;
      });
      setTimeout(() => {
        setActiveDrumPads((prev) => {
          const next = new Set(prev);
          next.delete(label);
          return next;
        });
      }, 220);
    }

    if (visualEffectsOn) {
      visualEffectsEngine.addBurst(x, y, color, 24);
    }

    const event: TriggerEvent = {
      id: Date.now() + Math.random(),
      label,
      source,
      x,
      y,
      color,
      timestamp: Date.now(),
    };

    if (record && isRecording) {
      recordingRef.current.push(event);
    }

    noteHistoryRef.current = [event, ...noteHistoryRef.current].slice(0, 14);
    setNoteHistory([...noteHistoryRef.current]);
  };

  const startCamera = async () => {
    if (!modelReady) {
      setStatus('Waiting for hand landmarker model...');
      return;
    }

    await audioEngine.startAudioContext();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 60, max: 60 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraOn(true);
      setStatus('Camera active. Ready for musical air play!');
    } catch (err) {
      console.error('Camera error:', err);
      setStatus('Camera access denied or unavailable.');
    }
  };

  const stopCamera = () => {
    // 1. Stop video stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // 2. Stop audio tone if freestyle was active
    audioEngine.stopFreestyleTone();

    // 3. Clear canvas immediately so no skeleton remains on black screen
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    // 4. Cancel animation frame & clear state
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setCameraOn(false);
    clearLandmarkCache();
    visualEffectsEngine.clear();
    setHandCount(0);
    setStatus('Camera stopped.');
  };

  const toggleLiveRecording = async () => {
    if (!isRecording) {
      setIsRecording(true);
      await audioEngine.startLiveRecording();
    } else {
      setIsRecording(false);
      await audioEngine.stopLiveRecordingAndDownload();
    }
  };

  const clearVisuals = () => {
    visualEffectsEngine.clear();
    noteHistoryRef.current = [];
    setNoteHistory([]);
    recordingRef.current = [];
    activeFingerZonesRef.current = {};
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const replaySession = () => {
    if (recordingRef.current.length === 0) return;

    const firstTime = recordingRef.current[0].timestamp;
    recordingRef.current.forEach((event, index) => {
      const delay = event.timestamp - firstTime;
      setTimeout(() => {
        triggerNoteEvent(event.label, event.source, event.x, event.y, false);
      }, delay + index * 10);
    });
  };

  const drawFrame = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !cameraOn) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return;

    // Increment frame counter
    frameCountRef.current = (frameCountRef.current + 1) % 10;
    const isThrottleFrame = frameCountRef.current === 0;

    // Calculate FPS (only update React state every 10 frames)
    const now = performance.now();
    frameTimesRef.current.push(now);
    while (frameTimesRef.current.length > 0 && frameTimesRef.current[0] <= now - 1000) {
      frameTimesRef.current.shift();
    }
    if (isThrottleFrame) {
      setFps(frameTimesRef.current.length);
    }

    // Sync canvas display size to video resolution
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    // Render particles & trails if enabled
    if (visualEffectsOn) {
      visualEffectsEngine.updateAndRender(ctx, width, height);
    }

    const handLandmarker = landmarkerRef.current;
    if (!handLandmarker || video.readyState < 2) return;

    const result = handLandmarker.detectForVideo(video, now);
    const detectedHands = result.landmarks ?? [];
    const detectedHandednesses = result.handednesses ?? [];

    // Only update hand count in React state every 10 frames
    if (isThrottleFrame) {
      setHandCount(detectedHands.length);
    }


    // Store index fingertips & tilt angles for freestyle modulation
    const indexTips: Array<{ x: number; y: number; handId: string }> = [];
    let maxHandTiltRatio = 0; // 0 = Horizontal, 1 = Vertical

    // Process detected hands with LERP smoothing
    detectedHands.forEach((rawHand, handIndex) => {
      const categoryName = detectedHandednesses[handIndex]?.[0]?.categoryName;
      // Invert left/right because webcam is mirrored horizontally
      const handedness: 'Left' | 'Right' = categoryName === 'Left' ? 'Right' : 'Left';
      const handId = `hand-${handIndex}-${handedness}`;

      // Smooth landmarks to prevent jitter
      const handPoints: Point3D[] = rawHand.map((pt) => ({
        // Mirror X axis to match video layout
        x: 1.0 - pt.x,
        y: pt.y,
        z: pt.z,
      }));

      const smoothedPoints = smoothLandmarks(handPoints, handId, 0.65);

      // Landmarks: Thumb tip = 4, Index tip = 8, Middle tip = 12
      const thumbTip = smoothedPoints[4];
      const indexTip = smoothedPoints[8];
      const middleTip = smoothedPoints[12];

      // Calculate Index-to-Thumb Pinch Distance
      const indexPinchDx = indexTip.x - thumbTip.x;
      const indexPinchDy = indexTip.y - thumbTip.y;
      const indexPinchDist = Math.sqrt(indexPinchDx * indexPinchDx + indexPinchDy * indexPinchDy);
      const isIndexPinched = indexPinchDist < 0.058;

      // Calculate Middle-to-Thumb Pinch Distance
      const middlePinchDx = middleTip.x - thumbTip.x;
      const middlePinchDy = middleTip.y - thumbTip.y;
      const middlePinchDist = Math.sqrt(middlePinchDx * middlePinchDx + middlePinchDy * middlePinchDy);
      const isMiddlePinched = middlePinchDist < 0.058;

      // Calculate hand tilt angle ratio (Wrist [0] to Index Tip [8] vector)
      const wrist = smoothedPoints[0];
      const dx = Math.abs(indexTip.x - wrist.x);
      const dy = Math.abs(indexTip.y - wrist.y);
      const angleRad = Math.atan2(dy, dx); // 0 = Horizontal, PI/2 = Vertical
      const tiltRatio = clamp(angleRad / (Math.PI / 2), 0, 1);
      if (tiltRatio > maxHandTiltRatio) {
        maxHandTiltRatio = tiltRatio;
      }

      // Track index finger tip for freestyle distance calculation
      indexTips.push({
        x: indexTip.x,
        y: indexTip.y,
        handId,
      });

      const activeTipIndices = new Set<number>();
      if (isIndexPinched) {
        activeTipIndices.add(8);
        activeTipIndices.add(4);

        if (visualEffectsOn) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(thumbTip.x * width, thumbTip.y * height);
          ctx.lineTo(indexTip.x * width, indexTip.y * height);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.shadowBlur = 16;
          ctx.shadowColor = handedness === 'Left' ? '#00f3ff' : '#ff007f';
          ctx.stroke();
          ctx.restore();
        }
      }

      if (isMiddlePinched) {
        activeTipIndices.add(12);
        activeTipIndices.add(4);
      }

      // -------------------------------------------------------------
      // PIANO / DRUM / FREESTYLE GESTURE DISPATCHING
      // -------------------------------------------------------------
      const x = indexTip.x;
      const y = indexTip.y;
      const screenX = x * width;
      const screenY = y * height;
      const tipKey = `${handId}-pinch-trigger`;
      const lastTrigger = activeFingerZonesRef.current[tipKey] || 0;

      if (mode === 'piano' && isIndexPinched) {
        const inKeyHeight = y >= 0.05 && y <= 0.46;
        if (inKeyHeight) {
          const keyIndex = clamp(Math.floor(x * PIANO_KEYS.length), 0, PIANO_KEYS.length - 1);
          const keyLabel = PIANO_KEYS[keyIndex];

          if (now - lastTrigger > 185) {
            activeFingerZonesRef.current[tipKey] = now;
            triggerNoteEvent(keyLabel, 'piano', screenX, screenY);
          }
        }
      } else if (mode === 'drum' && isIndexPinched) {
        const hitPad = DRUM_ZONES.find(
          (pad) => x >= pad.x && x <= pad.x + pad.w && y >= pad.y && y <= pad.y + pad.h
        );

        if (hitPad && now - lastTrigger > 200) {
          activeFingerZonesRef.current[tipKey] = now;
          triggerNoteEvent(hitPad.name, 'drum', screenX, screenY);
        }
      } else if (mode === 'freestyle') {
        // Freestyle Action 1: Continuous Light Trail
        visualEffectsEngine.addTrailPoint(screenX, screenY, handedness === 'Left' ? '#00f3ff' : '#ff007f', handId);

        // Freestyle Action 2: Melodic Wand Stream
        audioEngine.playFreestyleMelodicWand(y, x, now);

        // Freestyle Action 3: Index + Thumb Pinch -> Crystal Poly-Arpeggio Chords
        if (isIndexPinched && now - lastTrigger > 350) {
          activeFingerZonesRef.current[tipKey] = now;
          audioEngine.playFreestylePinchChord(y);
          if (visualEffectsOn) visualEffectsEngine.addBurst(screenX, screenY, '#00f3ff', 30);
        }

        // Freestyle Action 5: Middle + Thumb Pinch -> Cyber Bell Chime
        const middleKey = `${handId}-middle-pinch`;
        const lastMiddle = activeFingerZonesRef.current[middleKey] || 0;
        if (isMiddlePinched && now - lastMiddle > 300) {
          activeFingerZonesRef.current[middleKey] = now;
          audioEngine.playFreestyleBellChime(middleTip.y);
          if (visualEffectsOn) visualEffectsEngine.addBurst(middleTip.x * width, middleTip.y * height, '#ffbe0b', 24);
        }
      }

      // Render hand skeleton & aura
      if (visualEffectsOn) {
        visualEffectsEngine.drawHandSkeleton(ctx, smoothedPoints, handedness, width, height, activeTipIndices);
      }
    });

    // Freestyle Global Action 4 & 5: Dual Hand Rhythm & Tilt Filter Modulation
    if (mode === 'freestyle') {
      audioEngine.updateFreestyleTiltFilter(maxHandTiltRatio);

      if (indexTips.length >= 2) {
        const p1 = indexTips[0];
        const p2 = indexTips[1];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        audioEngine.updateFreestyleDualHandRhythm(distance, now);
      }
    } else {
      audioEngine.stopFreestyleTone();
    }
  };

  useEffect(() => {
    const tick = () => {
      drawFrame();
      if (cameraOn) {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    if (cameraOn) {
      animationFrameRef.current = requestAnimationFrame(tick);
    } else {
      audioEngine.stopFreestyleTone();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [cameraOn, mode, visualEffectsOn, isRecording]);

  return (
    <div className="app-shell">
      <AmbientBackground />

      <Header
        status={status}
        handCount={handCount}
        cameraOn={cameraOn}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        visualEffectsOn={visualEffectsOn}
        setVisualEffectsOn={setVisualEffectsOn}
        volume={volume}
        setVolume={setVolume}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      <main className={`workspace ${isBottomLayout ? 'bottom-layout' : ''}`}>
        {/* Interactive Instrument & Webcam Frame */}
        <div className="camera-viewport-container glass-panel">
          <video ref={videoRef} autoPlay playsInline muted className="webcam-feed" />
          <canvas ref={canvasRef} className="hand-overlay-canvas" />

          {/* Piano Key Overlays (Top Half of Webcam Area) */}
          {mode === 'piano' && (
            <div className="zone-overlay piano-overlay">
              {PIANO_KEYS.map((note, index) => {
                const isActive = activePianoKeys.has(note);
                const color = NOTE_COLORS[index % NOTE_COLORS.length];
                return (
                  <div
                    key={note}
                    className={`piano-key-zone ${isActive ? 'key-active' : ''}`}
                    style={{
                      left: `${(index / PIANO_KEYS.length) * 100}%`,
                      width: `${100 / PIANO_KEYS.length}%`,
                      borderColor: isActive ? color : 'rgba(0, 243, 255, 0.25)',
                    }}
                  >
                    <div className="key-glass-fill" style={{ backgroundColor: isActive ? color : 'transparent' }} />
                    <span className="key-label" style={{ color: isActive ? '#ffffff' : color }}>
                      {note}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Drum Pad Overlays */}
          {mode === 'drum' && (
            <div className="zone-overlay drum-overlay">
              {DRUM_ZONES.map((zone) => {
                const isActive = activeDrumPads.has(zone.name);
                return (
                  <div
                    key={zone.name}
                    className={`drum-pad-zone ${isActive ? 'pad-active' : ''}`}
                    style={{
                      left: `${zone.x * 100}%`,
                      top: `${zone.y * 100}%`,
                      width: `${zone.w * 100}%`,
                      height: `${zone.h * 100}%`,
                      borderColor: zone.color,
                      boxShadow: isActive ? `0 0 30px ${zone.color}` : 'none',
                    }}
                  >
                    <span className="pad-label" style={{ color: zone.color }}>
                      {zone.name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Freestyle Mode Overlay */}
          {mode === 'freestyle' && (
            <div className="freestyle-hud-badge">
              <span className="hud-pulse" />
              <span>FREESTYLE // WAND = MELODIC STREAM | PINCH INDEX = CHORDS | PINCH MIDDLE = BELLS | 2 HANDS = SUB BASS</span>
            </div>
          )}
        </div>

        {/* Sidebar / Bottom Controls */}
        <Controls
          mode={mode}
          setMode={setMode}
          cameraOn={cameraOn}
          modelReady={modelReady}
          onStartCamera={startCamera}
          onStopCamera={stopCamera}
          isRecording={isRecording}
          onToggleRecording={toggleLiveRecording}
          onReplay={replaySession}
          onClear={clearVisuals}
          noteHistory={noteHistory}
          handCount={handCount}
          fps={fps}
          isBottomLayout={isBottomLayout}
          onToggleLayout={() => setIsBottomLayout(!isBottomLayout)}
        />
      </main>

      <UserGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onStartCamera={startCamera}
        cameraOn={cameraOn}
      />
    </div>
  );
}

export default App;
