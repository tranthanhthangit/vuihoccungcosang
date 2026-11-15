import React, { useState } from 'react';
import {
  ArrowRight,
  Plus,
  ListChecks,
  Clock,
  BarChart3,
  HelpCircle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { sounds } from '../utils/sound';

interface CreateRoomPageProps {
  onCreateSingleRoom: () => void;
  onCreateDualRoom: () => void;
  onOpenMyRooms?: () => void;
  onOpenHistory?: () => void;
  onOpenReports?: () => void;
}

export const CreateRoomPage: React.FC<CreateRoomPageProps> = ({
  onCreateSingleRoom,
  onCreateDualRoom,
  onOpenMyRooms,
  onOpenHistory,
  onOpenReports,
}) => {
  const [showGuideModal, setShowGuideModal] = useState(false);

  return (
    <div className="w-full min-h-[calc(100vh-65px)] bg-gradient-to-b from-[#BCE2FF] via-[#CBE9FF] to-[#BCE3A8] p-3 sm:p-4 lg:p-5 select-none text-[#1A1C4E] flex flex-col">
      <div className="w-full max-w-[1440px] mx-auto flex-1 flex flex-col md:flex-row gap-4 lg:gap-5 items-stretch">
        {/* ================= 1. LEFT SIDEBAR (EXACT MOCKUP LAYOUT) ================= */}
        <aside className="w-full md:w-[245px] lg:w-[272px] shrink-0 rounded-[28px] bg-gradient-to-b from-[#EBF6FF] via-[#EAF5FF] to-[#EBF6FF] border-2 border-white/90 shadow-md flex flex-col justify-between overflow-hidden">
          {/* Top Navigation Items */}
          <div className="p-4 lg:p-5 pb-2">
            {/* Sidebar Title */}
            <div className="flex items-center gap-2.5 px-2 pt-1 pb-4">
              <img
                src="/assets/aistudio/create_room_gamepad.png"
                alt="Chơi trực tuyến"
                className="w-8 h-8 object-contain shrink-0"
              />
              <span className="text-[17px] lg:text-[18px] font-black text-[#1E1B4B] tracking-tight">
                Chơi trực tuyến
              </span>
            </div>

            {/* Active Pill: + Tạo phòng chơi */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
              }}
              className="w-full py-3 px-4 rounded-full bg-[#DDD6FE] hover:bg-[#D3C8FD] text-[#27185E] font-extrabold text-[15px] lg:text-[16px] flex items-center gap-3 shadow-2xs transition-all cursor-pointer mb-2"
            >
              <span className="w-6 h-6 rounded-full bg-[#312E81] text-white flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4 stroke-[3]" />
              </span>
              <span>Tạo phòng chơi</span>
            </button>

            {/* Secondary Menu Links */}
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onOpenMyRooms?.();
                }}
                className="w-full py-2.5 px-4 rounded-2xl hover:bg-white/70 text-[#1E1B4B] font-bold text-[15px] lg:text-[16px] flex items-center gap-3 transition-colors cursor-pointer text-left"
              >
                <ListChecks className="w-5 h-5 text-[#1E1B4B] stroke-[2.2] shrink-0" />
                <span>Phòng của tôi</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onOpenHistory?.();
                }}
                className="w-full py-2.5 px-4 rounded-2xl hover:bg-white/70 text-[#1E1B4B] font-bold text-[15px] lg:text-[16px] flex items-center gap-3 transition-colors cursor-pointer text-left"
              >
                <Clock className="w-5 h-5 text-[#1E1B4B] stroke-[2.2] shrink-0" />
                <span>Lịch sử chơi</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  if (onOpenReports) {
                    onOpenReports();
                  } else {
                    onOpenHistory?.();
                  }
                }}
                className="w-full py-2.5 px-4 rounded-2xl hover:bg-white/70 text-[#1E1B4B] font-bold text-[15px] lg:text-[16px] flex items-center gap-3 transition-colors cursor-pointer text-left"
              >
                <BarChart3 className="w-5 h-5 text-[#1E1B4B] stroke-[2.2] shrink-0" />
                <span>Báo cáo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setShowGuideModal(true);
                }}
                className="w-full py-2.5 px-4 rounded-2xl hover:bg-white/70 text-[#1E1B4B] font-bold text-[15px] lg:text-[16px] flex items-center gap-3 transition-colors cursor-pointer text-left"
              >
                <HelpCircle className="w-5 h-5 text-[#1E1B4B] stroke-[2.2] shrink-0" />
                <span>Hướng dẫn</span>
              </button>
            </nav>
          </div>

          {/* Teacher in Pink Ao Dai Illustration at Bottom of Sidebar */}
          <div className="hidden md:block w-full mt-auto pt-2 pointer-events-none">
            <img
              src="/assets/aistudio/create_room_teacher_sidebar.png"
              alt="Cô giáo hướng dẫn"
              className="w-full h-auto object-cover object-bottom block"
            />
          </div>
        </aside>

        {/* ================= 2. RIGHT MAIN SCENIC STAGE ================= */}
        <section className="flex-1 rounded-[28px] overflow-hidden shadow-md border-2 border-white/80 bg-[#BEE3FF] relative flex flex-col justify-center">
          {/* DESKTOP & TABLET SCENIC CANVAS (Matches image_6f2ba771.png 100%) */}
          <div className="hidden md:block relative w-full h-full">
            <div className="relative w-full aspect-[1330/798]">
              {/* Clean Scenic Stage Illustration (Clouds, Waving Kids, S-Curve Cards, 3D Icons, Flower Hills) */}
              <img
                src="/assets/aistudio/create_room_stage_clean.png"
                alt="Tạo phòng chơi trực tuyến"
                className="w-full h-full object-fill block pointer-events-none select-none"
              />

              {/* 2A. Top Centered Banner Pill Content */}
              <div
                className="absolute flex flex-col items-center justify-center text-center px-4"
                style={{
                  left: '16.5%',
                  top: '4.8%',
                  width: '64.2%',
                  height: '20.2%',
                }}
              >
                <div className="flex items-center justify-center gap-2.5 lg:gap-3.5 mb-1">
                  <img
                    src="/assets/aistudio/create_room_gamepad.png"
                    alt="Gamepad"
                    className="w-10 lg:w-14 xl:w-16 h-auto object-contain drop-shadow-xs shrink-0"
                  />
                  <h1 className="text-xl lg:text-[32px] xl:text-[38px] font-black text-[#1B1464] tracking-tight leading-none">
                    Tạo phòng chơi trực tuyến
                  </h1>
                </div>
                <p className="text-xs lg:text-[15px] xl:text-[17px] font-bold text-[#1E293B] mt-0.5">
                  Tạo phòng để cả lớp cùng tham gia trò chơi tương tác ngay!
                </p>
              </div>

              {/* 2B. Left Card Content: Phòng chơi 1 bộ đề (Cả lớp) */}
              <div
                onClick={() => {
                  sounds.playCorrect();
                  onCreateSingleRoom();
                }}
                className="absolute flex flex-col items-center justify-between text-center px-4 lg:px-7 py-2 lg:py-3 cursor-pointer group"
                style={{
                  left: '9.2%',
                  top: '47.5%',
                  width: '38.4%',
                  height: '41.5%',
                }}
              >
                <div className="flex flex-col items-center my-auto">
                  <h2 className="text-lg lg:text-[26px] xl:text-[30px] font-black text-[#12265A] leading-[1.18] tracking-tight mb-2">
                    Phòng chơi
                    <br />1 bộ đề (Cả lớp)
                  </h2>
                  <p className="text-xs lg:text-[16px] xl:text-[18px] font-semibold text-[#1E3A5F] leading-snug">
                    Tất cả học sinh chơi chung
                    <br />1 bộ câu hỏi.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sounds.playCorrect();
                    onCreateSingleRoom();
                  }}
                  className="w-[88%] py-2.5 lg:py-3.5 px-5 rounded-full bg-gradient-to-r from-[#0066FF] to-[#005CE6] group-hover:from-[#005CE6] group-hover:to-[#0047B3] group-active:scale-98 text-white font-black text-sm lg:text-[20px] xl:text-[22px] flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer"
                >
                  <span>Tạo phòng ngay</span>
                  <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 stroke-[3]" />
                </button>
              </div>

              {/* 2C. Right Card Content: Phòng chơi 2 bộ đề */}
              <div
                onClick={() => {
                  sounds.playCorrect();
                  onCreateDualRoom();
                }}
                className="absolute flex flex-col items-center justify-between text-center px-4 lg:px-7 py-2 lg:py-3 cursor-pointer group"
                style={{
                  left: '50.2%',
                  top: '47.5%',
                  width: '38.4%',
                  height: '41.5%',
                }}
              >
                <div className="flex flex-col items-center my-auto">
                  <h2 className="text-lg lg:text-[26px] xl:text-[30px] font-black text-[#B80D57] leading-[1.18] tracking-tight mb-2">
                    Phòng chơi
                    <br />2 bộ đề
                  </h2>
                  <p className="text-xs lg:text-[16px] xl:text-[18px] font-semibold text-[#1E293B] leading-snug">
                    Chia lớp thành 2 nhóm,
                    <br />
                    mỗi nhóm 1 bộ câu hỏi.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sounds.playCorrect();
                    onCreateDualRoom();
                  }}
                  className="w-[88%] py-2.5 lg:py-3.5 px-5 rounded-full bg-gradient-to-r from-[#FF2780] to-[#F0146E] group-hover:from-[#E6196B] group-hover:to-[#C8105B] group-active:scale-98 text-white font-black text-sm lg:text-[20px] xl:text-[22px] flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer"
                >
                  <span>Tạo phòng ngay</span>
                  <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 stroke-[3]" />
                </button>
              </div>
            </div>
          </div>

          {/* MOBILE RESPONSIVE VIEW (< md) */}
          <div className="md:hidden p-4 sm:p-6 flex flex-col gap-5 bg-gradient-to-b from-[#BCE2FF] via-[#D9F0FF] to-[#9BE16B]">
            <div className="bg-white/85 backdrop-blur-xs rounded-3xl p-4 text-center shadow-xs border border-white">
              <div className="flex items-center justify-center gap-2.5 mb-1">
                <img
                  src="/assets/aistudio/create_room_gamepad.png"
                  alt="Gamepad"
                  className="w-10 h-10 object-contain"
                />
                <h1 className="text-xl font-black text-[#1B1464]">
                  Tạo phòng chơi trực tuyến
                </h1>
              </div>
              <p className="text-xs font-bold text-slate-700">
                Tạo phòng để cả lớp cùng tham gia trò chơi tương tác ngay!
              </p>
            </div>

            {/* Card 1 Mobile */}
            <div
              onClick={() => {
                sounds.playCorrect();
                onCreateSingleRoom();
              }}
              className="bg-gradient-to-b from-[#CDEAFF] to-[#E6F4FF] border-4 border-white rounded-[28px] p-5 text-center shadow-md flex flex-col items-center cursor-pointer"
            >
              <img
                src="/assets/aistudio/create_room_icon_single.png"
                alt="1 bộ đề"
                className="h-16 w-auto object-contain mb-2"
              />
              <h2 className="text-xl font-black text-[#12265A] leading-tight mb-1.5">
                Phòng chơi
                <br />1 bộ đề (Cả lớp)
              </h2>
              <p className="text-xs font-semibold text-[#1E3A5F] mb-4">
                Tất cả học sinh chơi chung 1 bộ câu hỏi.
              </p>
              <button
                type="button"
                className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-[#0066FF] to-[#005CE6] text-white font-black text-base flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Tạo phòng ngay</span>
                <ArrowRight className="w-5 h-5 stroke-[2.8]" />
              </button>
            </div>

            {/* Card 2 Mobile */}
            <div
              onClick={() => {
                sounds.playCorrect();
                onCreateDualRoom();
              }}
              className="bg-gradient-to-b from-[#FFDCEB] to-[#FFF0F6] border-4 border-white rounded-[28px] p-5 text-center shadow-md flex flex-col items-center cursor-pointer"
            >
              <img
                src="/assets/aistudio/create_room_icon_dual.png"
                alt="2 bộ đề"
                className="h-16 w-auto object-contain mb-2"
              />
              <h2 className="text-xl font-black text-[#B80D57] leading-tight mb-1.5">
                Phòng chơi
                <br />2 bộ đề
              </h2>
              <p className="text-xs font-semibold text-slate-700 mb-4">
                Chia lớp thành 2 nhóm, mỗi nhóm 1 bộ câu hỏi.
              </p>
              <button
                type="button"
                className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-[#FF2780] to-[#F0146E] text-white font-black text-base flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Tạo phòng ngay</span>
                <ArrowRight className="w-5 h-5 stroke-[2.8]" />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ================= 3. QUICK GUIDE MODAL (HƯỚNG DẪN) ================= */}
      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-xl border-2 border-[#BAE6FD] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="absolute right-4 top-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <img
                src="/assets/aistudio/create_room_gamepad.png"
                alt="Hướng dẫn"
                className="w-10 h-10 object-contain"
              />
              <h3 className="text-xl font-black text-[#1B1464]">
                Hướng dẫn tạo phòng chơi trực tuyến
              </h3>
            </div>

            <div className="space-y-3.5 text-sm text-slate-700">
              <div className="p-3.5 rounded-2xl bg-[#EFF8FF] border border-[#BAE6FD] flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#0066FF] shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-[#12265A] mb-0.5">
                    1. Phòng chơi 1 bộ đề (Cả lớp)
                  </p>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Chọn 1 trò chơi trong kho học liệu để tạo mã PIN / mã QR cho cả lớp cùng tham gia thi đua trả lời chung 1 bộ câu hỏi.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FFF0F6] border border-[#FBCFE8] flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#FF2780] shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-[#B80D57] mb-0.5">
                    2. Phòng chơi 2 bộ đề (Chia 2 nhóm)
                  </p>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Chọn 2 bộ câu hỏi khác nhau cho Đội A và Đội B. Học sinh vào phòng có thể chọn đội hoặc hệ thống tự chia đều 2 nhóm.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-6 py-2.5 rounded-full bg-[#1B1464] hover:bg-[#2E1065] text-white font-extrabold text-sm cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
