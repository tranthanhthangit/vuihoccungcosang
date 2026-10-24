import React, { useEffect } from 'react';
import { Sparkles, CheckCircle2, XCircle, Clock, Heart } from 'lucide-react';
import { Question, TeamAnswer } from '../../types/game';
import { sounds } from '../../utils/sound';

interface PlayerResultProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  answer?: TeamAnswer;
}

export const PlayerResult: React.FC<PlayerResultProps> = ({
  question,
  questionIndex,
  totalQuestions,
  answer,
}) => {
  const isOpenEnded = question.type === 'open_ended';
  const teacherGrade = answer?.openEnded?.teacherGrade;
  const isPendingOpenEnded = isOpenEnded && (!teacherGrade || teacherGrade === 'pending');
  const isCorrect = isPendingOpenEnded ? false : (isOpenEnded ? teacherGrade === 'correct' : Boolean(answer?.isCorrect));
  const pointsAwarded = answer?.pointsAwarded ?? 0;
  const isPartial = !isCorrect && pointsAwarded > 0;
  const isDragDrop = question.type === 'drag_drop';
  const correctOptions = question.options?.filter(o => o.isCorrect) || [];
  const correctOptText = isDragDrop
    ? 'Xếp đúng tất cả thẻ vào ô'
    : correctOptions.map(o => o.text).join(' & ') || 'Xem màn hình của cô';

  useEffect(() => {
    if (isPendingOpenEnded) {
      sounds.playCorrect();
    } else if (isCorrect || isPartial) {
      sounds.playCorrect();
    } else {
      sounds.playWrong();
    }
  }, [isCorrect, isPendingOpenEnded, isPartial]);

  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const chosenAnswerIds = answer?.answerIds || (answer?.answerId ? answer.answerId.split(',') : []);
  let chosenOpts = question.options?.filter(o =>
    chosenAnswerIds.includes(o.id) ||
    (answer?.answerText && (o.text === answer.answerText || o.id === answer.answerText))
  ) || [];
  if (chosenOpts.length === 0 && question.options && question.options.length > 0) {
    const candidateStr = (answer?.answerId || answer?.answerText || '').trim().toUpperCase();
    const letterIndex = letters.indexOf(candidateStr);
    if (letterIndex >= 0 && question.options[letterIndex]) {
      chosenOpts = [question.options[letterIndex]];
    }
  }

  return (
    <div className="max-w-xl sm:max-w-2xl mx-auto w-full px-4 py-4 sm:py-6 flex flex-col items-center text-center">
      <div className="w-full">
        <span className="text-xs font-black uppercase text-slate-400">
          KẾT QUẢ CÂU {questionIndex + 1} / {totalQuestions}
        </span>

        {/* Big Verdict Card */}
        <div className={`mt-3 sm:mt-4 p-5 sm:p-7 md:p-8 rounded-3xl border-4 shadow-xl sm:shadow-2xl ${
          isPendingOpenEnded
            ? 'bg-gradient-to-b from-purple-50 via-indigo-50 to-pink-50 border-purple-300'
            : isCorrect
            ? 'bg-gradient-to-b from-emerald-50 to-teal-50 border-emerald-300'
            : isPartial
            ? 'bg-gradient-to-b from-amber-50 to-emerald-50 border-amber-300'
            : 'bg-gradient-to-b from-rose-50 to-pink-50 border-rose-300'
        }`}>
          <div className="text-5xl sm:text-6xl mb-2 sm:mb-3 animate-bounce">
            {isPendingOpenEnded ? '🎨' : isCorrect ? '🌟' : isPartial ? '👏' : '❤️'}
          </div>

          <h2 className={`text-xl sm:text-2xl md:text-3xl font-black mb-1.5 sm:mb-2 ${
            isPendingOpenEnded
              ? 'text-purple-900'
              : isCorrect
              ? 'text-emerald-800'
              : isPartial
              ? 'text-amber-800'
              : 'text-rose-800'
          }`}>
            {isPendingOpenEnded
              ? 'BÉ ĐÃ HOÀN THÀNH BÀI TỰ LUẬN!'
              : isCorrect
              ? 'HOAN HÔ! ĐÚNG RỒI!'
              : isPartial
              ? 'HOAN HÔ! ĐÚNG MỘT PHẦN!'
              : 'BÉ CỐ GẮNG LẦN SAU NHÉ!'}
          </h2>

          <p className="text-xs sm:text-sm font-bold text-slate-600 mb-4 sm:mb-6">
            {isPendingOpenEnded
              ? 'Cô đang xem bài và sẽ chấm điểm, sửa bài cho bé nhé ⭐'
              : isCorrect
              ? `Đội của bé đã nhận được +${pointsAwarded} điểm thưởng xuất sắc!`
              : isPartial
              ? `Đội của bé trả lời đúng một phần và nhận được +${pointsAwarded} điểm thưởng!`
              : 'Đừng buồn nhé, các bạn đã làm rất tốt!'}
          </p>

          {/* Details */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3.5 sm:p-4 border border-slate-200 text-left text-xs font-extrabold flex flex-col gap-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-slate-600 font-extrabold shrink-0">
                {chosenOpts.some(o => o.imageUrl) ? 'Hình đáp án bé đã chọn:' : 'Lựa chọn của đội:'}
              </span>
              {chosenOpts.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {chosenOpts.map((opt) => {
                    const optIdx = question.options?.findIndex(o => o.id === opt.id) ?? -1;
                    const letter = optIdx >= 0 ? letters[optIdx] : '•';
                    const isOptCorrect = Boolean(opt.isCorrect);

                    return (
                      <span
                        key={opt.id}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-black border-2 shadow-xs ${
                          isOptCorrect
                            ? 'bg-emerald-50 text-emerald-950 border-emerald-400'
                            : 'bg-rose-50 text-rose-950 border-rose-300'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0 shadow-2xs ${
                          isOptCorrect ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}>
                          {letter}
                        </span>
                        {opt.imageUrl && (
                          <img
                            src={opt.imageUrl}
                            alt={opt.text || 'Hình đáp án'}
                            className="h-16 sm:h-20 md:h-22 w-auto max-w-[130px] sm:max-w-[150px] object-contain rounded-xl bg-white border border-slate-200 p-1 shrink-0 shadow-2xs"
                          />
                        )}
                        {opt.text && opt.text.trim() ? (
                          <span className="max-w-[140px] truncate font-extrabold">{opt.text}</span>
                        ) : null}
                        <span className={`font-black text-xs ${isOptCorrect ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {isOptCorrect ? '✓ Đúng' : '✗ Chưa đúng'}
                        </span>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <span className={`px-2.5 py-1 rounded-lg ${
                  isPendingOpenEnded
                    ? 'bg-purple-100 text-purple-900'
                    : isCorrect
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {answer ? answer.answerText : 'Không trả lời'}
                </span>
              )}
            </div>

            {/* If open-ended drawing or text */}
            {(answer?.openEnded?.annotatedDrawingDataUrl || answer?.openEnded?.drawingDataUrl) && (
              <div className="border-t border-slate-100 pt-2">
                <span className="text-slate-500 block mb-1">
                  {answer?.openEnded?.annotatedDrawingDataUrl ? '🎨 Bài làm đã được cô sửa & chấm:' : 'Hình vẽ của bé:'}
                </span>
                <img
                  src={answer.openEnded.annotatedDrawingDataUrl || answer.openEnded.drawingDataUrl}
                  alt="Bài vẽ của bé"
                  className="max-h-44 rounded-xl border border-purple-200 bg-white mx-auto shadow-2xs"
                />
              </div>
            )}

            {answer?.openEnded?.teacherFeedback?.trim() && answer?.openEnded?.teacherGrade && answer.openEnded.teacherGrade !== 'pending' && (
              <div className="border-t border-slate-100 pt-2 bg-amber-50/80 -mx-2 -mb-2 p-2.5 rounded-xl border border-amber-200">
                <span className="text-amber-800 font-black block">💌 Lời cô sửa bài & nhận xét:</span>
                <p className="text-slate-700 font-bold mt-0.5 text-xs">
                  "{answer.openEnded.teacherFeedback}"
                </p>
              </div>
            )}

            {!isOpenEnded && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                <span className="text-slate-600 font-extrabold shrink-0">
                  {correctOptions.some(o => o.imageUrl) ? 'Hình đáp án đúng của cô:' : 'Đáp án chính xác:'}
                </span>
                {correctOptions.length > 0 && correctOptions.some(o => o.imageUrl) ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {correctOptions.map((opt) => {
                      const optIdx = question.options?.findIndex(o => o.id === opt.id) ?? -1;
                      const letter = optIdx >= 0 ? letters[optIdx] : '•';
                      return (
                        <span
                          key={opt.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-black bg-emerald-50 text-emerald-950 border-2 border-emerald-400 shadow-xs"
                        >
                          <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white bg-emerald-600 shrink-0 shadow-2xs">
                            {letter}
                          </span>
                          {opt.imageUrl && (
                            <img
                              src={opt.imageUrl}
                              alt={opt.text || 'Đáp án đúng'}
                              className="h-16 sm:h-20 md:h-22 w-auto max-w-[130px] sm:max-w-[150px] object-contain rounded-xl bg-white border border-emerald-300 p-1 shrink-0 shadow-2xs"
                            />
                          )}
                          {opt.text && opt.text.trim() ? (
                            <span className="max-w-[140px] truncate font-extrabold">{opt.text}</span>
                          ) : null}
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-black">
                    {correctOptText}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Waiting footer directly below verdict card without empty space */}
        <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 border-2 border-slate-200/80 shadow-sm mt-3 sm:mt-4 max-w-md mx-auto">
          <div className="flex items-center justify-center gap-2 text-slate-600 font-black text-xs sm:text-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping shrink-0"></div>
            <span>Bé nhìn lên màn hình của cô nhé!</span>
          </div>
        </div>
      </div>
    </div>
  );
};
