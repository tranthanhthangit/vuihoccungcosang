import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle2, AlertTriangle, Volume2, VolumeX, CheckSquare, Square, Sparkles } from 'lucide-react';
import { Question, TeamAnswer } from '../../types/game';
import { sounds } from '../../utils/sound';
import { realtime } from '../../services/realtimeClient';
import { speakQuestionWithOptions, stopSpeaking, isSpeechSupported, subscribeSpeakingState, unlockSpeechAudio } from '../../utils/speechVoice';

interface PlayerQuestionProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  startTime: number | null;
  timeLimit: number;
  existingAnswer?: TeamAnswer;
  onSubmitAnswer: (answerId: string, answerIds?: string[]) => void;
}

export const PlayerQuestion: React.FC<PlayerQuestionProps> = ({
  question,
  questionIndex,
  totalQuestions,
  startTime,
  timeLimit,
  existingAnswer,
  onSubmitAnswer,
}) => {
  const isMultiple = Boolean(question.allowMultipleCorrect);
  const [selectedOptId, setSelectedOptId] = useState<string | null>(existingAnswer ? existingAnswer.answerId : null);
  const [selectedOptIds, setSelectedOptIds] = useState<string[]>(() => {
    if (existingAnswer?.answerIds && existingAnswer.answerIds.length > 0) {
      return existingAnswer.answerIds;
    }
    if (existingAnswer?.answerId) {
      return existingAnswer.answerId.split(',');
    }
    return [];
  });
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(Boolean(existingAnswer));
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  // Theo yêu cầu: mặc định không tính giờ trả lời câu hỏi
  const isNoTimeLimit = true;
  const effectiveStart = startTime || realtime.getServerNow();

  // Untimed answering: timer is static/disabled
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const selectedOptIdRef = useRef(selectedOptId);
  selectedOptIdRef.current = selectedOptId;
  const selectedOptIdsRef = useRef(selectedOptIds);
  selectedOptIdsRef.current = selectedOptIds;
  const hasSubmittedRef = useRef(hasSubmitted);
  hasSubmittedRef.current = hasSubmitted;

  // Auto-submit selected option when unmounted if not submitted yet
  useEffect(() => {
    return () => {
      if (!hasSubmittedRef.current) {
        if (selectedOptIdsRef.current.length > 0) {
          onSubmitAnswer(selectedOptIdsRef.current.join(','), selectedOptIdsRef.current);
        } else if (selectedOptIdRef.current) {
          onSubmitAnswer(selectedOptIdRef.current, [selectedOptIdRef.current]);
        }
      }
    };
  }, [onSubmitAnswer]);

  useEffect(() => {
    if (existingAnswer) {
      setSelectedOptId(existingAnswer.answerId);
      if (existingAnswer.answerIds) {
        setSelectedOptIds(existingAnswer.answerIds);
      }
      setHasSubmitted(true);
    }
  }, [existingAnswer]);

  // Subscribe to speech state
  useEffect(() => {
    const unsub = subscribeSpeakingState((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => {
      unsub();
      stopSpeaking();
    };
  }, []);

  // Automatically read question aloud on student device if readQuestionAudio is enabled
  useEffect(() => {
    if (question && question.readQuestionAudio !== false && !existingAnswer) {
      unlockSpeechAudio();
      const autoTimer = setTimeout(() => {
        if (!hasSubmittedRef.current) {
          speakQuestionWithOptions(question.title, question.options);
        }
      }, 150);
      return () => {
        clearTimeout(autoTimer);
        stopSpeaking();
      };
    }
    return () => {
      stopSpeaking();
    };
  }, [questionIndex, question.id, existingAnswer]);

  // Read aloud automatically if question specifies or let child tap
  const handleToggleSpeak = () => {
    sounds.playClick();
    unlockSpeechAudio();
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speakQuestionWithOptions(question.title, question.options);
    }
  };

  // Single choice: select option (never locks; children can change choice freely until teacher clicks end question)
  const handleSelectSingleOption = (optId: string) => {
    setSelectedOptId(optId);
    stopSpeaking();
    sounds.playClick();

    // Update server with current selection, but keep options completely open and changeable
    onSubmitAnswer(optId, [optId]);
  };

  // Multiple choice: toggle option selection (never locks; children can change choices freely)
  const handleToggleMultipleOption = (optId: string) => {
    sounds.playClick();
    stopSpeaking();
    const nextSelected = selectedOptIds.includes(optId)
      ? selectedOptIds.filter((id) => id !== optId)
      : [...selectedOptIds, optId];

    setSelectedOptIds(nextSelected);

    if (nextSelected.length > 0) {
      onSubmitAnswer(nextSelected.join(','), nextSelected);
    }
  };

  const isTimedOut = false;

  // Cheerful pastel color schemes for preschool buttons
  const buttonColors = [
    { bg: 'bg-rose-500 hover:bg-rose-600', text: 'text-white' },
    { bg: 'bg-sky-500 hover:bg-sky-600', text: 'text-white' },
    { bg: 'bg-emerald-500 hover:bg-emerald-600', text: 'text-white' },
    { bg: 'bg-amber-500 hover:bg-amber-600', text: 'text-white' },
  ];

  const hasAnyImage = question.options.some((opt) => Boolean(opt.imageUrl));

  return (
    <div className={`max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto w-full px-3 sm:px-6 ${
      hasAnyImage ? 'py-1.5 sm:py-2.5' : 'py-2 sm:py-4'
    } flex flex-col justify-start touch-manipulation min-h-full flex-1`}>
      {/* Top Header with question info */}
      <div className={`flex items-center justify-between bg-white rounded-2xl border-2 border-slate-100 shadow-sm shrink-0 ${
        hasAnyImage ? 'p-2 sm:p-3 mb-2 sm:mb-3' : 'p-3.5 sm:p-4 mb-3 sm:mb-4'
      }`}>
        <span className="text-xs sm:text-sm font-black text-indigo-700 bg-indigo-50 px-3.5 py-1.5 rounded-xl border border-indigo-200">
          CÂU {questionIndex + 1} / {totalQuestions}
        </span>

        {/* Text to Speech Button for Children (chỉ hiện khi câu hỏi có bật đọc câu hỏi) */}
        {isSpeechSupported() && question.readQuestionAudio !== false && (
          <button
            type="button"
            onClick={handleToggleSpeak}
            className={`px-3.5 py-1.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
              isSpeaking
                ? 'bg-rose-500 text-white animate-pulse shadow-md'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
            }`}
            title="Đọc câu hỏi to rõ ràng cho các bé nghe"
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isSpeaking ? 'Dừng đọc' : '🔊 Đọc câu hỏi'}</span>
          </button>
        )}

        <span className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-purple-700 bg-purple-50 border border-purple-200 px-3.5 py-1.5 rounded-xl">
          <Clock className="w-3.5 h-3.5 text-purple-500" />
          <span>Không tính giờ</span>
        </span>
      </div>

      {/* Question Content */}
      <div className={`bg-white rounded-2xl sm:rounded-3xl border-2 border-indigo-100 shadow-md text-center shrink-0 ${
        hasAnyImage ? 'p-3 sm:p-4 md:p-5 mb-2.5 sm:mb-3.5' : 'p-4 sm:p-6 md:p-7 mb-3 sm:mb-5'
      }`}>
        {question.imageUrl && (() => {
          const resolvedHeight = question.imageHeight || (
            question.imageSize === 'sm' ? 120 :
            question.imageSize === 'lg' ? 220 :
            question.imageSize === 'xl' ? 280 : 160
          );
          return (
            <div
              style={{ maxHeight: `${resolvedHeight + 15}px` }}
              className="mb-2.5 flex items-center justify-center overflow-hidden rounded-2xl bg-slate-50 border border-slate-200 p-1 max-w-xl mx-auto"
            >
              <img
                src={question.imageUrl}
                alt="Minh họa câu hỏi"
                style={{ maxHeight: `${resolvedHeight}px` }}
                className="max-w-full object-contain rounded-xl transition-all"
              />
            </div>
          );
        })()}

        <h3 className={`font-black text-slate-900 leading-snug tracking-tight ${
          hasAnyImage ? 'text-lg sm:text-xl md:text-2xl lg:text-3xl' : 'text-xl sm:text-2xl md:text-3xl lg:text-4xl'
        }`}>
          {question.title}
        </h3>

        {/* Indicator & Status banner for single or multiple correct answers (clean text indicator during active play) */}
        {isMultiple ? (
          selectedOptIds.length > 0 ? (
            <div className="mt-2.5 p-2 sm:p-2.5 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-emerald-800 flex items-center justify-center gap-2 font-black text-xs sm:text-sm animate-pulse-subtle">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
              <span>Đã chọn {selectedOptIds.length} đáp án · Bé có thể chạm đổi đáp án trước khi cô thu bài ⭐</span>
            </div>
          ) : (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-xs sm:text-sm font-black">
              <span>✨ Câu hỏi nhiều đáp án đúng: Bé chạm chọn tất cả các tranh đúng nhé!</span>
            </div>
          )
        ) : selectedOptId ? (
          <div className="mt-2.5 p-2 sm:p-2.5 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-emerald-800 flex items-center justify-center gap-2 font-black text-xs sm:text-sm animate-pulse-subtle">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
            <span>Bé đã chọn đáp án! (Bé có thể chạm đổi sang đáp án khác trước khi cô thu bài ⭐)</span>
          </div>
        ) : (
          <div className="mt-1.5 text-xs sm:text-sm font-bold text-slate-500">
            👉 Chạm vào 1 đáp án to bên dưới để chọn nhé! (Bé có thể đổi lại bất cứ lúc nào)
          </div>
        )}
      </div>

      {/* Touch Answer Buttons - Colors are preserved at all times without color switching */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${
        hasAnyImage ? 'gap-2.5 sm:gap-3.5 md:gap-4 mb-2.5 sm:mb-3.5' : 'gap-3.5 sm:gap-5 md:gap-6 mb-4 sm:mb-6'
      } flex-1`}>
        {question.options.map((opt, idx) => {
          const color = buttonColors[idx % buttonColors.length];
          const isSelected = isMultiple ? selectedOptIds.includes(opt.id) : selectedOptId === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                if (isMultiple) {
                  handleToggleMultipleOption(opt.id);
                } else {
                  handleSelectSingleOption(opt.id);
                }
              }}
              className={`${
                hasAnyImage
                  ? 'min-h-[85px] sm:min-h-[105px] md:min-h-[120px] p-2.5 sm:p-3 md:p-4 rounded-2xl sm:rounded-3xl text-base sm:text-lg md:text-xl lg:text-2xl'
                  : 'min-h-[90px] sm:min-h-[130px] md:min-h-[155px] lg:min-h-[175px] p-4 sm:p-6 md:p-8 rounded-3xl text-xl sm:text-2xl md:text-3xl lg:text-4xl'
              } font-black transition-all transform flex flex-col items-center justify-center text-center shadow-lg active:scale-95 touch-manipulation relative ${color.bg} ${color.text} ${
                isSelected
                  ? 'ring-4 ring-offset-2 ring-white scale-[1.02] shadow-2xl z-10'
                  : 'hover:scale-[1.01]'
              } cursor-pointer`}
            >
              {/* Checkmark or checkbox indicator for selected option while keeping original color */}
              {isMultiple ? (
                <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 text-white">
                  {isSelected ? (
                    <div className="px-2.5 py-1 rounded-xl bg-white text-emerald-700 border-2 border-emerald-400 flex items-center gap-1 font-black text-xs shadow-md">
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                      <span>ĐÃ CHỌN</span>
                    </div>
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-black/10 border-2 border-white/50 flex items-center justify-center">
                      <Square className="w-4 h-4 sm:w-5 sm:h-5 text-white/70" />
                    </div>
                  )}
                </div>
              ) : isSelected ? (
                <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 px-3 py-1 rounded-full bg-white text-emerald-700 border-2 border-emerald-400 flex items-center gap-1 font-black text-xs shadow-md">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>ĐÃ CHỌN</span>
                </div>
              ) : null}

              {opt.imageUrl && (
                <img
                  src={opt.imageUrl}
                  alt={opt.text || ''}
                  style={opt.imageFit === 'custom' ? { height: `${opt.imageHeight || 110}px` } : undefined}
                  className={`object-contain rounded-xl mb-1 sm:mb-1.5 pointer-events-none transition-all ${
                    opt.imageFit === 'full'
                      ? 'w-full max-h-24 sm:max-h-32 md:max-h-40 bg-white/95 p-1 shadow-xs'
                      : opt.imageFit === 'custom'
                      ? 'w-full bg-white/95 p-1 shadow-xs'
                      : opt.imageFit === 'large'
                      ? 'max-h-20 sm:max-h-28 md:max-h-32 max-w-[90%] bg-white/90 p-1'
                      : opt.imageFit === 'small'
                      ? 'max-h-10 sm:max-h-14 max-w-[70%]'
                      : 'max-h-16 sm:max-h-20 md:max-h-24 max-w-[85%] bg-white/95 p-1 rounded-xl shadow-2xs'
                  }`}
                />
              )}
              {opt.text && opt.text.trim() ? (
                <span className="line-clamp-2 px-1">{opt.text}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="text-center py-1 text-[11px] font-bold text-slate-400 shrink-0 pb-1">
        Vui Học Cùng Cô · Đồng bộ thời gian thực
      </div>
    </div>
  );
};
