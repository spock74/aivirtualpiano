import React, { useEffect, useRef, useState, useCallback } from 'react';
import { HandLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { PIANO_KEYS, KEYBOARD_WIDTH, KEYBOARD_HEIGHT, FINGERTIP_LANDMARKS } from '../constants';
import { audioPlayer } from '../services/audioPlayer';
import { 
    CameraIcon, LoadingIcon, SoundOnIcon, SoundOffIcon, VideoOnIcon, VideoOffIcon,
    PianoIcon, PianoPositionIcon, FlipHorizontalIcon, FlipVerticalIcon, SensitivityIcon,
    SettingsIcon, CloseIcon
} from './icons';

const SMOOTHING_FACTOR = 0.5;
// This map includes all joints needed for advanced "curl" detection
const FINGER_JOINTS_MAP: { [key: number]: { pip: number, mcp: number } } = {
  4: { pip: 3, mcp: 2 },  // Thumb
  8: { pip: 6, mcp: 5 },  // Index
  12: { pip: 10, mcp: 9 }, // Middle
  16: { pip: 14, mcp: 13 }, // Ring
  20: { pip: 18, mcp: 17 }, // Pinky
};

const drawPiano = (ctx: CanvasRenderingContext2D, activeNotes: Set<string>, position: 'top' | 'bottom') => {
    const pianoRegionHeight = ctx.canvas.height * 0.3;
    const yOffset = position === 'top' ? 0 : ctx.canvas.height - pianoRegionHeight;
    const scaleX = ctx.canvas.width / KEYBOARD_WIDTH;
    const scaleY = pianoRegionHeight / KEYBOARD_HEIGHT;
    const activeColor = 'rgba(59, 130, 246, 0.7)'; // Translucent blue for highlights

    ctx.save();
    
    if (position === 'bottom') {
        // Flip the coordinate system to draw the piano oriented towards the player
        ctx.translate(0, yOffset + pianoRegionHeight);
        ctx.scale(1, -1);
    } else {
        ctx.translate(0, yOffset);
    }
    
    // The drawing logic is now relative to the transformed coordinate system.
    // It always draws from y=0 downwards.

    // Draw white keys
    PIANO_KEYS.filter(k => k.type === 'white').forEach(key => {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.fillRect(key.x * scaleX, key.y * scaleY, key.width * scaleX, key.height * scaleY);
        ctx.strokeRect(key.x * scaleX, key.y * scaleY, key.width * scaleX, key.height * scaleY);
    });

    // Draw black keys
    PIANO_KEYS.filter(k => k.type === 'black').forEach(key => {
         ctx.fillStyle = 'black';
         ctx.fillRect(key.x * scaleX, key.y * scaleY, key.width * scaleX, key.height * scaleY);
    });

    // Draw highlights on top of all keys for a consistent look
    PIANO_KEYS.forEach(key => {
        if(activeNotes.has(key.note)) {
            ctx.fillStyle = activeColor;
            ctx.fillRect(key.x * scaleX, key.y * scaleY, key.width * scaleX, key.height * scaleY);
        }
    });
    
    ctx.restore();
}


const VirtualPiano: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const drawingUtilsRef = useRef<DrawingUtils | null>(null);
  const prevSmoothedLandmarksRef = useRef<NormalizedLandmark[][]>([]);
  const smoothedLandmarksRef = useRef<NormalizedLandmark[][]>([]);
  const heldKeysRef = useRef<Set<string>>(new Set());
  const highlightedKeysRef = useRef<Set<string>>(new Set());
  const fingerPressStateRef = useRef<Map<string, boolean>>(new Map());
  
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Inicializando...');
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [showVideo, setShowVideo] = useState(true);
  const [showPiano, setShowPiano] = useState(true);
  const [pianoPosition, setPianoPosition] = useState<'bottom' | 'top'>('bottom');
  const [flipHorizontal, setFlipHorizontal] = useState(true);
  const [flipVertical, setFlipVertical] = useState(false);
  const [sensitivity, setSensitivity] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);

  const showVideoRef = useRef(showVideo);
  const showPianoRef = useRef(showPiano);
  const pianoPositionRef = useRef(pianoPosition);
  const flipHorizontalRef = useRef(flipHorizontal);
  const flipVerticalRef = useRef(flipVertical);
  const sensitivityRef = useRef(sensitivity);

  useEffect(() => { showVideoRef.current = showVideo; }, [showVideo]);
  useEffect(() => { showPianoRef.current = showPiano; }, [showPiano]);
  useEffect(() => { pianoPositionRef.current = pianoPosition; }, [pianoPosition]);
  useEffect(() => { flipHorizontalRef.current = flipHorizontal; }, [flipHorizontal]);
  useEffect(() => { flipVerticalRef.current = flipVertical; }, [flipVertical]);
  useEffect(() => { sensitivityRef.current = sensitivity; }, [sensitivity]);


  const createHandLandmarker = useCallback(async () => {
    try {
      setLoadingMessage('Carregando modelos de visão...');
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/wasm'
      );
      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
      });
      handLandmarkerRef.current = landmarker;
      setLoadingMessage('Inicialização completa!');
      setLoading(false);
    } catch (error) {
      console.error('Falha ao criar o HandLandmarker:', error);
      setLoadingMessage('Erro ao inicializar os modelos. Por favor, atualize a página.');
    }
  }, []);

  useEffect(() => {
    createHandLandmarker();
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [createHandLandmarker]);

  useEffect(() => {
    audioPlayer.setVolume(isMuted ? 0 : volume);
  }, [isMuted, volume]);
  
  const handleEnableWebcam = async () => {
    setWebcamError(null);
    if (!handLandmarkerRef.current) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener('loadeddata', () => {
                setWebcamEnabled(true);
                audioPlayer.resumeContext();
                predictWebcam();
            });
        }
    } catch (err) {
        console.error("Erro ao acessar a webcam: ", err);
        let message = "Não foi possível acessar a webcam. Verifique se as permissões foram concedidas e se a câmera não está sendo usada por outro aplicativo.";
        if (err instanceof DOMException) {
            switch (err.name) {
                case "NotFoundError": case "DevicesNotFoundError":
                    message = "Nenhuma webcam encontrada. Verifique se ela está conectada e ativada nas configurações do seu sistema operacional.";
                    break;
                case "NotAllowedError": case "PermissionDeniedError":
                    message = "O acesso à webcam foi negado. Por favor, conceda permissão nas configurações do seu navegador.";
                    break;
                case "NotReadableError": case "TrackStartError":
                    message = "Sua webcam está sendo usada por outro aplicativo.";
                    break;
                case "OverconstrainedError": case "ConstraintNotSatisfiedError":
                    message = "A webcam não suporta a resolução necessária.";
                    break;
                default: break;
            }
        }
        setWebcamError(message);
    }
  };

  const predictWebcam = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !handLandmarkerRef.current || video.readyState < 2) {
      animationFrameId.current = requestAnimationFrame(predictWebcam);
      return;
    }

    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;
    if (!drawingUtilsRef.current) {
      drawingUtilsRef.current = new DrawingUtils(canvasCtx);
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const startTimeMs = performance.now();
    const results = handLandmarkerRef.current.detectForVideo(video, startTimeMs);

    // --- SMOOTHING ---
    if (results.landmarks && results.landmarks.length > 0) {
        if (smoothedLandmarksRef.current.length !== results.landmarks.length) {
            smoothedLandmarksRef.current = JSON.parse(JSON.stringify(results.landmarks));
        } else {
            for (let i = 0; i < results.landmarks.length; i++) {
                for (let j = 0; j < results.landmarks[i].length; j++) {
                    const newPt = results.landmarks[i][j];
                    const oldPt = smoothedLandmarksRef.current[i][j];
                    smoothedLandmarksRef.current[i][j] = {
                        x: SMOOTHING_FACTOR * newPt.x + (1 - SMOOTHING_FACTOR) * oldPt.x,
                        y: SMOOTHING_FACTOR * newPt.y + (1 - SMOOTHING_FACTOR) * oldPt.y,
                        z: SMOOTHING_FACTOR * newPt.z + (1 - SMOOTHING_FACTOR) * oldPt.z,
                        visibility: newPt.visibility ?? 1,
                    };
                }
            }
        }
    } else {
      smoothedLandmarksRef.current = [];
    }
    const smoothedLandmarks = smoothedLandmarksRef.current;
    const prevSmoothedLandmarks = prevSmoothedLandmarksRef.current;

    const currentFrameHeldKeys = new Set<string>();

    const pianoRegionHeight = canvas.height * 0.3;
    const scaleX = canvas.width / KEYBOARD_WIDTH;
    const scaleY = pianoRegionHeight / KEYBOARD_HEIGHT;

    const yPianoStart = pianoPositionRef.current === 'top' ? 0 : canvas.height - pianoRegionHeight;
    const yPianoEnd = yPianoStart + pianoRegionHeight;

    // --- SENSITIVITY THRESHOLDS ---
    // Higher sensitivity value means lower thresholds, making it easier to trigger a note.
    
    // Z-velocity threshold (downward press speed)
    const MIN_Z_THRESHOLD = 0.0005;
    const MAX_Z_THRESHOLD = 0.0035;
    const Z_VELOCITY_THRESHOLD = MAX_Z_THRESHOLD - sensitivityRef.current * (MAX_Z_THRESHOLD - MIN_Z_THRESHOLD);
    
    // Curl velocity threshold (finger closing speed)
    const MIN_CURL_THRESHOLD = 0.0005;
    const MAX_CURL_THRESHOLD = 0.004;
    const CURL_VELOCITY_THRESHOLD = MAX_CURL_THRESHOLD - sensitivityRef.current * (MAX_CURL_THRESHOLD - MIN_CURL_THRESHOLD);

    if (smoothedLandmarks && smoothedLandmarks.length > 0) {
      for (let i = 0; i < smoothedLandmarks.length; i++) {
        const landmarks = smoothedLandmarks[i];
        const prevLandmarks = prevSmoothedLandmarks ? prevSmoothedLandmarks[i] : null;
        
        for (const tipIndex of FINGERTIP_LANDMARKS) {
          const fingertip = landmarks[tipIndex];
          const fingerId = `${i}-${tipIndex}`;
          const tipX_unscaled = flipHorizontalRef.current ? (1 - fingertip.x) : fingertip.x;
          const tipY_unscaled = flipVerticalRef.current ? (1 - fingertip.y) : fingertip.y;
          const tipX = tipX_unscaled * canvas.width;
          const tipY = tipY_unscaled * canvas.height;

          let keyUnderFinger: string | null = null;
          if (showPianoRef.current && tipY >= yPianoStart && tipY <= yPianoEnd) {
            const pianoX = tipX / scaleX;
            let pianoY;
            if (pianoPositionRef.current === 'bottom') {
              // When piano is at the bottom, it's flipped. Y coordinate needs to be inverted.
              pianoY = pianoRegionHeight - ((tipY - yPianoStart) / scaleY);
            } else {
              pianoY = (tipY - yPianoStart) / scaleY;
            }

            const blackKey = PIANO_KEYS.find(key => key.type === 'black' && pianoX >= key.x && pianoX <= key.x + key.width && pianoY >= key.y && pianoY <= key.y + key.height);
            if (blackKey) {
              keyUnderFinger = blackKey.note;
            } else {
              const whiteKey = PIANO_KEYS.find(key => key.type === 'white' && pianoX >= key.x && pianoX <= key.x + key.width && pianoY >= key.y && pianoY <= key.y + key.height);
              if (whiteKey) {
                keyUnderFinger = whiteKey.note;
              }
            }
          }
            
          if (keyUnderFinger) {
              currentFrameHeldKeys.add(keyUnderFinger);
              // --- ADVANCED GESTURE DETECTION ---
              if (prevLandmarks) {
                const jointIndices = FINGER_JOINTS_MAP[tipIndex];
                if (jointIndices) {
                  const { mcp: mcpIndex } = jointIndices;
                  if (landmarks[mcpIndex] && prevLandmarks[tipIndex] && prevLandmarks[mcpIndex]) {
                    const prevFingertip = prevLandmarks[tipIndex];
                    const prevMcp = prevLandmarks[mcpIndex];
                    const mcpJoint = landmarks[mcpIndex];

                    // 1. Check for downward velocity (attack)
                    const tipZVelocity = prevFingertip.z - fingertip.z;
                    
                    // 2. Check for finger "curling" (tip moving towards its base)
                    const currentDist = Math.hypot(fingertip.x - mcpJoint.x, fingertip.y - mcpJoint.y);
                    const prevDist = Math.hypot(prevFingertip.x - prevMcp.x, prevFingertip.y - prevMcp.y);
                    const curlVelocity = prevDist - currentDist;
                    
                    // A key press is a combination of downward motion and a deliberate finger curling motion.
                    const isCurling = curlVelocity > CURL_VELOCITY_THRESHOLD;
                    const isMovingDown = tipZVelocity > Z_VELOCITY_THRESHOLD;
                    
                    const isAttacking = isMovingDown && isCurling;
                    const wasPressed = fingerPressStateRef.current.get(fingerId) || false;

                    if (isAttacking && !wasPressed) {
                        const key = PIANO_KEYS.find(k => k.note === keyUnderFinger);
                        if (key) {
                            audioPlayer.playNote(key.note, key.frequency);
                            highlightedKeysRef.current.add(key.note);
                            fingerPressStateRef.current.set(fingerId, true); // Set state to pressed
                        }
                    }
                  }
                }
              }
          } else {
              // Finger is not over any key, so it's considered "released"
              fingerPressStateRef.current.set(fingerId, false);
          }
        }
      }
    }
    
    // --- NOTE OFF LOGIC ---
    const previouslyHeldKeys = heldKeysRef.current;
    for (const note of previouslyHeldKeys) {
      if (!currentFrameHeldKeys.has(note)) {
        audioPlayer.stopNote(note);
        highlightedKeysRef.current.delete(note);
      }
    }
    heldKeysRef.current = currentFrameHeldKeys;

    // --- DRAWING ---
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background if video is off
    if (!showVideoRef.current) {
        canvasCtx.fillStyle = 'black';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Prepare transform for flipped elements
    const scaleH = flipHorizontalRef.current ? -1 : 1;
    const scaleV = flipVerticalRef.current ? -1 : 1;
    const translateX = flipHorizontalRef.current ? -canvas.width : 0;
    const translateY = flipVerticalRef.current ? -canvas.height : 0;

    // Draw video (flipped)
    if (showVideoRef.current) {
        canvasCtx.save();
        canvasCtx.scale(scaleH, scaleV);
        canvasCtx.translate(translateX, translateY);
        canvasCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvasCtx.restore();
    }
    
    // Draw piano on top of video (not flipped)
    if (showPianoRef.current) {
        drawPiano(canvasCtx, highlightedKeysRef.current, pianoPositionRef.current);
    }
    
    // Draw hand landmarks on top of piano (flipped)
    if (smoothedLandmarks) {
      canvasCtx.save();
      canvasCtx.scale(scaleH, scaleV);
      canvasCtx.translate(translateX, translateY);
      for (const landmarks of smoothedLandmarks) {
        drawingUtilsRef.current.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: '#FFFFFF', lineWidth: 2 });
        drawingUtilsRef.current.drawLandmarks(landmarks, { color: '#FF0000', lineWidth: 1, radius: 3 });
      }
      canvasCtx.restore();
    }
    
    prevSmoothedLandmarksRef.current = JSON.parse(JSON.stringify(smoothedLandmarksRef.current));
    
    animationFrameId.current = requestAnimationFrame(predictWebcam);
  }, []);
  
  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(event.target.value));
  };

  const handleSensitivityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSensitivity(parseFloat(event.target.value));
  };


  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 z-50">
          <LoadingIcon />
          <p className="mt-4 text-lg">{loadingMessage}</p>
        </div>
      )}

      {!webcamEnabled && !loading && (
        <div className="z-30 text-center p-4">
          {webcamError ? (
            <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg max-w-md mx-auto">
              <p className="font-bold text-lg text-red-300">Erro na Webcam</p>
              <p className="mt-2 text-red-200">{webcamError}</p>
              <button onClick={handleEnableWebcam} className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold flex items-center gap-2 mx-auto transition-transform transform hover:scale-105">
                Tentar Novamente
              </button>
            </div>
          ) : (
            <button onClick={handleEnableWebcam} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold text-lg flex items-center gap-2 transition-transform transform hover:scale-105">
              <CameraIcon /> Iniciar Piano Virtual
            </button>
          )}
        </div>
      )}

      <video ref={videoRef} autoPlay playsInline className="absolute top-0 left-0 w-0 h-0"></video>
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full"></canvas>
      
      {webcamEnabled && (
        <>
          <button 
            onClick={() => setShowSettings(true)} 
            className="absolute top-4 right-4 z-40 text-white p-2 bg-black/30 hover:bg-white/20 rounded-full transition-colors"
            title="Configurações"
          >
            <SettingsIcon />
          </button>

          {showSettings && (
            <div 
              className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowSettings(false)}
            ></div>
          )}

          <div 
            className={`absolute top-0 right-0 h-full bg-gray-900/80 backdrop-blur-lg z-50 flex flex-col transition-transform transform ${showSettings ? 'translate-x-0' : 'translate-x-full'} w-80 max-w-full`}
          >
            <div className="flex-shrink-0 flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold">Configurações</h2>
              <button onClick={() => setShowSettings(false)} className="text-white p-2 hover:bg-white/20 rounded-full transition-colors">
                <CloseIcon />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6">
                <div className="space-y-6">
                    <div className="p-4 rounded-lg bg-white/10">
                        <label className="block text-lg font-semibold mb-2">Controles de Visualização</label>
                        <div className="flex items-center justify-between">
                            <span>Mostrar Vídeo</span>
                            <button onClick={() => setShowVideo(!showVideo)} title={showVideo ? 'Ocultar Vídeo' : 'Mostrar Vídeo'} className="text-white p-2 hover:bg-white/20 rounded-full transition-colors">
                                {showVideo ? <VideoOnIcon /> : <VideoOffIcon />}
                            </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <span>Mostrar Piano</span>
                            <button onClick={() => setShowPiano(!showPiano)} title={showPiano ? 'Ocultar Piano' : 'Mostrar Piano'} className="text-white p-2 hover:bg-white/20 rounded-full transition-colors">
                                <PianoIcon />
                            </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <span>Posição do Piano</span>
                            <button onClick={() => setPianoPosition(p => p === 'top' ? 'bottom' : 'top')} title={`Mover piano para ${pianoPosition === 'top' ? 'baixo' : 'cima'}`} className="text-white p-2 hover:bg-white/20 rounded-full transition-colors">
                                <PianoPositionIcon />
                            </button>
                        </div>
                         <div className="flex items-center justify-between mt-2">
                            <span>Inverter Horizontalmente</span>
                            <button onClick={() => setFlipHorizontal(!flipHorizontal)} title="Inverter Horizontalmente" className="text-white p-2 hover:bg-white/20 rounded-full transition-colors">
                                <FlipHorizontalIcon />
                            </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <span>Inverter Verticalmente</span>
                            <button onClick={() => setFlipVertical(!flipVertical)} title="Inverter Verticalmente" className="text-white p-2 hover:bg-white/20 rounded-full transition-colors">
                                <FlipVerticalIcon />
                            </button>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg bg-white/10">
                        <label className="block text-lg font-semibold mb-2">Controles de Áudio</label>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsMuted(!isMuted)} title={isMuted ? 'Ativar Som' : 'Silenciar'} className="text-white p-2 hover:bg-white/20 rounded-full transition-colors">
                            {isMuted ? <SoundOffIcon /> : <SoundOnIcon />}
                            </button>
                            <input 
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                            disabled={isMuted}
                            title="Volume"
                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="p-4 rounded-lg bg-white/10">
                        <label htmlFor="sensitivity-slider" className="block text-lg font-semibold mb-2">Sensibilidade</label>
                        <div className="flex items-center gap-2">
                            <div title="Sensibilidade do Gatilho" className="text-white p-2">
                                <SensitivityIcon />
                            </div>
                            <input 
                                id="sensitivity-slider"
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={sensitivity}
                                onChange={handleSensitivityChange}
                                title="Sensibilidade do Gatilho (Quanto maior, mais sensível)"
                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Quanto maior o valor, mais fácil será para acionar uma nota.</p>
                    </div>
                </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VirtualPiano;