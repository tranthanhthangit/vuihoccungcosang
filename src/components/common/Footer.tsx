import React from 'react';
import { sounds } from '../../utils/sound';

interface FooterProps {
  onHome?: () => void;
  onOpenGamesBank?: () => void;
  onOpenQRQuiz?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onHome, onOpenGamesBank, onOpenQRQuiz }) => {
  const handleHomeClick = () => {
    sounds.playClick();
    if (onHome) {
      onHome();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-white border-t border-slate-100 pt-10 pb-8 px-4 sm:px-8 mt-12 select-none text-[#10234D]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* ================= COLUMN 1: BRAND LOGO & INTRO ================= */}
          <div className="md:col-span-5 flex flex-col items-start">
            <button
              type="button"
              onClick={handleHomeClick}
              className="group cursor-pointer focus:outline-none mb-3"
              title="Vui học cùng cô"
            >
              <img
                src="/assets/aistudio/logo_vuihoc_official.png"
                alt="Vui học cùng cô"
                className="h-10 w-auto object-contain"
              />
            </button>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mb-4">
              Nền tảng trò chơi giáo dục mầm non tương tác trực quan, giúp bé học tập vui vẻ,
              rèn luyện tư duy và phát triển toàn diện.
            </p>

            <p className="text-[11px] text-slate-400">
              © 2026 Vui học cùng cô. Tất cả các quyền được bảo lưu.
            </p>
          </div>

          {/* ================= COLUMN 2: LIÊN KẾT NHANH ================= */}
          <div className="md:col-span-4 space-y-2">
            <h4 className="text-sm font-bold text-[#10234D] mb-3">Liên kết nhanh</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <button
                  type="button"
                  onClick={handleHomeClick}
                  className="hover:text-[#087CF5] transition cursor-pointer"
                >
                  Trang chủ
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    if (onOpenGamesBank) onOpenGamesBank();
                  }}
                  className="hover:text-[#087CF5] transition cursor-pointer"
                >
                  Kho trò chơi giáo dục
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    if (onOpenQRQuiz) onOpenQRQuiz();
                  }}
                  className="hover:text-[#087CF5] transition cursor-pointer"
                >
                  Trò chơi quét mã QR giấy
                </button>
              </li>
              <li>
                <span className="text-slate-400">Hướng dẫn dành cho giáo viên</span>
              </li>
            </ul>
          </div>

          {/* ================= COLUMN 3: CHÍNH SÁCH & LIÊN HỆ ================= */}
          <div className="md:col-span-3 space-y-2">
            <h4 className="text-sm font-bold text-[#10234D] mb-3">Chính sách & Hỗ trợ</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <span className="hover:text-[#087CF5] cursor-pointer">Chính sách bảo mật</span>
              </li>
              <li>
                <span className="hover:text-[#087CF5] cursor-pointer">Điều khoản sử dụng</span>
              </li>
              <li>
                <span className="hover:text-[#087CF5] cursor-pointer">Hỗ trợ kỹ thuật: support@vuihoc.vn</span>
              </li>
            </ul>

            <div className="pt-2 text-[11px] text-slate-400">
              Phiên bản giáo dục mầm non chuẩn hóa
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
