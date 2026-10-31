import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  QRQuestionPack,
  QRQuestion,
  QRStudent,
  QRAnswerSubmission,
  QRSessionHistoryRecord,
} from '../../types/qrQuiz';
import { saveQRSessionHistory } from '../../services/qrStorage';
import QRCode from 'qrcode';

interface QRHostScreenProps {
  roomCode: string;
  pack: QRQuestionPack;
  students: QRStudent[];
  recordedAnswers: Record<string, QRAnswerSubmission>;
  isLocked: boolean;
  isRevealed: boolean;
  currentQuestionIndex: number;
  onLockAnswers: () => void;
  onRevealAnswer: () => void;
  onNextQuestion: () => void;
  onFinishQuiz: () => void;
  onLaunchScannerLocal: () => void;
  onExit: () => void;
}

export const QRHostScreen: React.FC<QRHostScreenProps> = ({
  roomCode,
  pack,
  students,
  recordedAnswers,
  isLocked,
  isRevealed,
  currentQuestionIndex,
  onLockAnswers,
  onRevealAnswer,
  onNextQuestion,
  onFinishQuiz,
  onLaunchScannerLocal,
  onExit,
}) => {
  const currentQuestion: QRQuestion | undefined = pack.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex >= pack.questions.length - 1;

  // Phone connection QR modal
  const [isPhoneConnectModalOpen, setIsPhoneConnectModalOpen] = useState(false);
  const [phoneConnectQrDataUrl, setPhoneConnectQrDataUrl] = useState('');

  // Audio & speech
  const speakQuestion = () => {
    if (!currentQuestion || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const text = currentQuestion.prompt || currentQuestion.title;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'vi-VN';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  // Generate phone connect QR
  useEffect(() => {
    const scannerUrl = `${window.location.origin}?view=qr_scanner&room=${roomCode}`;
    QRCode.toDataURL(scannerUrl, { width: 300, margin: 2 })
      .then(setPhoneConnectQrDataUrl)
      .catch(console.error);
  }, [roomCode]);

  // Answer statistics
  const stats = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    let correctCount = 0;
    const answeredStudentIds = Object.keys(recordedAnswers);

    answeredStudentIds.forEach((id) => {
      const ans = recordedAnswers[id];
      if (ans && ans.selectedAnswer) {
        counts[ans.selectedAnswer]++;
        if (ans.isCorrect) {
          correctCount++;
        }
      }
    });

    const totalAnswered = answeredStudentIds.length;
    return {
      counts,
      totalAnswered,
      correctCount,
      correctPercent: totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0,
    };
  }, [recordedAnswers]);

  // Option colors
  const optionTheme = {
    A: { bg: 'bg-rose-500', border: 'border-rose-400', light: 'bg-rose-50', text: 'text-rose-700' },
    B: { bg: 'bg-sky-500', border: 'border-sky-400', light: 'bg-sky-50', text: 'text-sky-700' },
    C: { bg: 'bg-amber-500', border: 'border-amber-400', light: 'bg-amber-50', text: 'text-amber-700' },
    D: { bg: 'bg-emerald-500', border: 'border-emerald-400', light: 'bg-emerald-50', text: 'text-emerald-700' },
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none">
      {/* Top TV Navigation Bar */}
      <header className="bg-slate-950/80 border-b border-white/10 px-6 py-3.5 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onExit}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-medium transition"
          >
            ← Thoát
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold uppercase tracking-wider">
                Bảng Đáp Án QR
              </span>
              <span className="text-sm font-bold text-white truncate max-w-md">
                {pack.title}
              </span>
            </div>
          </div>
        </div>

        {/* Center Room Code Pill */}
        <div className="hidden sm:flex items-center gap-3 bg-white/10 px-4 py-1.5 rounded-2xl border border-white/10">
          <span className="text-xs text-slate-400">Mã phòng quét:</span>
          <span className="text-lg font-black tracking-widest text-amber-300 font-mono">
            {roomCode}
          </span>
          <button
            type="button"
            onClick={() => setIsPhoneConnectModalOpen(true)}
            className="ml-2 text-xs text-indigo-300 hover:text-white underline flex items-center gap-1"
          >
            <span>📱</span>
            <span>Kết nối điện thoại</span>
          </button>
        </div>

        {/* Right Status & Direct Local Camera */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onLaunchScannerLocal}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
            title="Dùng camera máy này để quét"
          >
            <span>📷</span>
            <span className="hidden md:inline">Mở camera máy này</span>
          </button>

          <div className="text-right">
            <span className="text-xs text-slate-400">Câu hỏi:</span>
            <p className="text-sm font-black text-amber-400">
              {currentQuestionIndex + 1} / {pack.questions.length}
            </p>
          </div>
        </div>
      </header>

      {/* Main Classroom Screen Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Big Question Card + 4 Options (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {currentQuestion ? (
            <div className="bg-slate-800/90 rounded-3xl p-6 border border-white/10 shadow-2xl space-y-5">
              {/* Question prompt & Voice */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Câu số {currentQuestionIndex + 1}
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-white leading-relaxed">
                    {currentQuestion.prompt || currentQuestion.title}
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={speakQuestion}
                  className="w-12 h-12 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center text-xl font-bold shadow-md active:scale-95 transition flex-shrink-0"
                  title="Cô đọc câu hỏi cho bé"
                >
                  🔊
                </button>
              </div>

              {/* Big Illustration Image */}
              {currentQuestion.imageUrl && (
                <div className="w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-white/10 bg-slate-950 flex items-center justify-center">
                  <img
                    src={currentQuestion.imageUrl}
                    alt="Hình minh họa câu hỏi"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}

              {/* 4 Answer Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                  const optText = currentQuestion.options?.[letter]?.text || (currentQuestion as any)[`option${letter}`] || '—';
                  const theme = optionTheme[letter];
                  const isCorrect = currentQuestion.correctAnswer === letter;
                  const countPicked = stats.counts[letter];

                  return (
                    <div
                      key={letter}
                      className={`relative p-4 rounded-2xl border transition-all flex items-center gap-3 overflow-hidden ${
                        isRevealed && isCorrect
                          ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-400 shadow-lg'
                          : isRevealed && !isCorrect
                          ? 'bg-slate-900/60 border-white/5 opacity-60'
                          : 'bg-slate-900/80 border-white/10'
                      }`}
                    >
                      {/* Letter Badge */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-sm flex-shrink-0 ${
                          isRevealed && isCorrect ? 'bg-emerald-500' : theme.bg
                        }`}
                      >
                        {letter}
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm sm:text-base font-bold leading-tight ${
                            isRevealed && isCorrect ? 'text-emerald-300' : 'text-slate-100'
                          }`}
                        >
                          {optText}
                        </p>
                      </div>

                      {/* Revealed count & Correct tick */}
                      {isRevealed && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isCorrect && (
                            <span className="text-xl text-emerald-400 font-black animate-bounce">
                              ✓
                            </span>
                          )}
                          <span className="text-xs px-2 py-1 rounded-lg bg-white/10 text-white font-mono font-bold">
                            {countPicked} bé
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Revealed Explanation */}
              {isRevealed && currentQuestion.explanation && (
                <div className="p-4 rounded-2xl bg-indigo-950/70 border border-indigo-400/40 text-indigo-200 text-sm flex items-start gap-3 animate-in fade-in">
                  <span className="text-xl">💡</span>
                  <div>
                    <h5 className="font-bold text-white text-xs uppercase tracking-wider">
                      Lời cô giải thích:
                    </h5>
                    <p className="mt-1 leading-relaxed">{currentQuestion.explanation}</p>
                  </div>
                </div>
              )}

              {/* Big Classroom Host Actions */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/10">
                <div className="text-sm font-semibold text-slate-300">
                  {!isLocked ? (
                    <span className="flex items-center gap-2 text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      Bé giơ bảng xoay đáp án lên trên để cô quét...
                    </span>
                  ) : !isRevealed ? (
                    <span className="text-amber-300">
                      🔒 Đã chốt {stats.totalAnswered} câu trả lời. Chuẩn bị mở đáp án!
                    </span>
                  ) : (
                    <span className="text-emerald-400">
                      🎉 Có {stats.correctCount}/{stats.totalAnswered} bé trả lời đúng ({stats.correctPercent}%)!
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!isLocked ? (
                    <button
                      type="button"
                      onClick={onLockAnswers}
                      className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg active:scale-95 transition"
                    >
                      Chốt đáp án ({stats.totalAnswered} bé)
                    </button>
                  ) : !isRevealed ? (
                    <button
                      type="button"
                      onClick={onRevealAnswer}
                      className="px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg active:scale-95 transition"
                    >
                      Công bố đáp án đúng
                    </button>
                  ) : isLastQuestion ? (
                    <button
                      type="button"
                      onClick={onFinishQuiz}
                      className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-sm shadow-xl active:scale-95 transition"
                    >
                      🏆 Tổng kết ván chơi
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onNextQuestion}
                      className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-lg active:scale-95 transition"
                    >
                      Câu tiếp theo &gt;
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 p-12 text-center rounded-3xl border border-white/10">
              <p>Đã hoàn thành toàn bộ câu hỏi!</p>
            </div>
          )}
        </div>

        {/* Right Column: Classroom Student Grid (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-800/90 rounded-3xl p-5 border border-white/10 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="font-black text-base text-white flex items-center gap-2">
                  <span>👶 Học sinh trong lớp</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                    {stats.totalAnswered} / {students.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Thẻ đổi màu khi cô quét thành công bảng QR của bé.
                </p>
              </div>

              {/* Progress pill */}
              <div className="text-right">
                <span className="text-lg font-black text-amber-400 font-mono">
                  {students.length > 0 ? Math.round((stats.totalAnswered / students.length) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Students Visual Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
              {students.map((student) => {
                const submission = recordedAnswers[student.id];
                const hasAnswered = Boolean(submission);
                const isCorrect = submission?.isCorrect;

                return (
                  <div
                    key={student.id}
                    className={`p-2.5 rounded-2xl border transition-all flex items-center gap-2.5 ${
                      isRevealed && hasAnswered
                        ? isCorrect
                          ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-sm'
                          : 'bg-rose-950/60 border-rose-400/60 text-slate-200'
                        : hasAnswered
                        ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-md transform scale-[1.02]'
                        : 'bg-slate-900/60 border-white/5 text-slate-400'
                    }`}
                  >
                    {/* Mini Avatar */}
                    <div className="w-8 h-8 rounded-xl bg-slate-950/40 flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-xs">
                      {student.avatarUrl ? (
                        <img
                          src={student.avatarUrl}
                          alt={student.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>👶</span>
                      )}
                    </div>

                    {/* Name & Selected Answer */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate leading-tight">
                        {student.name}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {hasAnswered ? (
                          isRevealed ? (
                            <span
                              className={`text-[11px] font-black px-1.5 py-0.2 rounded ${
                                isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                              }`}
                            >
                              {submission.selectedAnswer} {isCorrect ? '✓' : '✗'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-950 flex items-center gap-1">
                              ✓ Đã quét
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-500">Đang nghĩ...</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Answer Distribution Histogram during reveal */}
            {isRevealed && (
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2 animate-in fade-in">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Phân bố lựa chọn cả lớp:
                </h4>
                <div className="space-y-1.5 text-xs">
                  {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                    const count = stats.counts[letter];
                    const percent =
                      stats.totalAnswered > 0
                        ? Math.round((count / stats.totalAnswered) * 100)
                        : 0;
                    const isCorrect = currentQuestion?.correctAnswer === letter;

                    return (
                      <div key={letter} className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] ${
                            isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-white'
                          }`}
                        >
                          {letter}
                        </span>
                        <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isCorrect ? 'bg-emerald-500' : 'bg-slate-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-12 text-right font-mono text-slate-300">
                          {count} bé ({percent}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Phone Connect QR Modal */}
      {isPhoneConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 text-white w-full max-w-sm rounded-3xl p-6 border border-white/15 shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>📱</span>
                <span>Quét bằng điện thoại cô</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPhoneConnectModalOpen(false)}
                className="text-slate-400 hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Cô dùng điện thoại mở Camera hoặc Zalo quét mã QR dưới đây để vào thẳng chế độ quét camera:
            </p>

            {/* QR Card */}
            <div className="p-4 bg-white rounded-2xl mx-auto w-52 h-52 flex items-center justify-center shadow-lg">
              {phoneConnectQrDataUrl ? (
                <img
                  src={phoneConnectQrDataUrl}
                  alt="Scan to connect phone"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 animate-pulse rounded" />
              )}
            </div>

            <div className="p-2.5 bg-slate-800 rounded-xl text-xs space-y-1">
              <p className="text-slate-400">Mã phòng kết nối:</p>
              <p className="text-2xl font-black text-amber-400 font-mono tracking-widest">
                {roomCode}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsPhoneConnectModalOpen(false)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition"
            >
              Đã hiểu & Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
