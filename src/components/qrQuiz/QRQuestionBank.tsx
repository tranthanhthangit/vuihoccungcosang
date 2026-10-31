import React, { useState, useMemo, useRef } from 'react';
import { QRQuestionPack, QRQuestion } from '../../types/qrQuiz';
import {
  getQRQuestionPacks,
  saveQRQuestionPack,
  deleteQRQuestionPack,
} from '../../services/qrStorage';
import { DEFAULT_GAMES } from '../../data/defaultGames';

interface QRQuestionBankProps {
  onSelectPackToPlay?: (pack: QRQuestionPack) => void;
}

export const QRQuestionBank: React.FC<QRQuestionBankProps> = ({ onSelectPackToPlay }) => {
  const [packs, setPacks] = useState<QRQuestionPack[]>(() => getQRQuestionPacks());
  const [activePackId, setActivePackId] = useState<string>(() => packs[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');

  // Pack edit modal
  const [isPackModalOpen, setIsPackModalOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<QRQuestionPack | null>(null);
  const [packFormData, setPackFormData] = useState({
    title: '',
    description: '',
    topic: 'Toán học',
    ageGroup: 'Lớp Lá (5-6 tuổi)',
    coverImage: '',
  });

  // Question edit modal
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QRQuestion | null>(null);
  const [questionFormData, setQuestionFormData] = useState<{
    prompt: string;
    imageUrl: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    explanation: string;
    points: number;
    timeLimitSeconds?: number;
    difficulty: 'easy' | 'medium' | 'hard';
  }>({
    prompt: '',
    imageUrl: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    explanation: '',
    points: 10,
    timeLimitSeconds: 20,
    difficulty: 'easy',
  });

  // Import modal from existing default games
  const [isImportGameModalOpen, setIsImportGameModalOpen] = useState(false);

  const questionImageInputRef = useRef<HTMLInputElement>(null);
  const packImageInputRef = useRef<HTMLInputElement>(null);

  const refreshPacks = () => {
    const list = getQRQuestionPacks();
    setPacks(list);
    if (!list.some((p) => p.id === activePackId) && list.length > 0) {
      setActivePackId(list[0].id);
    }
  };

  const activePack = useMemo(() => {
    return packs.find((p) => p.id === activePackId) || packs[0];
  }, [packs, activePackId]);

  // Topic filter
  const topics = useMemo(() => {
    const set = new Set<string>();
    packs.forEach((p) => {
      if (p.topic) set.add(p.topic);
    });
    return Array.from(set);
  }, [packs]);

  const filteredPacks = useMemo(() => {
    return packs.filter((p) => {
      const matchTopic = selectedTopic === 'all' || p.topic === selectedTopic;
      const matchSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTopic && matchSearch;
    });
  }, [packs, selectedTopic, searchQuery]);

  // Handle TTS speech
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Pack CRUD
  const handleOpenNewPack = () => {
    setEditingPack(null);
    setPackFormData({
      title: '',
      description: '',
      topic: 'Chữ cái',
      ageGroup: 'Lớp Lá (5-6 tuổi)',
      coverImage: '',
    });
    setIsPackModalOpen(true);
  };

  const handleOpenEditPack = (pack: QRQuestionPack) => {
    setEditingPack(pack);
    setPackFormData({
      title: pack.title,
      description: pack.description || '',
      topic: pack.topic,
      ageGroup: pack.ageGroup || 'Lớp Lá (5-6 tuổi)',
      coverImage: pack.coverImage || '',
    });
    setIsPackModalOpen(true);
  };

  const handleSavePack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!packFormData.title.trim()) return;

    const saved = saveQRQuestionPack({
      id: editingPack?.id,
      title: packFormData.title.trim(),
      description: packFormData.description.trim(),
      topic: packFormData.topic,
      ageGroup: packFormData.ageGroup,
      coverImage: packFormData.coverImage,
      questions: editingPack?.questions || [],
    });

    setIsPackModalOpen(false);
    refreshPacks();
    setActivePackId(saved.id);
  };

  const handleDeletePack = (packId: string) => {
    if (!window.confirm('Cô có chắc chắn muốn xóa bộ đề này không?')) return;
    deleteQRQuestionPack(packId);
    refreshPacks();
  };

  const handleDuplicatePack = (pack: QRQuestionPack) => {
    const duplicatedQuestions = pack.questions.map((q) => ({
      ...q,
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    }));
    const newPack = saveQRQuestionPack({
      title: `${pack.title} (Bản sao)`,
      description: pack.description,
      topic: pack.topic,
      ageGroup: pack.ageGroup,
      coverImage: pack.coverImage,
      questions: duplicatedQuestions,
    });
    refreshPacks();
    setActivePackId(newPack.id);
  };

  // Question CRUD
  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionFormData({
      prompt: '',
      imageUrl: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      explanation: '',
      points: 10,
      timeLimitSeconds: 20,
      difficulty: 'easy',
    });
    setIsQuestionModalOpen(true);
  };

  const handleOpenEditQuestion = (q: QRQuestion) => {
    setEditingQuestion(q);
    setQuestionFormData({
      prompt: q.prompt || q.title || '',
      imageUrl: q.imageUrl || '',
      optionA: q.options?.A?.text || q.optionA || '',
      optionB: q.options?.B?.text || q.optionB || '',
      optionC: q.options?.C?.text || q.optionC || '',
      optionD: q.options?.D?.text || q.optionD || '',
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      points: q.points || 10,
      timeLimitSeconds: q.timeLimitSeconds || 20,
      difficulty: q.difficulty || 'easy',
    });
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePack) return;
    if (!questionFormData.prompt.trim()) return;

    const newQuestion: QRQuestion = {
      id: editingQuestion?.id || `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: questionFormData.prompt.trim(),
      prompt: questionFormData.prompt.trim(),
      imageUrl: questionFormData.imageUrl,
      optionA: questionFormData.optionA.trim(),
      optionB: questionFormData.optionB.trim(),
      optionC: questionFormData.optionC.trim(),
      optionD: questionFormData.optionD.trim(),
      options: {
        A: { text: questionFormData.optionA.trim() },
        B: { text: questionFormData.optionB.trim() },
        C: { text: questionFormData.optionC.trim() },
        D: { text: questionFormData.optionD.trim() },
      },
      correctAnswer: questionFormData.correctAnswer,
      explanation: questionFormData.explanation.trim(),
      points: questionFormData.points,
      timeLimitSeconds: questionFormData.timeLimitSeconds,
      difficulty: questionFormData.difficulty,
    };

    let updatedQuestions: QRQuestion[];
    if (editingQuestion) {
      updatedQuestions = activePack.questions.map((q) =>
        q.id === editingQuestion.id ? newQuestion : q
      );
    } else {
      updatedQuestions = [...activePack.questions, newQuestion];
    }

    saveQRQuestionPack({
      ...activePack,
      questions: updatedQuestions,
    });

    setIsQuestionModalOpen(false);
    refreshPacks();
  };

  const handleDeleteQuestion = (qId: string) => {
    if (!activePack) return;
    if (!window.confirm('Cô có chắc muốn xóa câu hỏi này không?')) return;
    const updatedQuestions = activePack.questions.filter((q) => q.id !== qId);
    saveQRQuestionPack({
      ...activePack,
      questions: updatedQuestions,
    });
    refreshPacks();
  };

  // Import from default games
  const handleImportGameAsPack = (game: typeof DEFAULT_GAMES[0]) => {
    const qrQuestions: QRQuestion[] = [];
    if (game.questions && Array.isArray(game.questions)) {
      game.questions.forEach((q: any) => {
        if (q.options && q.options.length >= 2) {
          const optTexts = q.options.map((o: any) => o.text);
          const correctIdx = q.options.findIndex((o: any) => o.isCorrect);
          const letters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
          const correctLetter = letters[correctIdx >= 0 ? correctIdx : 0];
          const qTitle = q.prompt || q.title || q.text || 'Câu hỏi trắc nghiệm';

          qrQuestions.push({
            id: `q_imp_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            title: qTitle,
            prompt: qTitle,
            imageUrl: q.imageUrl || game.coverImage,
            optionA: optTexts[0] || 'Đáp án A',
            optionB: optTexts[1] || 'Đáp án B',
            optionC: optTexts[2] || 'Đáp án C',
            optionD: optTexts[3] || 'Đáp án D',
            options: {
              A: { text: optTexts[0] || 'Đáp án A' },
              B: { text: optTexts[1] || 'Đáp án B' },
              C: { text: optTexts[2] || 'Đáp án C' },
              D: { text: optTexts[3] || 'Đáp án D' },
            },
            correctAnswer: correctLetter,
            explanation: q.explanation || '',
            points: q.points || 10,
            timeLimitSeconds: 20,
            difficulty: 'easy',
          });
        }
      });
    }

    const newPack = saveQRQuestionPack({
      title: `[QR] ${game.title}`,
      description: game.description || 'Chuyển đổi từ trò chơi trắc nghiệm',
      topic: 'Tổng hợp',
      ageGroup: 'Mầm non',
      coverImage: game.coverImage,
      questions: qrQuestions,
    });

    setIsImportGameModalOpen(false);
    refreshPacks();
    setActivePackId(newPack.id);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>Ngân hàng câu hỏi trắc nghiệm QR</span>
            <span className="text-xs px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full font-medium">
              {packs.length} bộ đề
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Bộ câu hỏi 4 lựa chọn (A - B - C - D) kèm hình ảnh minh họa to rõ dành cho bảng xoay 4 hướng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenNewPack}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm transition active:scale-95"
          >
            <span>+</span>
            <span>Tạo bộ đề mới</span>
          </button>
          <button
            type="button"
            onClick={() => setIsImportGameModalOpen(true)}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium text-sm transition"
          >
            Nhập từ kho trò chơi
          </button>
        </div>
      </div>

      {/* Main layout: Left sidebar pack list + Right question cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left packs column */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bộ đề..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none"
            />
            {topics.length > 0 && (
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white"
              >
                <option value="all">Tất cả chủ đề</option>
                {topics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredPacks.map((pack) => {
              const isActive = pack.id === activePack?.id;
              return (
                <div
                  key={pack.id}
                  onClick={() => setActivePackId(pack.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-indigo-50/70 border-indigo-400 ring-1 ring-indigo-300'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {pack.coverImage ? (
                        <img
                          src={pack.coverImage}
                          alt={pack.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">📚</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4
                        className={`text-xs font-bold truncate ${
                          isActive ? 'text-indigo-900' : 'text-slate-800'
                        }`}
                      >
                        {pack.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {pack.topic} • {pack.questions.length} câu
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicatePack(pack);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded"
                      title="Nhân bản"
                    >
                      📋
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditPack(pack);
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                      title="Chỉnh sửa"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePack(pack.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Xóa"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right questions list of active pack */}
        <div className="lg:col-span-8 space-y-4">
          {activePack ? (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-5">
              {/* Active pack header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-800">
                      {activePack.title}
                    </h3>
                    <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md font-medium">
                      {activePack.topic}
                    </span>
                  </div>
                  {activePack.description && (
                    <p className="text-xs text-slate-500 mt-1">
                      {activePack.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenAddQuestion}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-sm transition"
                  >
                    <span>+</span>
                    <span>Thêm câu hỏi</span>
                  </button>

                  {onSelectPackToPlay && (
                    <button
                      type="button"
                      onClick={() => onSelectPackToPlay(activePack)}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                    >
                      <span>🚀</span>
                      <span>Tổ chức chơi</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Questions list */}
              {activePack.questions.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl">
                  <span className="text-3xl block mb-2">❓</span>
                  <p className="text-sm font-semibold text-slate-700">
                    Bộ đề này chưa có câu hỏi nào
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Cô hãy nhấn &quot;Thêm câu hỏi&quot; để tạo câu hỏi trắc nghiệm A-B-C-D cho bé.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddQuestion}
                    className="mt-3 px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-medium"
                  >
                    + Thêm câu hỏi đầu tiên
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activePack.questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition bg-slate-50/40 space-y-3"
                    >
                      {/* Top question title & actions */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-800 leading-snug">
                              {q.prompt || q.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                              <span>Điểm: {q.points || 10}đ</span>
                              <span>•</span>
                              <span>
                                {q.timeLimitSeconds
                                  ? `Thời gian: ${q.timeLimitSeconds}s`
                                  : 'Không giới hạn thời gian'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => speakText(q.prompt || q.title)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white"
                            title="Nghe đọc câu hỏi"
                          >
                            🔊
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditQuestion(q)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white"
                            title="Chỉnh sửa câu hỏi"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white"
                            title="Xóa câu hỏi"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* Question Image if present */}
                      {q.imageUrl && (
                        <div className="w-32 h-24 rounded-xl overflow-hidden border border-slate-200 bg-white">
                          <img
                            src={q.imageUrl}
                            alt="Minh họa"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* 4 Choices grid */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                          const optText = q.options?.[letter]?.text || (q as any)[`option${letter}`] || '—';
                          const isCorrect = q.correctAnswer === letter;
                          return (
                            <div
                              key={letter}
                              className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-900'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {letter}
                              </span>
                              <span className="truncate">{optText}</span>
                              {isCorrect && (
                                <span className="ml-auto text-[10px] text-emerald-700 font-semibold uppercase">
                                  ✓ Đúng
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation note */}
                      {q.explanation && (
                        <p className="text-[11px] text-slate-500 bg-white p-2 rounded-xl border border-slate-100 italic">
                          💡 <strong>Lời cô:</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200">
              <p className="text-sm text-slate-500">
                Hãy chọn hoặc tạo một bộ đề để bắt đầu quản lý câu hỏi.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pack Modal */}
      {isPackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">
                {editingPack ? 'Sửa thông tin bộ đề' : 'Tạo bộ đề mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPackModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePack} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên bộ đề <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={packFormData.title}
                  onChange={(e) =>
                    setPackFormData((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="Ví dụ: Bé học chữ cái O - Ô - Ơ"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chủ đề
                  </label>
                  <input
                    type="text"
                    value={packFormData.topic}
                    onChange={(e) =>
                      setPackFormData((p) => ({ ...p, topic: e.target.value }))
                    }
                    placeholder="Chữ cái, Toán học..."
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Độ tuổi
                  </label>
                  <input
                    type="text"
                    value={packFormData.ageGroup}
                    onChange={(e) =>
                      setPackFormData((p) => ({ ...p, ageGroup: e.target.value }))
                    }
                    placeholder="Lớp Lá (5-6 tuổi)"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả ngắn
                </label>
                <textarea
                  rows={2}
                  value={packFormData.description}
                  onChange={(e) =>
                    setPackFormData((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Mô tả mục tiêu của bộ câu hỏi..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                />
              </div>

              {/* Cover image */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ảnh bìa bộ đề (tùy chọn)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={packImageInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        setPackFormData((p) => ({
                          ...p,
                          coverImage: reader.result as string,
                        }));
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => packImageInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg"
                  >
                    Chọn ảnh bìa
                  </button>
                  {packFormData.coverImage && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200">
                      <img
                        src={packFormData.coverImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPackModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm"
                >
                  {editingPack ? 'Lưu thay đổi' : 'Tạo bộ đề'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">
                {editingQuestion ? 'Sửa câu hỏi trắc nghiệm' : 'Thêm câu hỏi mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsQuestionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nội dung câu hỏi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    rows={2}
                    required
                    value={questionFormData.prompt}
                    onChange={(e) =>
                      setQuestionFormData((p) => ({ ...p, prompt: e.target.value }))
                    }
                    placeholder="Ví dụ: Đâu là quả táo màu đỏ?"
                    className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => speakText(questionFormData.prompt)}
                    className="absolute bottom-2 right-2 p-1 text-slate-400 hover:text-indigo-600 text-xs font-medium"
                    title="Thử giọng đọc"
                  >
                    🔊 Đọc thử
                  </button>
                </div>
              </div>

              {/* Image upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hình ảnh minh họa to rõ cho câu hỏi
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={questionImageInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        setQuestionFormData((p) => ({
                          ...p,
                          imageUrl: reader.result as string,
                        }));
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => questionImageInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg"
                  >
                    Tải ảnh minh họa
                  </button>
                  {questionFormData.imageUrl && (
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={questionFormData.imageUrl}
                          alt="Minh họa"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setQuestionFormData((p) => ({ ...p, imageUrl: '' }))
                        }
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 4 Choices A, B, C, D */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  4 phương án tương ứng 4 góc xoay:
                </label>

                {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                  const key = `option${letter}` as
                    | 'optionA'
                    | 'optionB'
                    | 'optionC'
                    | 'optionD';
                  const isCorrect = questionFormData.correctAnswer === letter;
                  return (
                    <div
                      key={letter}
                      className={`flex items-center gap-2 p-2 rounded-xl border ${
                        isCorrect
                          ? 'border-emerald-400 bg-emerald-50/60'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="correctAnswerRadio"
                          checked={isCorrect}
                          onChange={() =>
                            setQuestionFormData((p) => ({
                              ...p,
                              correctAnswer: letter,
                            }))
                          }
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                            isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {letter}
                        </span>
                      </label>
                      <input
                        type="text"
                        required
                        value={questionFormData[key]}
                        onChange={(e) =>
                          setQuestionFormData((p) => ({
                            ...p,
                            [key]: e.target.value,
                          }))
                        }
                        placeholder={`Nội dung đáp án ${letter}...`}
                        className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                      {isCorrect && (
                        <span className="text-[10px] text-emerald-700 font-bold px-1.5">
                          Đáp án đúng
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Additional settings */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Điểm số
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={questionFormData.points}
                    onChange={(e) =>
                      setQuestionFormData((p) => ({
                        ...p,
                        points: parseInt(e.target.value) || 10,
                      }))
                    }
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Thời gian suy nghĩ (giây)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={questionFormData.timeLimitSeconds || 0}
                    onChange={(e) =>
                      setQuestionFormData((p) => ({
                        ...p,
                        timeLimitSeconds: parseInt(e.target.value) || undefined,
                      }))
                    }
                    placeholder="0 = Không giới hạn"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lời dặn / Giải thích khi mở kết quả
                </label>
                <input
                  type="text"
                  value={questionFormData.explanation}
                  onChange={(e) =>
                    setQuestionFormData((p) => ({
                      ...p,
                      explanation: e.target.value,
                    }))
                  }
                  placeholder="Ví dụ: Đúng rồi, quả táo có màu đỏ và vị ngọt mát!"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium shadow-sm"
                >
                  {editingQuestion ? 'Cập nhật câu hỏi' : 'Lưu câu hỏi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import from default games modal */}
      {isImportGameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">
                Nhập câu hỏi từ kho trò chơi có sẵn
              </h3>
              <button
                type="button"
                onClick={() => setIsImportGameModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-base"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Chọn trò chơi trong hệ thống để tự động chuyển đổi thành bộ đề trắc nghiệm QR xoay 4 hướng:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {DEFAULT_GAMES.map((game) => (
                <div
                  key={game.id}
                  onClick={() => handleImportGameAsPack(game)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer flex items-center justify-between gap-3 transition"
                >
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs text-slate-800 truncate">
                      {game.title}
                    </h5>
                    <p className="text-[11px] text-slate-400 truncate">
                      {game.questions?.length || 0} câu hỏi • {game.category || 'Mầm non'}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 flex-shrink-0">
                    Nhập &gt;
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsImportGameModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
