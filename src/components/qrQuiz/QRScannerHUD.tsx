import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  QRStudent,
  QRQuestion,
  QRAnswerSubmission,
  QRDirection,
} from '../../types/qrQuiz';
import { scanImageDataForQR, QRDetectionResult } from '../../utils/qrAngleDetector';

interface QRScannerHUDProps {
  roomCode: string;
  currentQuestion?: QRQuestion;
  questionIndex: number;
  totalQuestions: number;
  students: QRStudent[];
  recordedAnswers: Record<string, QRAnswerSubmission>;
  isLocked: boolean;
  isRevealed: boolean;
  onRecordAnswer: (submission: QRAnswerSubmission) => void;
  onLockAnswers: () => void;
  onRevealAnswer: () => void;
  onNextQuestion: () => void;
  onExitScanner: () => void;
}

export const QRScannerHUD: React.FC<QRScannerHUDProps> = ({
  roomCode,
  currentQuestion,
  questionIndex,
  totalQuestions,
  students,
  recordedAnswers,
  isLocked,
  isRevealed,
  onRecordAnswer,
  onLockAnswers,
  onRevealAnswer,
  onNextQuestion,
  onExitScanner,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);

  // Audio Context for beep
  const audioContextRef = useRef<AudioContext | null>(null);

  // Last detected map for cooldown and deduplication
  const lastDetectedTimestamp = useRef<Map<string, number>>(new Map());
  const [recentDetections, setRecentDetections] = useState<
    Array<{
      studentName: string;
      answer: QRDirection;
      isCorrect: boolean;
      timestamp: number;
    }>
  >([]);

  // Play crisp positive ding on scan
  const playScanChime = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);

      if (navigator.vibrate) {
        navigator.vibrate(40);
      }
    } catch {
      // Audio not permitted yet or failed
    }
  }, []);

  // Initialize camera stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isActive = true;

    const startCamera = async () => {
      try {
        setCameraError('');
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!isActive) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
        }

        setHasCameraPermission(true);

        // Check torch support
        const track = stream.getVideoTracks()[0];
        const capabilities = (track as any)?.getCapabilities?.();
        if (capabilities && 'torch' in capabilities) {
          setHasTorch(true);
        }
      } catch (err: any) {
        console.error('Camera access error:', err);
        setHasCameraPermission(false);
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Cô chưa cấp quyền truy cập máy ảnh. Vui lòng bật quyền camera trong trình duyệt.'
            : 'Không thể mở camera thiết bị: ' + (err.message || 'Lỗi không xác định')
        );
      }
    };

    startCamera();

    return () => {
      isActive = false;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode]);

  // Toggle flashlight
  const toggleTorch = async () => {
    if (!videoRef.current?.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    try {
      await (track as any).applyConstraints({
        advanced: [{ torch: !isTorchOn }],
      });
      setIsTorchOn(!isTorchOn);
    } catch (err) {
      console.warn('Cannot toggle torch:', err);
    }
  };

  // Continuous frame scanning loop
  useEffect(() => {
    let animationFrameId: number;
    let isProcessing = false;

    const scanFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const overlay = overlayCanvasRef.current;

      if (
        !isProcessing &&
        video &&
        video.readyState === video.HAVE_ENOUGH_DATA &&
        canvas &&
        overlay &&
        !isLocked
      ) {
        const vWidth = video.videoWidth;
        const vHeight = video.videoHeight;

        if (canvas.width !== vWidth || canvas.height !== vHeight) {
          canvas.width = vWidth;
          canvas.height = vHeight;
          overlay.width = vWidth;
          overlay.height = vHeight;
        }

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const oCtx = overlay.getContext('2d');

        if (ctx && oCtx) {
          isProcessing = true;
          ctx.drawImage(video, 0, 0, vWidth, vHeight);
          const imageData = ctx.getImageData(0, 0, vWidth, vHeight);

          // Clear previous overlays
          oCtx.clearRect(0, 0, vWidth, vHeight);

          const result: QRDetectionResult | null = scanImageDataForQR(imageData);
          const detectedToken = (result?.studentToken || result?.token || '').toLowerCase();

          if (result && detectedToken) {
            // Find student matching token or code
            const matchedStudent = students.find(
              (s) =>
                s.qrToken.toLowerCase() === detectedToken ||
                s.studentCode.toLowerCase() === detectedToken ||
                s.id.toLowerCase() === detectedToken
            );

            if (matchedStudent) {
              const now = Date.now();
              const lastSeen = lastDetectedTimestamp.current.get(matchedStudent.id) || 0;

              // Draw on overlay canvas
              drawCardBoundingBox(oCtx, result, matchedStudent.name, result.answer);

              // Debounce recording (update if orientation changed or at least 800ms passed)
              const existingAns = recordedAnswers[matchedStudent.id];
              const isDifferentAnswer = existingAns && existingAns.selectedAnswer !== result.answer;

              if (now - lastSeen > 600 || isDifferentAnswer) {
                lastDetectedTimestamp.current.set(matchedStudent.id, now);
                playScanChime();

                const isCorrect = currentQuestion
                  ? result.answer === currentQuestion.correctAnswer
                  : false;

                const submission: QRAnswerSubmission = {
                  studentId: matchedStudent.id,
                  studentName: matchedStudent.name,
                  className: matchedStudent.className,
                  selectedAnswer: result.answer,
                  detectedAngle: result.angle,
                  timestamp: now,
                  isCorrect,
                  pointsAwarded: isCorrect ? (currentQuestion?.points || 10) : 0,
                };

                onRecordAnswer(submission);

                setRecentDetections((prev) => [
                  {
                    studentName: matchedStudent.name,
                    answer: result.answer,
                    isCorrect,
                    timestamp: now,
                  },
                  ...prev.slice(0, 4),
                ]);
              }
            }
          }
          isProcessing = false;
        }
      }

      animationFrameId = requestAnimationFrame(scanFrame);
    };

    animationFrameId = requestAnimationFrame(scanFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    isLocked,
    students,
    recordedAnswers,
    currentQuestion,
    onRecordAnswer,
    playScanChime,
  ]);

  // Helper to draw clean glowing bounding box and student name on camera stream
  const drawCardBoundingBox = (
    ctx: CanvasRenderingContext2D,
    res: QRDetectionResult,
    studentName: string,
    answer: QRDirection
  ) => {
    const { corners, center } = res;

    ctx.save();
    // Bounding Polygon
    ctx.beginPath();
    ctx.moveTo(corners.topLeft.x, corners.topLeft.y);
    ctx.lineTo(corners.topRight.x, corners.topRight.y);
    ctx.lineTo(corners.bottomRight.x, corners.bottomRight.y);
    ctx.lineTo(corners.bottomLeft.x, corners.bottomLeft.y);
    ctx.closePath();

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#10B981'; // Emerald glow
    ctx.shadowColor = 'rgba(16, 185, 129, 0.8)';
    ctx.shadowBlur = 12;
    ctx.stroke();

    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.fill();

    // Floating Answer Badge above center
    const badgeY = Math.min(corners.topLeft.y, corners.topRight.y) - 35;
    const badgeX = center.x;

    // Student name banner
    ctx.font = 'bold 20px system-ui, sans-serif';
    const text = `${studentName} • Đáp án: ${answer}`;
    const textWidth = ctx.measureText(text).width;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.roundRect(badgeX - textWidth / 2 - 14, badgeY - 24, textWidth + 28, 36, 10);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, badgeX, badgeY - 6);

    ctx.restore();
  };

  const answeredCount = Object.keys(recordedAnswers).length;
  const totalCount = students.length;
  const percentAnswered = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col select-none overflow-hidden text-white font-sans">
      {/* Offscreen working canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExitScanner}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition"
          >
            ✕
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500 font-bold uppercase tracking-wider">
                Quét Trực Tiếp
              </span>
              <span className="text-xs font-mono text-slate-300">
                Phòng: {roomCode}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mt-0.5">
              Câu {questionIndex + 1}/{totalQuestions}
            </h3>
          </div>
        </div>

        {/* Quick Camera tools */}
        <div className="flex items-center gap-2">
          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg backdrop-blur-md transition ${
                isTorchOn ? 'bg-amber-400 text-slate-900' : 'bg-white/20 text-white'
              }`}
              title="Bật/Tắt đèn pin"
            >
              🔦
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              setFacingMode((p) => (p === 'environment' ? 'user' : 'environment'))
            }
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition text-lg"
            title="Đổi camera"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        {/* Video feed */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay Canvas for real-time tracking boxes */}
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
        />

        {/* Center Guide Reticle (Subtle guide for teacher) */}
        {!isLocked && (
          <div className="absolute z-20 pointer-events-none flex flex-col items-center">
            <div className="w-64 h-64 border-2 border-white/30 rounded-3xl relative">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
            </div>
            <p className="text-xs text-white/80 bg-black/50 px-3 py-1 rounded-full mt-3 backdrop-blur-sm">
              Lia máy ảnh về phía bảng đáp án học sinh
            </p>
          </div>
        )}

        {/* Camera Permission Failure Notice */}
        {hasCameraPermission === false && (
          <div className="absolute inset-0 z-40 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-3xl mb-4">
              📷
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Chưa thể mở camera
            </h3>
            <p className="text-sm text-slate-300 max-w-sm mb-6 leading-relaxed">
              {cameraError ||
                'Trình duyệt cần quyền truy cập camera để quét mã QR xoay 4 hướng của bé.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-sm"
            >
              Thử lại / Cấp quyền
            </button>
          </div>
        )}

        {/* Question Prompt Overlay at top center */}
        {currentQuestion && (
          <div className="absolute top-16 left-4 right-4 z-20 max-w-lg mx-auto bg-slate-950/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-lg">
            <p className="text-xs font-semibold text-slate-200 line-clamp-2">
              {currentQuestion.prompt || currentQuestion.title}
            </p>
            {isRevealed && (
              <div className="mt-1.5 flex items-center gap-2 text-xs font-bold text-emerald-400">
                <span>Đáp án đúng:</span>
                <span className="w-5 h-5 rounded-md bg-emerald-500 text-slate-950 flex items-center justify-center font-extrabold text-[11px]">
                  {currentQuestion.correctAnswer}
                </span>
                <span>
                  (
                  {currentQuestion.options?.[currentQuestion.correctAnswer]?.text ||
                    (currentQuestion as any)[`option${currentQuestion.correctAnswer}`] ||
                    'Chính xác'}
                  )
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="relative z-30 bg-slate-950/95 border-t border-white/10 p-4 pb-6 space-y-3">
        {/* Progress Bar & Counter */}
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-slate-300">
            Tiến độ: <strong className="text-white">{answeredCount}</strong> / {totalCount} bé ({percentAnswered}%)
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isLocked ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span className="text-slate-400">
              {isLocked ? 'Đã chốt đáp án' : 'Đang quét tự động'}
            </span>
          </div>
        </div>

        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${percentAnswered}%` }}
          />
        </div>

        {/* Recently scanned avatars ticker */}
        {recentDetections.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-[11px] text-slate-400 flex-shrink-0">Vừa nhận:</span>
            {recentDetections.map((det, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 text-xs flex-shrink-0 border border-white/5 animate-in fade-in"
              >
                <span className="font-semibold text-slate-200">{det.studentName}</span>
                <span className="w-4 h-4 rounded bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center">
                  {det.answer}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Host Control Actions */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {!isLocked ? (
            <button
              type="button"
              onClick={onLockAnswers}
              className="col-span-3 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-2xl text-sm shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
            >
              <span>🔒</span>
              <span>Chốt câu trả lời ({answeredCount} bé)</span>
            </button>
          ) : !isRevealed ? (
            <>
              <button
                type="button"
                onClick={onLockAnswers} // Toggle back to unlock if needed
                className="py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-2xl text-xs active:scale-95 transition"
              >
                Mở quét lại
              </button>
              <button
                type="button"
                onClick={onRevealAnswer}
                className="col-span-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-2xl text-sm shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
              >
                <span>🎉</span>
                <span>Công bố đáp án đúng</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onRevealAnswer}
                className="py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-2xl text-xs"
              >
                Xem lại
              </button>
              <button
                type="button"
                onClick={onNextQuestion}
                className="col-span-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm shadow-lg active:scale-95 transition flex items-center justify-center gap-2"
              >
                <span>Câu tiếp theo &gt;</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
