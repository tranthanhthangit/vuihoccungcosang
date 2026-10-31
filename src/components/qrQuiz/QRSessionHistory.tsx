import React, { useState } from 'react';
import { QRSessionHistoryRecord } from '../../types/qrQuiz';
import { getQRSessionsHistory, deleteQRSessionHistory } from '../../services/qrStorage';

export const QRSessionHistory: React.FC = () => {
  const [historyList, setHistoryList] = useState<QRSessionHistoryRecord[]>(() =>
    getQRSessionsHistory()
  );
  const [selectedRecord, setSelectedRecord] = useState<QRSessionHistoryRecord | null>(
    () => historyList[0] || null
  );

  const refreshList = () => {
    const list = getQRSessionsHistory();
    setHistoryList(list);
    if (selectedRecord && !list.some((r) => r.id === selectedRecord.id)) {
      setSelectedRecord(list[0] || null);
    }
  };

  const handleDelete = (recordId: string) => {
    if (!window.confirm('Cô có chắc muốn xóa bản ghi lịch sử này?')) return;
    deleteQRSessionHistory(recordId);
    refreshList();
  };

  // Export report to CSV
  const handleExportCSV = (record: QRSessionHistoryRecord) => {
    const packTitle = record.packTitle || record.title || 'Trắc nghiệm QR';
    const playedAt = record.playedAt || record.date || Date.now();
    const accuracy = record.overallAccuracy ?? record.correctRate ?? 0;

    const rows = [
      ['BÁO CÁO KẾT QUẢ TRẮC NGHIỆM BẢNG ĐÁP ÁN QR'],
      ['Bộ câu hỏi:', packTitle],
      ['Lớp tham gia:', record.className],
      ['Thời gian:', new Date(playedAt).toLocaleString('vi-VN')],
      ['Tổng số bé:', String(record.totalStudents)],
      ['Tổng số câu hỏi:', String(record.totalQuestions)],
      ['Tỷ lệ đúng trung bình:', `${accuracy}%`],
      [],
      ['HẠNG', 'HỌ VÀ TÊN', 'LỚP', 'SỐ CÂU ĐÚNG', 'TỔNG ĐIỂM', 'TỶ LỆ ĐÚNG'],
    ];

    record.studentSummaries.forEach((s, idx) => {
      const studentAccuracy = record.totalQuestions > 0 ? Math.round((s.correctCount / record.totalQuestions) * 100) : 0;
      rows.push([
        String(idx + 1),
        s.studentName,
        s.className || record.className,
        `${s.correctCount}/${record.totalQuestions}`,
        String(s.totalScore),
        `${studentAccuracy}%`,
      ]);
    });

    const csvContent = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ket_qua_qr_${record.className}_${new Date(playedAt).toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (historyList.length === 0) {
    return (
      <div className="bg-white p-12 text-center rounded-3xl border border-slate-200">
        <span className="text-4xl block mb-2">📜</span>
        <h3 className="text-base font-bold text-slate-800">
          Chưa có lịch sử ván chơi QR nào
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Khi cô tổ chức trò chơi trắc nghiệm bảng đáp án QR cho lớp, kết quả từng câu và điểm số của từng bé sẽ được lưu lại tại đây.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>Kết quả & Lịch sử trò chơi QR</span>
            <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-medium">
              {historyList.length} buổi chơi
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Xem lại điểm số, xếp hạng và tỷ lệ trả lời đúng của từng bé trong các buổi học.
          </p>
        </div>

        {selectedRecord && (
          <button
            type="button"
            onClick={() => handleExportCSV(selectedRecord)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95"
          >
            <span>📥</span>
            <span>Xuất bảng điểm CSV</span>
          </button>
        )}
      </div>

      {/* Main 2-column view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left History List */}
        <div className="lg:col-span-4 space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
          {historyList.map((rec) => {
            const isSelected = selectedRecord?.id === rec.id;
            const playedAt = rec.playedAt || rec.date || Date.now();
            const dateStr = new Date(playedAt).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            const accuracy = rec.overallAccuracy ?? rec.correctRate ?? 0;
            const title = rec.packTitle || rec.title || 'Trắc nghiệm QR';

            return (
              <div
                key={rec.id}
                onClick={() => setSelectedRecord(rec)}
                className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-amber-50/70 border-amber-400 ring-1 ring-amber-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {title}
                    </span>
                  </div>
                  <p className="text-xs text-amber-700 font-medium mt-0.5">
                    {rec.className} • {rec.totalStudents} bé • {rec.totalQuestions} câu
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{dateStr}</p>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {accuracy}% đúng
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(rec.id);
                    }}
                    className="text-slate-400 hover:text-rose-600 text-xs p-1"
                    title="Xóa bản ghi"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Detail View */}
        <div className="lg:col-span-8">
          {selectedRecord ? (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              {/* Top Banner Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold uppercase tracking-wider">
                    {selectedRecord.className}
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 mt-1">
                    {selectedRecord.packTitle || selectedRecord.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Thời gian: {new Date(selectedRecord.playedAt || selectedRecord.date || Date.now()).toLocaleString('vi-VN')}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 text-center border border-slate-100">
                    <span className="text-[11px] text-slate-400 block">Sĩ số bé</span>
                    <strong className="text-base text-slate-800 font-black">
                      {selectedRecord.totalStudents}
                    </strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 text-center border border-slate-100">
                    <span className="text-[11px] text-slate-400 block">Số câu hỏi</span>
                    <strong className="text-base text-slate-800 font-black">
                      {selectedRecord.totalQuestions}
                    </strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50 text-center border border-emerald-100">
                    <span className="text-[11px] text-emerald-600 block">Tỷ lệ đúng</span>
                    <strong className="text-base text-emerald-700 font-black">
                      {selectedRecord.overallAccuracy ?? selectedRecord.correctRate ?? 0}%
                    </strong>
                  </div>
                </div>
              </div>

              {/* Student Podium / Leaderboard */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <span>🏆 Bảng thành tích học sinh</span>
                </h4>

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3 text-center w-12">Hạng</th>
                        <th className="p-3">Học sinh</th>
                        <th className="p-3 text-center">Số câu đúng</th>
                        <th className="p-3 text-center">Tổng điểm</th>
                        <th className="p-3 text-center">Tỷ lệ đúng</th>
                        <th className="p-3 text-center">Khen thưởng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedRecord.studentSummaries.map((s, idx) => {
                        const accuracy =
                          selectedRecord.totalQuestions > 0
                            ? Math.round(
                                (s.correctCount / selectedRecord.totalQuestions) * 100
                              )
                            : 0;

                        return (
                          <tr
                            key={s.studentId}
                            className={`hover:bg-slate-50/70 ${
                              idx === 0
                                ? 'bg-amber-50/40 font-semibold'
                                : idx === 1
                                ? 'bg-slate-50/50'
                                : idx === 2
                                ? 'bg-orange-50/30'
                                : ''
                            }`}
                          >
                            <td className="p-3 text-center font-bold">
                              {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : idx + 1}
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-slate-800">
                                {s.studentName}
                              </span>
                              <span className="text-[11px] text-slate-400 block">
                                {s.className}
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono">
                              <span className="text-emerald-700 font-bold">
                                {s.correctCount}
                              </span>{' '}
                              / {selectedRecord.totalQuestions}
                            </td>
                            <td className="p-3 text-center font-bold font-mono text-slate-800">
                              {s.totalScore}đ
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  accuracy >= 80
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : accuracy >= 50
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {accuracy}%
                              </span>
                            </td>
                            <td className="p-3 text-center text-xs">
                              {idx === 0
                                ? '🌟 Bé Xuất Sắc'
                                : idx === 1
                                ? '⭐ Bé Thông Minh'
                                : idx === 2
                                ? '✨ Bé Chăm Chỉ'
                                : '👍 Bé Cố Gắng'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200">
              <p className="text-sm text-slate-400">Chọn một buổi chơi để xem chi tiết.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
