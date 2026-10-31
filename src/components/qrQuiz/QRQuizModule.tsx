import React, { useState, useMemo } from 'react';
import { QRStudent, QRQuestionPack } from '../../types/qrQuiz';
import { getQRStudents, getQRQuestionPacks } from '../../services/qrStorage';
import { QRStudentManager } from './QRStudentManager';
import { QRCardPrintView } from './QRCardPrintView';
import { QRQuestionBank } from './QRQuestionBank';
import { QRSessionHistory } from './QRSessionHistory';

interface QRQuizModuleProps {
  onStartHostSession: (config: {
    roomCode: string;
    pack: QRQuestionPack;
    students: QRStudent[];
  }) => void;
  onOpenMobileScanner: (roomCode: string) => void;
  onBackToHome: () => void;
}

export type QRTab = 'students' | 'print' | 'bank' | 'host' | 'history';

export const QRQuizModule: React.FC<QRQuizModuleProps> = ({
  onStartHostSession,
  onOpenMobileScanner,
  onBackToHome,
}) => {
  const [activeTab, setActiveTab] = useState<QRTab>('host');

  // Print preselection state
  const [preselectedStudentIdsForPrint, setPreselectedStudentIdsForPrint] = useState<string[]>([]);

  // Host configuration wizard states
  const [allStudents, setAllStudents] = useState<QRStudent[]>(() => getQRStudents());
  const [packs, setPacks] = useState<QRQuestionPack[]>(() => getQRQuestionPacks());

  const [selectedClassForGame, setSelectedClassForGame] = useState<string>('all');
  const [selectedPackIdForGame, setSelectedPackIdForGame] = useState<string>(() => packs[0]?.id || '');
  const [gameTitle, setGameTitle] = useState<string>('Trắc nghiệm mầm non');
  const [customRoomCode, setCustomRoomCode] = useState<string>('');

  const refreshData = () => {
    setAllStudents(getQRStudents());
    setPacks(getQRQuestionPacks());
  };

  // Unique classes
  const classList = useMemo(() => {
    const set = new Set<string>();
    allStudents.forEach((s) => {
      if (s.className) set.add(s.className);
    });
    return Array.from(set).sort();
  }, [allStudents]);

  // Selected students for the game
  const participatingStudents = useMemo(() => {
    if (selectedClassForGame === 'all') return allStudents;
    return allStudents.filter((s) => s.className === selectedClassForGame);
  }, [allStudents, selectedClassForGame]);

  const selectedPack = useMemo(() => {
    return packs.find((p) => p.id === selectedPackIdForGame) || packs[0];
  }, [packs, selectedPackIdForGame]);

  // Start game handler
  const handleStartGame = () => {
    if (!selectedPack || selectedPack.questions.length === 0) {
      alert('Vui lòng chọn bộ đề có ít nhất 1 câu hỏi.');
      return;
    }
    if (participatingStudents.length === 0) {
      alert('Vui lòng chọn lớp học có ít nhất 1 học sinh.');
      return;
    }

    // Generate clean 5-char code
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    const finalRoomCode = customRoomCode.trim().toUpperCase() || code;

    onStartHostSession({
      roomCode: finalRoomCode,
      pack: selectedPack,
      students: participatingStudents,
    });
  };

  // Nav helpers
  const handlePrintStudents = (studentIds: string[]) => {
    setPreselectedStudentIdsForPrint(studentIds);
    setActiveTab('print');
  };

  const handleSelectPackToPlay = (pack: QRQuestionPack) => {
    setSelectedPackIdForGame(pack.id);
    setActiveTab('host');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16 font-sans">
      {/* Top Banner Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBackToHome}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition text-sm font-medium"
              >
                ← Trang chủ
              </button>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>📱 BẢNG ĐÁP ÁN QR</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Xoay 4 hướng
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Trắc nghiệm thông minh cho lớp mầm non • Camera điện thoại quét đáp án
                </p>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const input = prompt('Nhập mã phòng 5 ký tự để quét (ví dụ: AB12C):');
                  if (input && input.trim()) {
                    onOpenMobileScanner(input.trim().toUpperCase());
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>📷</span>
                <span>Vào quét camera</span>
              </button>
            </div>
          </div>

          {/* 5 Tabs Ribbon */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 text-xs sm:text-sm font-bold border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                refreshData();
                setActiveTab('host');
              }}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'host'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>🚀</span>
              <span>1. Tổ chức trò chơi</span>
            </button>

            <button
              type="button"
              onClick={() => {
                refreshData();
                setActiveTab('students');
              }}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'students'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>👶</span>
              <span>2. Quản lý học sinh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                refreshData();
                setActiveTab('print');
              }}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'print'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>🖨️</span>
              <span>3. In bảng đáp án QR</span>
            </button>

            <button
              type="button"
              onClick={() => {
                refreshData();
                setActiveTab('bank');
              }}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'bank'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>📚</span>
              <span>4. Ngân hàng câu hỏi</span>
            </button>

            <button
              type="button"
              onClick={() => {
                refreshData();
                setActiveTab('history');
              }}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>📜</span>
              <span>5. Kết quả & Lịch sử</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* TAB 1: HOST SESSION WIZARD */}
        {activeTab === 'host' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 p-6 sm:p-8 rounded-3xl text-slate-950 shadow-md">
              <div className="max-w-2xl space-y-2">
                <span className="text-xs font-black uppercase tracking-wider bg-white/40 px-2.5 py-1 rounded-full">
                  Chuẩn bị buổi học
                </span>
                <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                  Tổ chức trò chơi trắc nghiệm QR xoay 4 hướng
                </h2>
                <p className="text-sm font-medium text-slate-900/80 leading-relaxed">
                  Trẻ cầm bảng in cá nhân xoay để chọn đáp án A, B, C hoặc D. Cô giáo chiếu câu hỏi lên màn hình TV lớn và lia điện thoại quét đáp án của cả lớp!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Configuration Wizard (8 cols) */}
              <div className="lg:col-span-8 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                {/* Step 1: Chọn lớp học */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">
                        1
                      </span>
                      <span>Chọn lớp học hoặc nhóm bé tham gia</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('students')}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Quản lý danh sách bé →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedClassForGame('all')}
                      className={`p-3.5 rounded-2xl border text-left transition ${
                        selectedClassForGame === 'all'
                          ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-200'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <h4 className="font-bold text-xs text-slate-800">Tất cả các lớp</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {allStudents.length} bé
                      </p>
                    </button>

                    {classList.map((cls) => {
                      const count = allStudents.filter((s) => s.className === cls).length;
                      const isSelected = selectedClassForGame === cls;
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => setSelectedClassForGame(cls)}
                          className={`p-3.5 rounded-2xl border text-left transition ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-200'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <h4 className="font-bold text-xs text-slate-800 truncate">
                            {cls}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {count} bé
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Chọn bộ câu hỏi */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">
                        2
                      </span>
                      <span>Chọn bộ đề câu hỏi trắc nghiệm</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('bank')}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Thêm bộ câu hỏi mới →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                    {packs.map((p) => {
                      const isSelected = selectedPack?.id === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPackIdForGame(p.id)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-200'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {p.coverImage ? (
                              <img
                                src={p.coverImage}
                                alt={p.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xl">📚</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-xs text-slate-800 truncate">
                              {p.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {p.topic} • {p.questions.length} câu hỏi
                            </p>
                          </div>
                          {isSelected && (
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                              ✓
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 3: Tên buổi chơi */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">
                      3
                    </span>
                    <span>Tùy chỉnh tên buổi chơi & mã phòng</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">
                        Tên buổi chơi:
                      </label>
                      <input
                        type="text"
                        value={gameTitle}
                        onChange={(e) => setGameTitle(e.target.value)}
                        placeholder="Trắc nghiệm toán đếm..."
                        className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">
                        Mã phòng tự chọn (để trống sẽ tạo ngẫu nhiên):
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={customRoomCode}
                        onChange={(e) => setCustomRoomCode(e.target.value.toUpperCase())}
                        placeholder="Ví dụ: VUI01"
                        className="w-full px-3.5 py-2 text-xs font-mono font-bold uppercase border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Launch Button */}
                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleStartGame}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-base rounded-2xl shadow-lg active:scale-98 transition flex items-center justify-center gap-3"
                  >
                    <span>🚀</span>
                    <span>BẮT ĐẦU BUỔI HỌC TRẮC NGHIỆM QR</span>
                    <span>({participatingStudents.length} bé • {selectedPack?.questions.length || 0} câu)</span>
                  </button>
                </div>
              </div>

              {/* Right Quick Guide & Instructions (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span>💡 Cách vận hành lớp học</span>
                  </h3>

                  <ol className="text-xs text-slate-600 space-y-3 leading-relaxed">
                    <li className="flex gap-2.5">
                      <span className="font-bold text-amber-600">1.</span>
                      <span>
                        <strong>Phát bảng đáp án:</strong> Mỗi bé cầm 1 bảng QR cá nhân có hình ảnh và tên của mình.
                      </span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="font-bold text-amber-600">2.</span>
                      <span>
                        <strong>Chiếu câu hỏi:</strong> Máy tính kết nối TV hoặc máy chiếu để cả lớp cùng quan sát.
                      </span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="font-bold text-amber-600">3.</span>
                      <span>
                        <strong>Bé chọn đáp án:</strong> Xoay bảng để chữ cái A, B, C hoặc D hướng lên trên cùng.
                      </span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="font-bold text-amber-600">4.</span>
                      <span>
                        <strong>Cô quét camera:</strong> Lia điện thoại qua cả lớp, hệ thống tự động ghi nhận ngay lập tức!
                      </span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="font-bold text-amber-600">5.</span>
                      <span>
                        <strong>Công bố & Khen thưởng:</strong> Màn hình TV mở kết quả đúng và phân bố lựa chọn cả lớp.
                      </span>
                    </li>
                  </ol>

                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                    <p className="font-bold">Chưa có bảng in cho bé?</p>
                    <p className="text-[11px] text-amber-800">
                      Cô hãy chuyển sang tab &quot;In bảng đáp án QR&quot; để tải file in A4 hoặc A5 cho lớp.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('print')}
                      className="mt-1 text-xs text-indigo-700 font-bold hover:underline"
                    >
                      In bảng đáp án ngay →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STUDENT MANAGEMENT */}
        {activeTab === 'students' && (
          <QRStudentManager
            onPrintStudents={handlePrintStudents}
            onNavigateToTab={(t) => setActiveTab(t)}
          />
        )}

        {/* TAB 3: PRINT VIEW */}
        {activeTab === 'print' && (
          <QRCardPrintView
            students={allStudents}
            initialSelectedStudentIds={
              preselectedStudentIdsForPrint.length > 0
                ? preselectedStudentIdsForPrint
                : undefined
            }
            onBack={() => setActiveTab('host')}
          />
        )}

        {/* TAB 4: QUESTION BANK */}
        {activeTab === 'bank' && (
          <QRQuestionBank onSelectPackToPlay={handleSelectPackToPlay} />
        )}

        {/* TAB 5: HISTORY */}
        {activeTab === 'history' && <QRSessionHistory />}
      </main>
    </div>
  );
};
