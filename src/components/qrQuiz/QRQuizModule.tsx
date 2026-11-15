import React, { useState, useMemo, useEffect } from 'react';
import {
  QrCode,
  ArrowRight,
  Printer,
  Users,
  BookOpen,
  History,
  Camera,
  Play,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import { QRStudent, QRQuestionPack } from '../../types/qrQuiz';
import { getQRStudents, getQRQuestionPacks, subscribeQRStudents, subscribeQRPacks } from '../../services/qrStorage';
import { QRStudentManager } from './QRStudentManager';
import { QRCardPrintView } from './QRCardPrintView';
import { QRQuestionBank } from './QRQuestionBank';
import { QRSessionHistory } from './QRSessionHistory';
import { sounds } from '../../utils/sound';

interface QRQuizModuleProps {
  initialTab?: QRTab;
  onStartHostSession: (config: {
    roomCode: string;
    pack: QRQuestionPack;
    students: QRStudent[];
  }) => void;
  onOpenMobileScanner: (roomCode: string) => void;
  onBackToHome: () => void;
}

export type QRTab = 'host' | 'students' | 'print' | 'bank' | 'history';

export const QRQuizModule: React.FC<QRQuizModuleProps> = ({
  initialTab = 'host',
  onStartHostSession,
  onOpenMobileScanner,
  onBackToHome,
}) => {
  const [activeTab, setActiveTab] = useState<QRTab>(initialTab || 'host');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Data
  const [allStudents, setAllStudents] = useState<QRStudent[]>(() => getQRStudents());
  const [packs, setPacks] = useState<QRQuestionPack[]>(() => getQRQuestionPacks());
  const [preselectedStudentIdsForPrint, setPreselectedStudentIdsForPrint] = useState<string[]>([]);

  useEffect(() => {
    const unsubStu = subscribeQRStudents(setAllStudents);
    const unsubPacks = subscribeQRPacks(setPacks);
    return () => {
      unsubStu();
      unsubPacks();
    };
  }, []);

  // Session options
  const [selectedPackId, setSelectedPackId] = useState<string>(() => packs[0]?.id || '');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [customRoomCode, setCustomRoomCode] = useState<string>('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [scannerCodeInput, setScannerCodeInput] = useState('');

  const classList = useMemo(() => {
    const set = new Set<string>();
    allStudents.forEach((s) => {
      if (s.className) set.add(s.className);
    });
    return Array.from(set).sort();
  }, [allStudents]);

  const participatingStudents = useMemo(() => {
    if (selectedClass === 'all') return allStudents;
    return allStudents.filter((s) => s.className === selectedClass);
  }, [allStudents, selectedClass]);

  const selectedPack = useMemo(() => {
    return packs.find((p) => p.id === selectedPackId) || packs[0];
  }, [packs, selectedPackId]);

  const handleStartSession = () => {
    sounds.playCorrect();
    setSetupError(null);
    if (!selectedPack || selectedPack.questions.length === 0) {
      setSetupError('Vui lòng chọn bộ đề có ít nhất 1 câu hỏi.');
      return;
    }
    if (participatingStudents.length === 0) {
      setSetupError('Vui lòng chọn lớp học có ít nhất 1 học sinh.');
      return;
    }

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

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 select-none text-[#10234D]">
      {/* Sub-nav tabs for teacher actions */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 bg-white rounded-2xl p-2 border border-slate-100 shadow-[0_2px_8px_rgba(16,35,77,0.04)]">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('host')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'host'
                ? 'bg-[#EFF8FF] text-[#087CF5]'
                : 'text-[#10234D] hover:bg-slate-50'
            }`}
          >
            <QrCode className="w-4 h-4 text-inherit" />
            <span>Quét QR giấy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('print')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'print'
                ? 'bg-[#EFF8FF] text-[#087CF5]'
                : 'text-[#10234D] hover:bg-slate-50'
            }`}
          >
            <Printer className="w-4 h-4 text-inherit" />
            <span>In thẻ QR cho bé</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'students'
                ? 'bg-[#EFF8FF] text-[#087CF5]'
                : 'text-[#10234D] hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4 text-inherit" />
            <span>Danh sách học sinh ({allStudents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bank')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'bank'
                ? 'bg-[#EFF8FF] text-[#087CF5]'
                : 'text-[#10234D] hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-inherit" />
            <span>Bộ câu hỏi QR ({packs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-[#EFF8FF] text-[#087CF5]'
                : 'text-[#10234D] hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4 text-inherit" />
            <span>Lịch sử chơi</span>
          </button>
        </div>

        {/* Quick mobile scanner button */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setScannerCodeInput('');
            setIsScannerModalOpen(true);
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Vào quét camera</span>
        </button>
      </div>

      {/* ================= TAB 1: SCREEN 3 - MAIN TRANG QUÉT MÃ QR GIẤY ================= */}
      {activeTab === 'host' && (
        <div className="space-y-6">
          {/* Main Card Container matching Screen 3 in mockup */}
          <div className="bg-[#EFF8FF] border border-[#BAE6FD] rounded-3xl overflow-hidden shadow-xs">
            {/* Banner Scene Area (Full width, no clipping) */}
            <div className="relative w-full">
              {/* Top Title & Description (overlays top-left sky on lg+ screens, stacks cleanly on mobile/tablet) */}
              <div className="px-6 pt-6 pb-2 sm:px-8 sm:pt-7 lg:p-0 lg:absolute lg:top-6 lg:left-8 xl:top-8 xl:left-10 lg:max-w-[47%] z-10">
                <div className="flex items-start gap-3.5 sm:gap-4">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#FF2780] text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                    <QrCode className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl xl:text-3xl font-black text-[#FF2780] tracking-tight leading-tight">
                      Trò chơi Quét mã QR giấy
                    </h1>
                    <p className="text-xs sm:text-sm font-medium text-slate-700 mt-1 leading-snug">
                      Học sinh dùng thẻ giấy có mã QR để trả lời, giáo viên quét mã bằng điện thoại và xem kết quả trên màn hình.
                    </p>
                  </div>
                </div>
              </div>

              {/* Full Center-to-Edge Illustration (Kids with QR cards, Teacher with phone, Laptop with results) */}
              <div className="w-full">
                <img
                  src="/assets/aistudio/qr_characters_laptop_clean.png"
                  alt="Học sinh cầm thẻ QR, cô giáo quét điện thoại, máy tính hiển thị kết quả"
                  className="w-full h-auto block object-contain"
                />
              </div>
            </div>

            {/* 3 Steps Process with pink circles connected by arrows */}
            <div className="px-6 py-4 sm:px-8 sm:py-5 bg-white/75 border-t border-[#BAE6FD]/70 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Step 1 */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#FF2780] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                  1
                </div>
                <span className="text-xs sm:text-sm font-bold text-[#10234D]">
                  Học sinh cầm thẻ QR giấy trả lời
                </span>
              </div>

              <span className="text-[#087CF5] font-black hidden md:inline">→</span>

              {/* Step 2 */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#FF2780] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                  2
                </div>
                <span className="text-xs sm:text-sm font-bold text-[#10234D]">
                  Giáo viên quét mã bằng điện thoại
                </span>
              </div>

              <span className="text-[#087CF5] font-black hidden md:inline">→</span>

              {/* Step 3 */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#FF2780] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                  3
                </div>
                <span className="text-xs sm:text-sm font-bold text-[#10234D]">
                  Xem kết quả trả lời ngay trên màn hình
                </span>
              </div>
            </div>
          </div>

          {/* Quick Setup & Start Button matching Section 7 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_8px_rgba(16,35,77,0.04)] space-y-4">
            <h3 className="text-sm font-black text-[#10234D] uppercase tracking-wider">
              Thiết lập phòng thi đấu QR
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Chọn lớp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Chọn lớp học tham gia:
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#10234D] focus:outline-none focus:border-[#087CF5]"
                >
                  <option value="all">Tất cả các bé ({allStudents.length} học sinh)</option>
                  {classList.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls} ({allStudents.filter((s) => s.className === cls).length} học sinh)
                    </option>
                  ))}
                </select>
              </div>

              {/* Chọn bộ đề */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. Chọn bộ câu hỏi:
                </label>
                <select
                  value={selectedPackId}
                  onChange={(e) => setSelectedPackId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#10234D] focus:outline-none focus:border-[#087CF5]"
                >
                  {packs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.questions.length} câu)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {setupError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{setupError}</span>
              </div>
            )}

            {/* Launch CTA Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartSession}
                className="w-full py-4 rounded-2xl bg-[#FF2780] hover:bg-[#e61b70] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md shadow-[#FF2780]/30 transition active:scale-98 cursor-pointer"
              >
                <span>Bắt đầu quét QR giấy</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: QUẢN LÝ HỌC SINH ================= */}
      {activeTab === 'students' && (
        <QRStudentManager
          onPrintStudents={(studentIds) => {
            setPreselectedStudentIdsForPrint(studentIds);
            setActiveTab('print');
          }}
          onNavigateToTab={(t) => setActiveTab(t)}
        />
      )}

      {/* ================= TAB 3: IN THẺ QR ================= */}
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

      {/* ================= TAB 4: NGÂN HÀNG CÂU HỎI QR ================= */}
      {activeTab === 'bank' && (
        <QRQuestionBank
          onSelectPackToPlay={(pack) => {
            setSelectedPackId(pack.id);
            setActiveTab('host');
          }}
        />
      )}

      {/* ================= TAB 5: LỊCH SỬ PHÒNG CHƠI QR ================= */}
      {activeTab === 'history' && <QRSessionHistory />}

      {/* Mobile Camera Scanner Room Code Modal */}
      {isScannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!scannerCodeInput.trim()) return;
              setIsScannerModalOpen(false);
              onOpenMobileScanner(scannerCodeInput.trim().toUpperCase());
            }}
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#10234D] flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#087CF5]" />
                <span>Mở camera quét thẻ QR</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsScannerModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nhập mã phòng 5 ký tự hiển thị trên màn hình:
              </label>
              <input
                type="text"
                autoFocus
                required
                value={scannerCodeInput}
                onChange={(e) => setScannerCodeInput(e.target.value.toUpperCase())}
                placeholder="Ví dụ: QR123"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-sm text-[#10234D] uppercase tracking-wider focus:outline-none focus:border-[#087CF5]"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsScannerModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#087CF5] hover:bg-[#076ed9] text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Mở camera
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
