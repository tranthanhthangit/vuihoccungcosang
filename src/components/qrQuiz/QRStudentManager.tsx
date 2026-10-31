import React, { useState, useMemo, useRef } from 'react';
import { QRStudent } from '../../types/qrQuiz';
import {
  getQRStudents,
  saveQRStudent,
  deleteQRStudent,
  importStudentsFromCSV,
  exportStudentsToCSV,
  getQRSessionsHistory,
} from '../../services/qrStorage';
import QRCode from 'qrcode';

interface QRStudentManagerProps {
  onPrintStudents?: (studentIds: string[]) => void;
  onNavigateToTab?: (tab: 'print' | 'bank' | 'host' | 'history') => void;
}

export const QRStudentManager: React.FC<QRStudentManagerProps> = ({
  onPrintStudents,
  onNavigateToTab,
}) => {
  const [students, setStudents] = useState<QRStudent[]>(() => getQRStudents());
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<QRStudent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    className: '',
    avatarUrl: '',
    notes: '',
  });

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState<QRStudent | null>(null);
  const [hasGameHistoryWarning, setHasGameHistoryWarning] = useState(false);

  // Quick QR preview modal
  const [previewStudent, setPreviewStudent] = useState<QRStudent | null>(null);
  const [previewQrDataUrl, setPreviewQrDataUrl] = useState<string>('');

  // CSV Import modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importTargetClass, setImportTargetClass] = useState('Lớp Lá 1');
  const [importResult, setImportResult] = useState<{ added: number; errors: string[] } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const refreshList = () => {
    setStudents(getQRStudents());
  };

  // Unique classes list
  const classList = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.className) set.add(s.className);
    });
    return Array.from(set).sort();
  }, [students]);

  // Filtered students
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

  // Open add modal
  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      className: selectedClass !== 'all' ? selectedClass : 'Lớp Lá 1',
      avatarUrl: '',
      notes: '',
    });
    setIsEditModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (student: QRStudent) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      className: student.className,
      avatarUrl: student.avatarUrl || '',
      notes: student.notes || '',
    });
    setIsEditModalOpen(true);
  };

  // Save student
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    saveQRStudent({
      id: editingStudent?.id,
      name: formData.name.trim(),
      className: formData.className.trim() || 'Lớp Mầm',
      avatarUrl: formData.avatarUrl,
      notes: formData.notes,
    });

    setIsEditModalOpen(false);
    refreshList();
  };

  // Avatar upload
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, avatarUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Request delete with history check
  const handleRequestDelete = (student: QRStudent) => {
    const history = getQRSessionsHistory();
    const hasPlayed = history.some((h) =>
      h.studentSummaries.some((s) => s.studentId === student.id)
    );
    setHasGameHistoryWarning(hasPlayed);
    setDeleteTarget(student);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteQRStudent(deleteTarget.id);
    setDeleteTarget(null);
    refreshList();
  };

  // Preview QR
  const handlePreviewQR = async (student: QRStudent) => {
    setPreviewStudent(student);
    try {
      const dataUrl = await QRCode.toDataURL(student.qrToken, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: 'H',
      });
      setPreviewQrDataUrl(dataUrl);
    } catch (err) {
      console.error(err);
    }
  };

  // Selection toggle
  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  // CSV Import execute
  const handleExecuteImport = () => {
    if (!importText.trim()) return;
    const result = importStudentsFromCSV(importText, importTargetClass);
    setImportResult(result);
    refreshList();
    if (result.added > 0) {
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportResult(null);
        setImportText('');
      }, 1500);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const csvContent = exportStudentsToCSV(
      selectedClass === 'all' ? undefined : selectedClass
    );
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `danh_sach_hoc_sinh_qr_${selectedClass === 'all' ? 'tat_ca' : selectedClass}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>Danh sách học sinh & mã QR</span>
            <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-medium">
              {filteredStudents.length} bé
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Mỗi bé sở hữu một mã QR cá nhân duy nhất để giơ bảng đáp án xoay 4 hướng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm transition active:scale-95"
          >
            <span>+</span>
            <span>Thêm học sinh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium text-sm transition"
          >
            Nhập CSV / Excel
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium text-sm transition"
          >
            Xuất file CSV
          </button>

          {onPrintStudents && (
            <button
              type="button"
              onClick={() => {
                const targetIds =
                  selectedStudentIds.length > 0
                    ? selectedStudentIds
                    : filteredStudents.map((s) => s.id);
                onPrintStudents(targetIds);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm transition active:scale-95"
            >
              <span>🖨️</span>
              <span>
                In bảng QR (
                {selectedStudentIds.length > 0
                  ? selectedStudentIds.length
                  : filteredStudents.length}
                )
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="md:col-span-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên bé hoặc mã..."
            className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="md:col-span-4">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          >
            <option value="all">Tất cả các lớp ({students.length} bé)</option>
            {classList.map((cls) => {
              const count = students.filter((s) => s.className === cls).length;
              return (
                <option key={cls} value={cls}>
                  {cls} ({count} bé)
                </option>
              );
            })}
          </select>
        </div>

        <div className="md:col-span-4 flex items-center justify-between sm:justify-end gap-3 text-sm text-slate-600">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={
                filteredStudents.length > 0 &&
                selectedStudentIds.length === filteredStudents.length
              }
              onChange={toggleSelectAll}
              className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400"
            />
            <span className="text-xs font-medium">Chọn tất cả</span>
          </label>

          {selectedStudentIds.length > 0 && (
            <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 font-medium">
              Đã chọn: {selectedStudentIds.length} bé
            </span>
          )}
        </div>
      </div>

      {/* Students list cards/grid */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-300">
          <div className="text-4xl mb-3">👶</div>
          <h3 className="text-base font-semibold text-slate-700">
            Chưa có học sinh nào phù hợp
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Cô có thể bấm &quot;Thêm học sinh&quot; hoặc &quot;Nhập CSV / Excel&quot; để bổ sung danh sách lớp.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition"
          >
            + Thêm học sinh ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStudents.map((student) => {
            const isSelected = selectedStudentIds.includes(student.id);
            return (
              <div
                key={student.id}
                className={`relative bg-white rounded-2xl border transition-all p-4 flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-400 ring-2 ring-amber-200 shadow-md'
                    : 'border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                {/* Select checkbox */}
                <div className="absolute top-3 left-3 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectStudent(student.id)}
                    className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400 cursor-pointer"
                  />
                </div>

                {/* Top student summary */}
                <div className="flex items-start gap-3 pl-6">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-amber-50 border border-amber-200 flex-shrink-0 flex items-center justify-center shadow-inner">
                    {student.avatarUrl ? (
                      <img
                        src={student.avatarUrl}
                        alt={student.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">👶</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-slate-800 text-sm truncate">
                      {student.name}
                    </h4>
                    <p className="text-xs text-amber-700 font-medium">
                      {student.className}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Mã: {student.studentCode}
                    </p>
                  </div>
                </div>

                {/* Bottom preview QR & Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => handlePreviewQR(student)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium flex items-center gap-1.5 transition"
                  >
                    <span>📷</span>
                    <span>Xem QR</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(student)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Sửa thông tin"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestDelete(student)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Xóa học sinh"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">
                {editingStudent ? 'Chỉnh sửa thông tin bé' : 'Thêm học sinh mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 mt-4">
              {/* Avatar pick */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {formData.avatarUrl ? (
                    <img
                      src={formData.avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">👶</span>
                  )}
                </div>
                <div className="space-y-1">
                  <input
                    type="file"
                    ref={avatarInputRef}
                    accept="image/*"
                    onChange={handleAvatarFile}
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg"
                    >
                      Tải ảnh lên
                    </button>
                    {formData.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, avatarUrl: '' }))}
                        className="px-2 py-1.5 text-rose-600 hover:bg-rose-50 text-xs rounded-lg"
                      >
                        Xóa ảnh
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Hỗ trợ ảnh JPG, PNG vuông để in bảng đẹp nhất.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên bé <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Ví dụ: Nguyễn Minh An"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lớp học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.className}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, className: e.target.value }))
                  }
                  placeholder="Ví dụ: Lớp Lá 1"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú cho giáo viên (tùy chọn)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, notes: e.target.value }))
                  }
                  placeholder="Sở thích, ngày sinh..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              {editingStudent && (
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 space-y-0.5">
                  <p>Mã QR Token: <span className="font-mono text-slate-700">{editingStudent.qrToken}</span></p>
                  <p className="text-[11px] text-slate-400 italic">
                    * Đổi tên hoặc ảnh sẽ không làm thay đổi mã QR của bé, đảm bảo bảng đã in vẫn dùng bình thường.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium shadow-sm transition"
                >
                  {editingStudent ? 'Cập nhật' : 'Thêm bé'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mx-auto">
              ⚠️
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-800 text-base">
                Xóa hồ sơ học sinh?
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Cô có chắc muốn xóa bé <span className="font-semibold text-slate-800">{deleteTarget.name}</span> ({deleteTarget.className})?
              </p>
              {hasGameHistoryWarning && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-800 leading-relaxed">
                  ⚠️ <strong>Lưu ý:</strong> Bé này đã có kết quả tham gia trò chơi trước đây. Việc xóa hồ sơ sẽ không làm mất dữ liệu lịch sử cũ, nhưng bé sẽ không còn trong danh sách chơi mới.
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium shadow-sm"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Single QR Modal */}
      {previewStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">
                Mã QR cá nhân của bé
              </h3>
              <button
                type="button"
                onClick={() => setPreviewStudent(null)}
                className="text-slate-400 hover:text-slate-600 text-base"
              >
                ✕
              </button>
            </div>

            <div>
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 mx-auto flex items-center justify-center overflow-hidden mb-2">
                {previewStudent.avatarUrl ? (
                  <img
                    src={previewStudent.avatarUrl}
                    alt={previewStudent.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">👶</span>
                )}
              </div>
              <h4 className="font-bold text-slate-800 text-base">
                {previewStudent.name}
              </h4>
              <p className="text-xs text-amber-700 font-medium">
                {previewStudent.className} • Mã: {previewStudent.studentCode}
              </p>
            </div>

            {/* QR display with 4-orientation labels preview */}
            <div className="relative p-6 bg-slate-50 border border-slate-200 rounded-2xl mx-auto w-64 h-64 flex items-center justify-center">
              <span className="absolute top-1 text-xs font-bold text-slate-600 tracking-wider">▲ A (TRÊN)</span>
              <span className="absolute bottom-1 text-xs font-bold text-slate-600 tracking-wider">▼ C (DƯỚI)</span>
              <span className="absolute left-1 text-xs font-bold text-slate-600 tracking-wider rotate-90">◀ D</span>
              <span className="absolute right-1 text-xs font-bold text-slate-600 tracking-wider -rotate-90">B ▶</span>

              {previewQrDataUrl ? (
                <img
                  src={previewQrDataUrl}
                  alt="QR Code"
                  className="w-40 h-40 bg-white p-1 rounded-lg border border-slate-200 shadow-sm"
                />
              ) : (
                <div className="w-40 h-40 bg-slate-200 animate-pulse rounded-lg" />
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              Token nhận diện: <span className="font-mono">{previewStudent.qrToken}</span>
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPreviewStudent(null)}
                className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50"
              >
                Đóng
              </button>
              {onPrintStudents && (
                <button
                  type="button"
                  onClick={() => {
                    const id = previewStudent.id;
                    setPreviewStudent(null);
                    onPrintStudents([id]);
                  }}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm"
                >
                  In thẻ bé này
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <span>📋</span>
                <span>Nhập danh sách học sinh từ CSV / Excel</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportResult(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-base"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p>
                Cô có thể dán danh sách họ tên từ Excel (mỗi dòng một bé), hoặc nhập theo định dạng CSV:
              </p>
              <div className="p-2 bg-slate-50 rounded-lg font-mono text-[11px] text-slate-700">
                Nguyễn Minh An, Lớp Lá 1<br />
                Trần Bảo Ngọc, Lớp Lá 1<br />
                Lê Hoàng Long, Lớp Lá 1
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lớp mặc định (nếu trong dòng không ghi tên lớp):
              </label>
              <input
                type="text"
                value={importTargetClass}
                onChange={(e) => setImportTargetClass(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Nội dung danh sách:
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Hoặc chọn tệp .csv từ máy tính
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const r = new FileReader();
                    r.onload = () => setImportText(r.result as string);
                    r.readAsText(file);
                  }}
                />
              </div>
              <textarea
                rows={6}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Dán nội dung từ Excel hoặc CSV vào đây..."
                className="w-full p-3 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            {importResult && (
              <div
                className={`p-3 rounded-xl text-xs ${
                  importResult.added > 0
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <p className="font-semibold">
                  {importResult.added > 0
                    ? `Thành công! Đã thêm ${importResult.added} học sinh mới.`
                    : 'Không tìm thấy dòng học sinh hợp lệ nào.'}
                </p>
                {importResult.errors.length > 0 && (
                  <ul className="mt-1 list-disc list-inside text-[11px]">
                    {importResult.errors.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportResult(null);
                }}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={!importText.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium shadow-sm transition"
              >
                Nhập danh sách
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
