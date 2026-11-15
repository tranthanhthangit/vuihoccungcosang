import React, { useState, useEffect } from 'react';
import { Users, ArrowRight, Info, Check, Gamepad2, Plus } from 'lucide-react';
import { Game } from '../types/game';
import { DEFAULT_GAMES } from '../data/defaultGames';
import { getAllGames, subscribeGames } from '../services/gameStorage';
import { sounds } from '../utils/sound';

interface CreateRoomSelectionPageProps {
  onSelectSingleRoom: (selectedGame?: Game) => void;
  onSelectDualRoom: () => void;
  onBackToHome?: () => void;
  onCreateNewGame?: () => void;
  preselectedGame?: Game | null;
}

export const CreateRoomSelectionPage: React.FC<CreateRoomSelectionPageProps> = ({
  onSelectSingleRoom,
  onSelectDualRoom,
  onBackToHome,
  onCreateNewGame,
  preselectedGame,
}) => {
  const [allGames, setAllGames] = useState<Game[]>(() => {
    const stored = getAllGames();
    return stored.length > 0 ? stored : DEFAULT_GAMES;
  });

  const [selectedGameId, setSelectedGameId] = useState<string>(() => {
    return preselectedGame?.id || allGames[0]?.id || '';
  });
  const [showGamePicker, setShowGamePicker] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeGames((updated) => {
      const valid = updated.length > 0 ? updated : DEFAULT_GAMES;
      setAllGames(valid);
      if (valid.length > 0 && !valid.some((g) => g.id === selectedGameId)) {
        setSelectedGameId(valid[0].id);
      }
    });
    return () => unsub();
  }, [selectedGameId]);

  useEffect(() => {
    if (preselectedGame?.id) {
      setSelectedGameId(preselectedGame.id);
    }
  }, [preselectedGame?.id]);

  const activeGame = allGames.find((g) => g.id === selectedGameId) || allGames[0];

  const handleStartSingleRoom = () => {
    sounds.playClick();
    onSelectSingleRoom(activeGame);
  };

  const handleStartDualRoom = () => {
    sounds.playClick();
    onSelectDualRoom();
  };

  const handleCreateNewGame = () => {
    sounds.playClick();
    if (onCreateNewGame) {
      onCreateNewGame();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in font-sans">
      {/* Title & Subtitle + Top Create Action Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto mb-8 sm:mb-10 text-center sm:text-left">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#172033] tracking-tight">
            Tạo phòng chơi trực tuyến
          </h1>
          <p className="text-sm sm:text-base text-[#64748B] mt-1.5 font-medium">
            Chọn hình thức tổ chức phù hợp với hoạt động của lớp.
          </p>
        </div>

        {onCreateNewGame && (
          <button
            type="button"
            onClick={handleCreateNewGame}
            className="h-10 px-4 rounded-xl bg-[#16865D] hover:bg-[#126b4a] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition active:scale-98 cursor-pointer shrink-0"
            title="Tạo bộ câu hỏi mới cho phòng chơi"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tạo bộ câu hỏi mới</span>
          </button>
        )}
      </div>

      {/* Two Main Cards Grid matching Screen 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch mb-8">
        {/* Card 1: Phòng chơi 1 bộ đề (Cả lớp) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-[#E5E7EB] shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            {/* 3 Green User Figures Icon */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-2xl bg-[#E2F4EC] flex items-center justify-center text-[#16865D] group-hover:scale-105 transition-transform">
              <Users className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>

            <div className="text-center mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-[#172033]">
                Phòng chơi 1 bộ đề
              </h2>
              <span className="text-sm font-semibold text-[#16865D]">
                (Cả lớp)
              </span>
              <p className="text-xs sm:text-sm text-[#64748B] mt-3 leading-relaxed max-w-xs mx-auto">
                Cả lớp cùng tham gia sử dụng chung một bộ câu hỏi.
              </p>
            </div>

            {/* Selected Game info badge */}
            <div className="mb-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Gamepad2 className="w-4 h-4 text-[#16865D] shrink-0" />
                <span className="text-[#64748B]">Bộ đề đã chọn:</span>
                <span className="font-bold text-[#172033] truncate">
                  {activeGame?.title || 'Nhận biết chữ cái'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowGamePicker((prev) => !prev)}
                className="text-xs font-semibold text-[#2563EB] hover:underline shrink-0 ml-2 cursor-pointer"
              >
                {showGamePicker ? 'Thu gọn' : 'Đổi bộ đề'}
              </button>
            </div>

            {/* Quick Game Picker Dropdown */}
            {showGamePicker && (
              <div className="mb-3 max-h-52 overflow-y-auto space-y-1.5 p-2 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB]">
                {onCreateNewGame && (
                  <button
                    type="button"
                    onClick={handleCreateNewGame}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-[#16865D] bg-[#E2F4EC] hover:bg-[#d0edd9] flex items-center justify-between transition cursor-pointer mb-2 border border-[#bfe3d0]"
                  >
                    <div className="flex items-center gap-2">
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>+ Soạn / Tạo bộ câu hỏi mới</span>
                    </div>
                    <span className="text-[10px] bg-white text-[#16865D] font-bold px-1.5 py-0.5 rounded shadow-2xs">
                      Mới
                    </span>
                  </button>
                )}
                {allGames.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSelectedGameId(g.id);
                      setShowGamePicker(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                      selectedGameId === g.id
                        ? 'bg-[#16865D] text-white font-bold'
                        : 'hover:bg-white text-[#172033]'
                    }`}
                  >
                    <span className="truncate">{g.title}</span>
                    {selectedGameId === g.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
              </div>
            )}

            {/* Prominent "+ Tạo bộ câu hỏi mới" button inside Card 1 */}
            {onCreateNewGame && (
              <button
                type="button"
                onClick={handleCreateNewGame}
                className="w-full mb-6 py-2.5 px-3 rounded-xl border border-dashed border-[#16865D]/60 bg-[#E2F4EC]/60 hover:bg-[#E2F4EC] text-[#16865D] hover:text-[#126b4a] text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-[0.99] cursor-pointer shadow-2xs"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Tạo bộ câu hỏi mới</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleStartSingleRoom}
            className="w-full h-12 rounded-xl sm:rounded-2xl bg-[#16865D] hover:bg-[#126b4a] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-xs"
          >
            <span>Tạo phòng ngay</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Card 2: Phòng chơi 2 bộ đề */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-[#E5E7EB] shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            {/* Orange & Green User Figures Icon */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-2xl bg-[#FFEDD5] flex items-center justify-center text-[#EA580C] group-hover:scale-105 transition-transform">
              <div className="flex items-center -space-x-2">
                <Users className="w-7 h-7 sm:w-8 sm:h-8 text-[#EA580C]" />
                <span className="text-sm font-bold text-[#94A3B8]">/</span>
                <Users className="w-7 h-7 sm:w-8 sm:h-8 text-[#16865D]" />
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-[#172033]">
                Phòng chơi 2 bộ đề
              </h2>
              <span className="text-sm font-semibold text-[#EA580C]">
                (Thi đua nhóm A / B)
              </span>
              <p className="text-xs sm:text-sm text-[#64748B] mt-3 leading-relaxed max-w-xs mx-auto">
                Chia lớp thành 2 nhóm, mỗi nhóm sử dụng một bộ câu hỏi khác nhau.
              </p>
            </div>

            {/* Feature bullets */}
            <div className="mb-4 p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-1.5 text-xs text-[#64748B]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
                <span>Nhóm 1 làm bộ câu hỏi A</span>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16865D]" />
                <span>Nhóm 2 làm bộ câu hỏi B</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                <span>Hiển thị bảng xếp hạng so sánh 2 nhóm trực tiếp</span>
              </div>
            </div>

            {/* Prominent "+ Tạo bộ câu hỏi mới" button inside Card 2 */}
            {onCreateNewGame && (
              <button
                type="button"
                onClick={handleCreateNewGame}
                className="w-full mb-6 py-2.5 px-3 rounded-xl border border-dashed border-[#EA580C]/60 bg-[#FFEDD5]/60 hover:bg-[#FFEDD5] text-[#EA580C] hover:text-[#c2410c] text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-[0.99] cursor-pointer shadow-2xs"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Tạo bộ câu hỏi mới</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleStartDualRoom}
            className="w-full h-12 rounded-xl sm:rounded-2xl bg-[#EA580C] hover:bg-[#c2410c] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-xs"
          >
            <span>Tạo phòng 2 bộ đề</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Suggestion Callout matching Screen 2 */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E7EB] flex items-start gap-3.5 shadow-2xs">
        <div className="w-7 h-7 rounded-full bg-[#E2F4EC] text-[#16865D] flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#172033]">Gợi ý</h4>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 leading-relaxed">
            Bạn có thể chọn Phòng chơi 1 bộ đề khi tổ chức hoạt động chung cả lớp, hoặc Phòng chơi 2 bộ đề khi muốn tạo hoạt động thi đua giữa 2 nhóm. Cô cũng có thể tạo bộ câu hỏi mới bất cứ lúc nào bằng nút <b>Tạo bộ câu hỏi mới</b> ở trên.
          </p>
        </div>
      </div>
    </div>
  );
};
