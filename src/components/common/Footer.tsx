import React from 'react';
import { Home } from 'lucide-react';
import { sounds } from '../../utils/sound';

interface FooterProps {
  onHome?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onHome }) => {
  const handleHomeClick = () => {
    sounds.playClick();
    if (onHome) {
      onHome();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative bg-[#f0f9ff] border-t border-sky-100 overflow-hidden pt-10 pb-8 px-4 sm:px-8 mt-12 select-none">
      {/* Decorative preschool flower bushes matching the mockup exactly */}
      <img
        src="/assets/aistudio/footer_flower_left.png"
        alt=""
        className="absolute left-0 bottom-0 w-24 sm:w-36 pointer-events-none select-none opacity-90 z-0"
      />
      <img
        src="/assets/aistudio/footer_flower_right.png"
        alt=""
        className="absolute right-0 bottom-0 w-28 sm:w-40 pointer-events-none select-none opacity-90 z-0"
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* ================= COLUMN 1: BRAND LOGO & COPYRIGHT ================= */}
          <div className="md:col-span-4 flex flex-col items-start">
            <button
              type="button"
              onClick={handleHomeClick}
              className="flex items-center gap-2 text-left group cursor-pointer hover:opacity-95 transition focus:outline-none mb-2"
              title="Vui Học Cùng Cô"
            >
              <img
                src="/assets/aistudio/logo_sun.png"
                alt="Logo Mặt Trời Vui Học Cùng Cô"
                className="w-10 h-10 object-contain drop-shadow-xs group-hover:scale-105 transition-transform"
              />
              <div className="font-black text-xl sm:text-2xl tracking-tight leading-tight">
                <span className="text-[#0284c7]">Vui Học </span>
                <span className="text-[#f43f5e]">Cùng </span>
                <span className="text-[#059669]">Cô </span>
                <span className="text-[#f43f5e]">❤</span>
              </div>
            </button>

            <p className="text-xs sm:text-sm font-black text-[#0284c7] mb-5 tracking-tight">
              Cùng bé khám phá – Cùng bé trưởng thành
            </p>

            <p className="text-[11px] sm:text-xs font-medium text-slate-500">
              © 2025 Vui Học Cùng Cô. Tất cả quyền được bảo lưu.
            </p>
          </div>

          {/* ================= COLUMN 2: VỀ CHÚNG TÔI ================= */}
          <div className="md:col-span-5 md:border-l md:border-slate-200/80 md:pl-8">
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-1.5 mb-2.5">
              <span>Về chúng tôi</span>
              <span className="text-[#f43f5e]">❤</span>
            </h3>
            <p className="text-xs sm:text-[13px] font-medium text-slate-600 leading-relaxed max-w-lg">
              Vui Học Cùng Cô là nền tảng trò chơi giáo dục mầm non được thiết kế với mục tiêu giúp trẻ học tập một cách vui vẻ, trực quan và hiệu quả. Chúng tôi luôn nỗ lực mang đến những nội dung chất lượng, an toàn và phù hợp với từng độ tuổi của trẻ.
            </p>
          </div>

          {/* ================= COLUMN 3: KẾT NỐI VỚI CHÚNG TÔI ================= */}
          <div className="md:col-span-3 md:border-l md:border-slate-200/80 md:pl-8">
            <h3 className="text-base sm:text-lg font-black text-slate-900 mb-3">
              Kết nối với chúng tôi
            </h3>

            {/* Social Icons matching mockup: Facebook, YouTube, School/Home */}
            <div className="flex items-center gap-3 mb-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:scale-108 hover:shadow-md transition cursor-pointer"
                title="Facebook Vui Học Cùng Cô"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-[#FF0000] text-white flex items-center justify-center hover:scale-108 hover:shadow-md transition cursor-pointer"
                title="Kênh YouTube Vui Học Cùng Cô"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>

              <button
                type="button"
                onClick={handleHomeClick}
                className="w-9 h-9 rounded-full bg-[#10B981] text-white flex items-center justify-center hover:scale-108 hover:shadow-md transition cursor-pointer"
                title="Trang chủ Vui Học Cùng Cô"
              >
                <Home className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-[13px] font-black text-[#0284c7] italic leading-snug">
              Cùng nhau tạo nên những giờ học thật vui! <span className="text-[#f43f5e] not-italic">❤</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
