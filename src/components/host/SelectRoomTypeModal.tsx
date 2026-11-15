import React from 'react';
import { X, Sparkles, ArrowRight, Gamepad2, QrCode } from 'lucide-react';
import { sounds } from '../../utils/sound';

interface SelectRoomTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNormalRoom: () => void;
  onSelectDualRoom: () => void;
  onSelectQRQuiz?: () => void;
}

export const SelectRoomTypeModal: React.FC<SelectRoomTypeModalProps> = ({
  isOpen,
  onClose,
  onSelectNormalRoom,
  onSelectDualRoom,
  onSelectQRQuiz,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[32px] w-full max-w-3xl shadow-2xl border-4 border-amber-100 overflow-hidden flex flex-col animate-scale-up max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white flex items-center justify-between shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner font-black">
              🎮
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight">
                CHỌN HÌNH THỨC TỔ CHỨC TRÒ CHƠI
              </h3>
              <p className="text-xs text-sky-100 font-semibold">
                Cô chọn trò chơi trực tuyến hoặc trò chơi quét mã QR giấy phù hợp với tiết dạy nhé
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/25 text-white transition cursor-pointer active:scale-95"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-7 space-y-6 bg-slate-50/60">
          {/* GROUP 1: TRÒ CHƠI TRỰC TUYẾN */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm">
                1
              </span>
              <div>
                <h4 className="text-sm sm:text-base font-black text-purple-950 uppercase tracking-wide">
                  Trò chơi trực tuyến (Màn hình & Thiết bị)
                </h4>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Học sinh kết nối vào phòng qua điện thoại/máy tính bảng hoặc bảng tương tác
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: 1 bộ đề */}
              <div
                onClick={() => {
                  sounds.playClick();
                  onClose();
                  onSelectNormalRoom();
                }}
                className="group relative bg-white hover:bg-sky-50/40 rounded-3xl p-5 border-2 border-slate-200 hover:border-sky-300 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between active:scale-98"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform">
                      📘
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-black uppercase">
                      Tiêu chuẩn
                    </span>
                  </div>

                  <h5 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-sky-800 transition">
                    Chế độ chơi 1 bộ đề
                  </h5>
                  <p className="text-xs font-semibold text-slate-500 mt-1 leading-relaxed">
                    Tất cả các bé cùng làm 1 bộ câu hỏi chung. Phù hợp cho ôn tập cả lớp, sinh hoạt chung, hội thi.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-black text-sky-700">
                  <span>Tạo phòng 1 bộ đề</span>
                  <div className="w-6 h-6 rounded-full bg-sky-100 group-hover:bg-sky-500 group-hover:text-white flex items-center justify-center transition">
                    <ArrowRight className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
              </div>

              {/* Option 2: Nhiều bộ đề */}
              <div
                onClick={() => {
                  sounds.playClick();
                  onClose();
                  onSelectDualRoom();
                }}
                className="group relative bg-white hover:bg-purple-50/40 rounded-3xl p-5 border-2 border-purple-200 hover:border-purple-400 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between active:scale-98"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform">
                      ⚡
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase flex items-center gap-1 shadow-2xs">
                      <Sparkles className="w-3 h-3" />
                      <span>2 Bộ Đề A/B</span>
                    </span>
                  </div>

                  <h5 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-purple-700 transition">
                    Phòng chơi nhiều bộ đề
                  </h5>
                  <p className="text-xs font-semibold text-slate-500 mt-1 leading-relaxed">
                    Chia nhóm phân hóa: Đội 1 chơi bộ đề A, đội 2 chơi bộ đề B. Màn hình tự động chia đôi hiển thị song song.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-purple-100 flex items-center justify-between text-xs font-black text-purple-700">
                  <span>Tạo phòng 2 bộ đề</span>
                  <div className="w-6 h-6 rounded-full bg-purple-100 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition">
                    <ArrowRight className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GROUP 2: TRÒ CHƠI QUÉT MÃ QR GIẤY */}
          {onSelectQRQuiz && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-sm">
                  2
                </span>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-amber-950 uppercase tracking-wide">
                    Trò chơi quét mã QR giấy (Thẻ xoay 4 hướng)
                  </h4>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    Không cần mỗi bé có điện thoại • Bé xoay thẻ A, B, C, D • Cô giáo lia camera điện thoại quét
                  </p>
                </div>
              </div>

              <div
                onClick={() => {
                  sounds.playClick();
                  onClose();
                  onSelectQRQuiz();
                }}
                className="group relative bg-white hover:bg-amber-50/50 rounded-3xl p-5 border-2 border-amber-300 hover:border-amber-500 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 active:scale-98"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-transform shrink-0">
                    📱
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-amber-900 transition">
                        Bảng đáp án QR xoay 4 hướng
                      </h5>
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                        Khuyên dùng cho mầm non
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 mt-1 leading-relaxed">
                      Mỗi bé cầm bảng thẻ QR cá nhân xoay để chọn đáp án. Máy tính chiếu câu hỏi lên TV, cô giáo chỉ cần cầm điện thoại quét một vòng là ghi nhận cả lớp!
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2.5 rounded-2xl bg-amber-500 text-white font-black text-xs group-hover:bg-amber-600 transition flex items-center gap-2 shrink-0 shadow-sm">
                  <span>Mở Trò chơi QR</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-black text-xs transition cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
