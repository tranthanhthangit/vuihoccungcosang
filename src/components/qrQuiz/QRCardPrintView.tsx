import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { QRStudent, QRCardAnswer } from '../../types/qrQuiz';
import {
  Printer,
  RotateCw,
  Search,
  CheckSquare,
  Square,
  ArrowLeft,
  Eye,
} from 'lucide-react';
import { sounds } from '../../utils/sound';
import { getQRStudents, subscribeQRStudents } from '../../services/qrStorage';

// Persistent in-memory cache so QR data URLs are generated only once and never freeze the main thread
const qrDataUrlCache = new Map<string, string>();

interface QRCardPrintViewProps {
  students?: QRStudent[];
  initialSelectedStudentIds?: string[];
  onBack?: () => void;
}

export const QRCardPrintView: React.FC<QRCardPrintViewProps> = ({
  students: propStudents,
  initialSelectedStudentIds,
  onBack,
}) => {
  const [students, setStudents] = useState<QRStudent[]>(() => propStudents || getQRStudents());
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(() => {
    if (initialSelectedStudentIds && initialSelectedStudentIds.length > 0) {
      return new Set(initialSelectedStudentIds);
    }
    const initial = propStudents || getQRStudents();
    return new Set(initial.map((s) => s.id));
  });
  const [printLayout, setPrintLayout] = useState<'a4_two' | 'a4_four' | 'a5_one'>('a4_two');
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>(() => {
    // Pre-populate with existing cached URLs for instant 0ms rendering
    const initialUrls: Record<string, string> = {};
    const currentStudents = propStudents || getQRStudents();
    for (const s of currentStudents) {
      if (qrDataUrlCache.has(s.qrToken)) {
        initialUrls[s.id] = qrDataUrlCache.get(s.qrToken)!;
      }
    }
    return initialUrls;
  });
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testStudent, setTestStudent] = useState<QRStudent | null>(null);
  const [testRotation, setTestRotation] = useState<number>(0); // 0, 90, 180, 270 deg

  // Sync with propStudents or subscribe to store updates
  useEffect(() => {
    if (propStudents) {
      setStudents(propStudents);
    } else {
      setStudents(getQRStudents());
      return subscribeQRStudents((latest) => {
        setStudents(latest);
      });
    }
  }, [propStudents]);

  // Sync initialSelectedStudentIds when passed from navigation
  useEffect(() => {
    if (initialSelectedStudentIds && initialSelectedStudentIds.length > 0) {
      setSelectedStudentIds(new Set(initialSelectedStudentIds));
    }
  }, [initialSelectedStudentIds]);

  const classesList = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.className).filter(Boolean))).sort();
  }, [students]);

  // Stable token key to only trigger QR generation if students/tokens actually change
  const studentsTokenKey = useMemo(() => {
    return students.map((s) => `${s.id}:${s.qrToken}`).join('|');
  }, [students]);

  // Non-blocking, chunked QR code generation with cache
  useEffect(() => {
    let isMounted = true;

    const generateAll = async () => {
      const immediateUrls: Record<string, string> = {};
      const missing: QRStudent[] = [];

      for (const s of students) {
        if (qrDataUrlCache.has(s.qrToken)) {
          immediateUrls[s.id] = qrDataUrlCache.get(s.qrToken)!;
        } else {
          missing.push(s);
        }
      }

      if (Object.keys(immediateUrls).length > 0 && isMounted) {
        setQrDataUrls((prev) => ({ ...prev, ...immediateUrls }));
      }

      if (missing.length === 0) return;

      // Generate missing QR codes in small batches of 6 with setTimeout yields
      const batchSize = 6;
      for (let i = 0; i < missing.length; i += batchSize) {
        if (!isMounted) break;
        const chunk = missing.slice(i, i + batchSize);
        const chunkResults: Record<string, string> = {};

        await Promise.all(
          chunk.map(async (s) => {
            try {
              const url = await QRCode.toDataURL(s.qrToken, {
                width: 320,
                margin: 2,
                errorCorrectionLevel: 'M',
                color: {
                  dark: '#000000',
                  light: '#ffffff',
                },
              });
              qrDataUrlCache.set(s.qrToken, url);
              chunkResults[s.id] = url;
            } catch (e) {
              console.warn('Error generating QR for student', s.id, e);
            }
          })
        );

        if (isMounted && Object.keys(chunkResults).length > 0) {
          setQrDataUrls((prev) => ({ ...prev, ...chunkResults }));
        }

        // Yield execution to keep browser completely responsive
        await new Promise((r) => setTimeout(r, 0));
      }
    };

    generateAll();

    return () => {
      isMounted = false;
    };
  }, [studentsTokenKey]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchClass = selectedClass === 'all' || s.className === selectedClass;
      const matchSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentCode.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchSearch;
    });
  }, [students, selectedClass, searchQuery]);

  const studentsToPrint = useMemo(() => {
    return students.filter((s) => selectedStudentIds.has(s.id));
  }, [students, selectedStudentIds]);

  const toggleSelectStudent = (id: string) => {
    sounds.playClick();
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    sounds.playClick();
    if (selectedStudentIds.size === filteredStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const handlePrint = () => {
    sounds.playCorrect();
    window.print();
  };

  const getRotationAnswer = (rotationDeg: number): QRCardAnswer => {
    const norm = (rotationDeg % 360 + 360) % 360;
    if (norm === 0) return 'A';
    if (norm === 90) return 'D';
    if (norm === 180) return 'C';
    return 'B';
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 print:p-0 print:bg-white select-none">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm;
          }
          body {
            background-color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      {/* SCREEN-ONLY TOOLBAR */}
      <div className="max-w-6xl mx-auto print:hidden space-y-5 mb-8">
        {/* Navigation header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={() => {
                  sounds.playClick();
                  onBack();
                }}
                className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                title="Quay lại danh mục"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                <span>IN BẢNG ĐÁP ÁN QR XOAY 4 HƯỚNG</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black">
                  Khổ A4/A5
                </span>
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Mỗi bé 1 bảng đáp án duy nhất. Xoay A, B, C, D lên trên để chọn câu trả lời tương ứng.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Virtual test card button */}
            <button
              onClick={() => {
                sounds.playClick();
                setTestStudent(studentsToPrint[0] || students[0] || null);
                setIsTestModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-black flex items-center gap-1.5 transition cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Thử nghiệm xoay thẻ</span>
            </button>

            {/* Print button */}
            <button
              onClick={handlePrint}
              disabled={studentsToPrint.length === 0}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm flex items-center gap-2 shadow-md shadow-emerald-200 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>IN {studentsToPrint.length} BẢNG ĐÁP ÁN</span>
            </button>
          </div>
        </div>

        {/* Filter and settings bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-700">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by class */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-400">Lớp:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-transparent font-black text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả các lớp</option>
                {classesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Print layout selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-400">Bố cục in:</span>
              <select
                value={printLayout}
                onChange={(e) => setPrintLayout(e.target.value as any)}
                className="bg-transparent font-black text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="a4_two">Khổ A4 (2 bảng / 1 trang - Khuyên dùng)</option>
                <option value="a5_one">Khổ A5 (1 bảng / 1 trang cỡ lớn)</option>
                <option value="a4_four">Khổ A4 (4 bảng mini / 1 trang)</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo tên học sinh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold focus:outline-none focus:border-indigo-500 w-48 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              {selectedStudentIds.size === filteredStudents.length ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Bỏ chọn tất cả</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Chọn tất cả ({filteredStudents.length})</span>
                </>
              )}
            </button>
            <span className="text-slate-400 font-semibold">
              Đã chọn: <b className="text-emerald-700">{selectedStudentIds.size}</b> học sinh
            </span>
          </div>
        </div>

        {/* Student selection pill tags */}
        <div className="flex items-center gap-2 flex-wrap max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
          {filteredStudents.map((s) => {
            const isSelected = selectedStudentIds.has(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggleSelectStudent(s.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{s.name}</span>
                <span className={`text-[10px] opacity-75`}>({s.studentCode})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PRINTABLE CARDS CONTAINER */}
      <div className="max-w-6xl mx-auto print:max-w-none print:w-full">
        {studentsToPrint.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-300 text-center space-y-3">
            <p className="font-black text-slate-600 text-base">Chưa có học sinh nào được chọn để in.</p>
            <p className="text-xs text-slate-400">Vui lòng tích chọn học sinh ở thanh công cụ phía trên.</p>
          </div>
        ) : (
          <div
            className={`grid gap-6 print:gap-4 ${
              printLayout === 'a5_one'
                ? 'grid-cols-1 print:grid-cols-1'
                : printLayout === 'a4_four'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-2 print:grid-cols-2'
            }`}
          >
            {studentsToPrint.map((student, idx) => (
              <div
                key={student.id}
                className={`bg-white rounded-3xl border-3 border-slate-900 p-5 print:p-4 flex flex-col justify-between relative shadow-sm print:shadow-none print:rounded-2xl print:border-4 print:border-black break-inside-avoid ${
                  printLayout === 'a5_one' ? 'min-h-[580px]' : 'min-h-[460px]'
                }`}
              >
                {/* CARD ORIENTATION BADGES (A, B, C, D) */}

                {/* SIDE A: TOP */}
                <div className="w-full flex flex-col items-center justify-center pb-2 border-b-2 border-dashed border-slate-200">
                  <div className="flex items-center gap-1.5 px-4 py-1 rounded-full bg-slate-900 text-white font-black text-lg print:text-xl print:bg-black">
                    <span>▲</span>
                    <span>ĐÁP ÁN A</span>
                    <span>▲</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mt-0.5">
                    HƯỚNG LÊN TRÊN ĐỂ CHỌN A
                  </span>
                </div>

                {/* MIDDLE ROW: D (LEFT) + CENTRAL QR CODE + B (RIGHT) */}
                <div className="flex items-center justify-between my-auto py-3 gap-2">
                  {/* SIDE D: LEFT */}
                  <div className="flex flex-col items-center justify-center w-14 shrink-0">
                    <div className="px-2 py-3 rounded-2xl bg-slate-900 text-white font-black text-lg print:text-xl print:bg-black flex flex-col items-center leading-tight">
                      <span>◀</span>
                      <span className="my-1">D</span>
                    </div>
                  </div>

                  {/* CENTRAL QR CODE BOX */}
                  <div className="flex-1 flex flex-col items-center justify-center p-2 bg-slate-50 border-2 border-slate-900 rounded-2xl print:border-2 print:border-black print:bg-white">
                    {qrDataUrls[student.id] ? (
                      <img
                        src={qrDataUrls[student.id]}
                        alt={`QR code ${student.name}`}
                        className="w-48 h-48 md:w-56 md:h-56 print:w-52 print:h-52 object-contain aspect-square select-none"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-xs font-bold text-slate-400">
                        Đang tạo mã QR...
                      </div>
                    )}

                    {/* QR Identifier caption */}
                    <div className="text-center mt-1">
                      <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                        MÃ: {student.studentCode}
                      </span>
                    </div>
                  </div>

                  {/* SIDE B: RIGHT */}
                  <div className="flex flex-col items-center justify-center w-14 shrink-0">
                    <div className="px-2 py-3 rounded-2xl bg-slate-900 text-white font-black text-lg print:text-xl print:bg-black flex flex-col items-center leading-tight">
                      <span className="my-1">B</span>
                      <span>▶</span>
                    </div>
                  </div>
                </div>

                {/* SIDE C: BOTTOM */}
                <div className="w-full flex flex-col items-center justify-center pt-2 border-t-2 border-dashed border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-0.5">
                    HƯỚNG LÊN TRÊN ĐỂ CHỌN C
                  </span>
                  <div className="flex items-center gap-1.5 px-4 py-1 rounded-full bg-slate-900 text-white font-black text-lg print:text-xl print:bg-black">
                    <span>▼</span>
                    <span>ĐÁP ÁN C</span>
                    <span>▼</span>
                  </div>
                </div>

                {/* STUDENT INFO BADGE (BOTTOM FOOTER) */}
                <div className="mt-3 pt-2 border-t-2 border-slate-900 print:border-black flex items-center justify-between gap-3 text-slate-900">
                  <div className="flex items-center gap-2">
                    {student.avatarUrl ? (
                      <img
                        src={student.avatarUrl}
                        alt=""
                        className="w-8 h-8 rounded-full border border-slate-900 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-900 flex items-center justify-center font-black text-xs">
                        {student.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-black text-xs sm:text-sm tracking-tight leading-tight uppercase">
                        {student.name}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-600 leading-none">
                        {student.className}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] font-black text-slate-500 uppercase block">
                      VUI HỌC CÙNG CÔ
                    </span>
                    <span className="text-[10px] font-black text-slate-900">
                      BẢNG ĐÁP ÁN QR
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VIRTUAL TEST MODAL: TEST ROTATION ON SCREEN */}
      {isTestModalOpen && testStudent && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-slate-900">THỬ NGHIỆM XOAY THẺ QR</h3>
                <p className="text-xs font-semibold text-slate-500">
                  Bấm xoay thẻ để thử camera nhận diện đúng A, B, C, D
                </p>
              </div>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Rotation controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  sounds.playClick();
                  setTestRotation((prev) => (prev + 90) % 360);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
              >
                <RotateCw className="w-4 h-4" />
                <span>Xoay 90° (+ Bấm tiếp để xoay)</span>
              </button>

              <div className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 font-black text-xs">
                Đáp án đang hướng lên: <b className="text-sm underline">{getRotationAnswer(testRotation)}</b> ({testRotation}°)
              </div>
            </div>

            {/* Rotatable Card Container */}
            <div className="w-72 h-72 mx-auto flex items-center justify-center p-2 bg-slate-100 rounded-3xl overflow-hidden border border-slate-200">
              <div
                style={{
                  transform: `rotate(${testRotation}deg)`,
                  transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                className="w-64 h-64 bg-white rounded-2xl border-2 border-black p-2 flex flex-col justify-between items-center shadow-md select-none"
              >
                <div className="font-black text-xs bg-black text-white px-3 py-0.5 rounded-full">
                  ▲ ĐÁP ÁN A
                </div>
                <div className="flex items-center justify-between w-full px-1">
                  <span className="font-black text-xs bg-black text-white px-1.5 py-0.5 rounded-md">◀ D</span>
                  {qrDataUrls[testStudent.id] && (
                    <img
                      src={qrDataUrls[testStudent.id]}
                      alt="QR preview"
                      className="w-36 h-36 object-contain aspect-square"
                    />
                  )}
                  <span className="font-black text-xs bg-black text-white px-1.5 py-0.5 rounded-md">B ▶</span>
                </div>
                <div className="font-black text-xs bg-black text-white px-3 py-0.5 rounded-full">
                  ▼ ĐÁP ÁN C
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center font-medium">
              💡 <i>Cô có thể dùng camera điện thoại quét trực tiếp thẻ này trên màn hình để kiểm tra độ nhạy trước khi in ra giấy.</i>
            </p>

            <button
              onClick={() => setIsTestModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs cursor-pointer"
            >
              Đóng cửa sổ thử nghiệm
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
