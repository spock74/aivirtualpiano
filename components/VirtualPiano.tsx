import React, { useEffect, useRef, useState, useCallback } from 'react';
import { HandLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { PIANO_KEYS, KEYBOARD_WIDTH, KEYBOARD_HEIGHT, FINGERTIP_LANDMARKS, INSTRUMENT_KEYS } from '../constants';
import { instrumentPlayer, INSTRUMENTS } from '../services/instrumentPlayer.ts';
import {
    CameraIcon, LoadingIcon, SoundOnIcon, SoundOffIcon, VideoOnIcon, VideoOffIcon,
    PianoIcon, PianoPositionIcon, FlipHorizontalIcon, FlipVerticalIcon, SensitivityIcon, InstrumentIcon,
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
  const debugScoresRef = useRef({ press: 0, z: 0, curl: 0 });
  
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
  const [instrument, setInstrument] = useState('piano');
  const [showSettings, setShowSettings] = useState(false);

  const showVideoRef = useRef(showVideo);
  const showPianoRef = useRef(showPiano);
  const pianoPositionRef = useRef(pianoPosition);
  const flipHorizontalRef = useRef(flipHorizontal);
  const flipVerticalRef = useRef(flipVertical);
  const sensitivityRef = useRef(sensitivity);
  const instrumentRef = useRef(instrument);

  const detectionAlgorithm = process.env.VITE_ALGORITHM_HAMMER_DETECTION || '1';

  useEffect(() => { showVideoRef.current = showVideo; }, [showVideo]);
  useEffect(() => { showPianoRef.current = showPiano; }, [showPiano]);
  useEffect(() => { pianoPositionRef.current = pianoPosition; }, [pianoPosition]);
  useEffect(() => { flipHorizontalRef.current = flipHorizontal; }, [flipHorizontal]);
  useEffect(() => { flipVerticalRef.current = flipVertical; }, [flipVertical]);
  useEffect(() => { sensitivityRef.current = sensitivity; }, [sensitivity]);
  useEffect(() => { instrumentRef.current = instrument; }, [instrument]);

  // --- ALGORITHM 1: Hammer-based detection ---
  const detectHammerPress = useCallback((
    landmarks: NormalizedLandmark[],
    prevLandmarks: NormalizedLandmark[] | null,
    tipIndex: number,
    fingerId: string,
    keyUnderFinger: string,
    currentFrameHeldKeys: Set<string>
  ) => {
    const Z_VELOCITY_MIN = 0.0005;
    const Z_VELOCITY_MAX = 0.003;
    const CURL_VELOCITY_MIN = 0.0005;
    const CURL_VELOCITY_MAX = 0.0035;
    const PRESS_THRESHOLD = 1.2 - (sensitivityRef.current * 1.0);

    const jointIndices = FINGER_JOINTS_MAP[tipIndex];
    if (jointIndices && prevLandmarks) {
      const { mcp: mcpIndex } = jointIndices;
      if (landmarks[mcpIndex] && prevLandmarks[tipIndex] && prevLandmarks[mcpIndex]) {
        const prevFingertip = prevLandmarks[tipIndex];
        const fingertip = landmarks[tipIndex];
        const prevMcp = prevLandmarks[mcpIndex];
        const mcpJoint = landmarks[mcpIndex];

        const tipZVelocity = prevFingertip.z - fingertip.z;
        const currentDist = Math.hypot(fingertip.x - mcpJoint.x, fingertip.y - mcpJoint.y);
        const prevDist = Math.hypot(prevFingertip.x - prevMcp.x, prevFingertip.y - prevMcp.y);
        const curlVelocity = prevDist - currentDist;

        let zScore = 0;
        if (tipZVelocity > Z_VELOCITY_MIN) {
          zScore = Math.min(1, (tipZVelocity - Z_VELOCITY_MIN) / (Z_VELOCITY_MAX - Z_VELOCITY_MIN));
        }

        let curlScore = 0;
        if (curlVelocity > CURL_VELOCITY_MIN) {
          curlScore = Math.min(1, (curlVelocity - CURL_VELOCITY_MIN) / (CURL_VELOCITY_MAX - CURL_VELOCITY_MIN));
        }

        const pressScore = zScore + curlScore;
        const isAttacking = pressScore > PRESS_THRESHOLD;

        if (isAttacking) {          
          currentFrameHeldKeys.add(keyUnderFinger);
        }
      }
    }
  }, [sensitivityRef]);

  // --- ALGORITHM 2: State-based detection ---
  const detectPositionalPress = useCallback((
    landmarks: NormalizedLandmark[],
    prevLandmarks: NormalizedLandmark[] | null,
    tipIndex: number,
    fingerId: string,
    keyUnderFinger: string,
    handIndex: number,
    currentFrameHeldKeys: Set<string>
  ) => {
    // Sensitivity threshold for finger press detection.
    // A lower value makes it more sensitive (easier to press).
    const PRESS_THRESHOLD = 1.0 - sensitivityRef.current;

    const fingertip = landmarks[tipIndex];
    const pipJoint = landmarks[tipIndex - 2]; // Proximal Interphalangeal joint
    const wrist = landmarks[0];

    // Check if the fingertip's Y is greater (lower on screen) than the PIP joint's Y.
    // The threshold factor makes it more or less sensitive.
    const isPressed = fingertip.y > pipJoint.y + (pipJoint.y - landmarks[tipIndex - 3].y) * PRESS_THRESHOLD;
    
    // Check if the finger is angled down towards the piano to avoid accidental triggers.
    const isAngledDown = fingertip.z > wrist.z;

    if (isPressed && isAngledDown) {
      currentFrameHeldKeys.add(keyUnderFinger);
    }

    // Update debug ref for the index finger of the first hand
    if (handIndex === 0 && tipIndex === 8) {
        debugScoresRef.current = { press: isPressed && isAngledDown ? 1 : 0, z: isAngledDown ? 1: 0, curl: isPressed ? 1 : 0 };
    }
  }, [sensitivityRef]);

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
      setLoadingMessage('Carregando sons do piano...');
      await instrumentPlayer.loadSamples(instrumentRef.current);
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
    instrumentPlayer.setVolume(isMuted ? 0 : volume);
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
              if (detectionAlgorithm === '1') {
                detectHammerPress(landmarks, prevLandmarks, tipIndex, fingerId, keyUnderFinger, currentFrameHeldKeys);
              } else if (detectionAlgorithm === '2') {
                detectPositionalPress(landmarks, prevLandmarks, tipIndex, fingerId, keyUnderFinger, i, currentFrameHeldKeys);
              }
          }
        }
      }
    }
    
    const previouslyHeldKeys = heldKeysRef.current;
    const currentInstrument = INSTRUMENTS[instrumentRef.current] || INSTRUMENTS.piano;

    // --- NOTE ON / NOTE OFF LOGIC ---
    if (currentInstrument.type === 'attack') {
      // For attack instruments (piano), only play on the initial press.
      for (const note of currentFrameHeldKeys) {
        if (!previouslyHeldKeys.has(note)) {
          instrumentPlayer.playNote(note);
        }
      }
    } else { // sustain instruments
      // For sustain instruments (organ), play whenever the key is held.
      for (const note of currentFrameHeldKeys) {
        instrumentPlayer.playNote(note);
      }
      // And explicitly stop notes that are no longer held.
      for (const note of previouslyHeldKeys) {
        if (!currentFrameHeldKeys.has(note)) {
          instrumentPlayer.stopNote(note);
        }
      }
    }
    heldKeysRef.current = currentFrameHeldKeys;

    // --- DRAWING ---
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    if (!showVideoRef.current) {
        canvasCtx.fillStyle = 'black';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    const scaleH = flipHorizontalRef.current ? -1 : 1;
    const scaleV = flipVerticalRef.current ? -1 : 1;
    const translateX = flipHorizontalRef.current ? -canvas.width : 0;
    const translateY = flipVerticalRef.current ? -canvas.height : 0;

    if (showVideoRef.current) {
        canvasCtx.save();
        canvasCtx.scale(scaleH, scaleV);
        canvasCtx.translate(translateX, translateY);
        canvasCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvasCtx.restore();
    }
    
    if (showPianoRef.current) {
        drawPiano(canvasCtx, currentFrameHeldKeys, pianoPositionRef.current);
    }
    
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

    // // Draw the debug text overlay on top of everything else
    // const scores = debugScoresRef.current;
    // const debugText = `Alg: ${detectionAlgorithm} | Press: ${scores.press.toFixed(2)} | Z: ${scores.z.toFixed(2)} | Curl: ${scores.curl.toFixed(2)}`;
    // canvasCtx.fillStyle = "red";
    // canvasCtx.font = "20px Arial";
    // canvasCtx.fillText(debugText, 10, 30);
    
    prevSmoothedLandmarksRef.current = JSON.parse(JSON.stringify(smoothedLandmarksRef.current));
    
    animationFrameId.current = requestAnimationFrame(predictWebcam);
  }, [detectHammerPress, detectPositionalPress]);
  
  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(event.target.value));
  };

  const handleSensitivityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSensitivity(parseFloat(event.target.value));
  };

  const handleInstrumentChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newInstrument = event.target.value;
    setInstrument(newInstrument);
    setLoading(true);
    setLoadingMessage(`Carregando sons de ${INSTRUMENTS[newInstrument]?.name || 'instrumento'}...`);
    await instrumentPlayer.loadSamples(newInstrument);
    setLoading(false);
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
              <button onClick={handleEnableWebcam} className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold flex items-center gap-2 mx-auto transition-transform transform hover:scale-105">
                Tentar Novamente
              </button>
            </div>
          ) : (
            <button onClick={handleEnableWebcam} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold text-lg flex items-center gap-2 transition-transform transform hover:scale-105">
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
                            <button onClick={() => setShowVideo(!showVideo)} title={showVideo ? 'Ocultar Vídeo' : 'Mostrar Vídeo'} className="text-white p-2 hover:bg-white/20 rounded-full transition-colors border border-white/20 hover:border-white/50">
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
                        <label htmlFor="instrument-select" className="block text-lg font-semibold mb-2">Instrumento</label>
                        <div className="flex items-center gap-2">
                            <div title="Instrumento Musical" className="text-white p-2">
                                <InstrumentIcon />
                            </div>
                            <select 
                                id="instrument-select"
                                value={instrument}
                                onChange={handleInstrumentChange}
                                className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5"
                            >
                                {INSTRUMENT_KEYS.map(key => (
                                    <option key={key} value={key}>{INSTRUMENTS[key].name}</option>
                                ))}
                            </select>
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
