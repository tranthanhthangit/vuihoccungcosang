import React, { useState, useMemo } from 'react';
import { Game } from '../../types/game';
import { getAllGames, isGameVisibleToUser } from '../../services/gameStorage';
import { DEFAULT_GAMES } from '../../data/defaultGames';
import { GameCoverIllustration } from '../games/GameCoverIllustration';
import { sounds } from '../../utils/sound';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Layers,
  ArrowRight,
  ArrowLeftRight,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Search,
  Check,
  Play
} from 'lucide-react';

interface CreateDualRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDualRoom: (gameA: Game, gameB: Game) => void;
}

export const CreateDualRoomModal: React.FC<CreateDualRoomModalProps> = ({
  isOpen,
  onClose,
  onConfirmDualRoom,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const allGames = useMemo(() => {
    return getAllGames().filter((g) => isGameVisibleToUser(g, currentUser, isAdmin));
  }, [currentUser, isAdmin]);

  const [selectedGameA, setSelectedGameA] = useState<Game>(() => allGames[0] || DEFAULT_GAMES[0]);
  const [selectedGameB, setSelectedGameB] = useState<Game>(() => allGames[1] || DEFAULT_GAMES[1] || allGames[0]);
  const [activeSlot, setActiveSlot] = useState<'A' | 'B'>('A');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const categories = ['all', ...Array.from(new Set(allGames.map(g => g.category || 'Mầm non')))];

  const filteredGames = allGames.filter((g) => {
    const matchesSearch =
      (g.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || g.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectGame = (game: Game) => {
    sounds.playClick();
    if (activeSlot === 'A') {
      setSelectedGameA(game);
      // Auto move slot to B if B is the same game
      if (selectedGameB.id === game.id) {
        const otherGame = allGames.find(g => g.id !== game.id);
        if (otherGame) setSelectedGameB(otherGame);
      }
      setActiveSlot('B');
    } else {
      setSelectedGameB(game);
    }
  };

  const handleSwapGames = () => {
    sounds.playClick();
    const temp = selectedGameA;
    setSelectedGameA(selectedGameB);
    setSelectedGameB(temp);
  };

  const handleStartRoom = () => {
    sounds.playCorrect();
    onConfirmDualRoom(selectedGameA, selectedGameB);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-5xl h-[92vh] max-h-[94vh] flex flex-col shadow-2xl border-4 border-indigo-100 overflow-hidden">
        
        {/* Compact Header */}
        <div className="px-5 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-base shadow-inner">
              ⚡
            </div>
            <div>
              <h2 className="text-sm sm:text-base md:text-lg font-black tracking-tight flex items-center gap-2">
                <span>TẠO PHÒNG KẾT HỢP 2 BỘ CÂU HỎI</span>
                <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 shadow-2xs">
                  Mới
                </span>
              </h2>
              <p className="text-[11px] text-indigo-100 font-semibold hidden sm:block">
                Chọn 2 bộ câu hỏi. Trong phòng chơi, cô chỉ định từng đội trả lời bộ câu hỏi tương ứng!
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/25 text-white transition cursor-pointer active:scale-95"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Dual Slots Showcase - Compact Layout */}
        <div className="px-4 py-2 sm:px-6 sm:py-2.5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4 relative">
            
            {/* Slot A */}
            <div
              onClick={() => setActiveSlot('A')}
              className={`p-2 sm:p-2.5 rounded-2xl border-2 transition-all cursor-pointer relative flex items-center gap-3 ${
                activeSlot === 'A'
                  ? 'border-indigo-500 bg-indigo-50/80 shadow-sm ring-2 ring-indigo-200'
                  : 'border-slate-200 bg-white hover:border-indigo-300 shadow-2xs'
              }`}
            >
              <div className="w-14 h-11 sm:w-16 sm:h-12 rounded-xl overflow-hidden shadow-inner bg-slate-200 shrink-0 relative">
                <GameCoverIllustration game={selectedGameA} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block" />
                    <span>Bộ 1 (Đề A)</span>
                  </span>
                  {activeSlot === 'A' && (
                    <span className="text-[10px] font-black text-indigo-600 flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                      <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                      <span>Đang chọn ô này</span>
                    </span>
                  )}
                </div>
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                  {selectedGameA.title}
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 font-semibold">
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold">
                    {selectedGameA.category}
                  </span>
                  <span>·</span>
                  <span>{selectedGameA.questions.length} câu</span>
                </div>
              </div>
            </div>

            {/* Swap Button In-Between */}
            <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSwapGames();
                }}
                className="w-8 h-8 rounded-full bg-white border-2 border-indigo-200 text-indigo-600 shadow-md hover:bg-indigo-50 hover:scale-105 active:scale-95 flex items-center justify-center transition cursor-pointer"
                title="Đổi vị trí 2 bộ câu hỏi"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Slot B */}
            <div
              onClick={() => setActiveSlot('B')}
              className={`p-2 sm:p-2.5 rounded-2xl border-2 transition-all cursor-pointer relative flex items-center gap-3 ${
                activeSlot === 'B'
                  ? 'border-pink-500 bg-pink-50/80 shadow-sm ring-2 ring-pink-200'
                  : 'border-slate-200 bg-white hover:border-pink-300 shadow-2xs'
              }`}
            >
              <div className="w-14 h-11 sm:w-16 sm:h-12 rounded-xl overflow-hidden shadow-inner bg-slate-200 shrink-0 relative">
                <GameCoverIllustration game={selectedGameB} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-600 inline-block" />
                    <span>Bộ 2 (Đề B)</span>
                  </span>
                  {activeSlot === 'B' && (
                    <span className="text-[10px] font-black text-pink-600 flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-pink-200 shadow-2xs">
                      <CheckCircle2 className="w-3 h-3 text-pink-500" />
                      <span>Đang chọn ô này</span>
                    </span>
                  )}
                </div>
                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                  {selectedGameB.title}
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 font-semibold">
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold">
                    {selectedGameB.category}
                  </span>
                  <span>·</span>
                  <span>{selectedGameB.questions.length} câu</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Filter & Search Bar - Compact & Highly Functional */}
        <div className="px-4 py-2 sm:px-6 sm:py-2.5 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">
              Đang chọn gán vào:
            </span>
            <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveSlot('A')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  activeSlot === 'A'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
                <span>Bộ 1 (Đề A)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSlot('B')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  activeSlot === 'B'
                    ? 'bg-pink-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-pink-600'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
                <span>Bộ 2 (Đề B)</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {categories.length > 2 && (
              <div className="hidden lg:flex items-center gap-1">
                {categories.slice(0, 5).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-slate-800 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'Tất cả' : cat}
                  </button>
                ))}
              </div>
            )}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bộ trò chơi..."
                className="w-full pl-8 pr-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>
        </div>

        {/* Games Grid for Selection - Maximized Height */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 bg-slate-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
            {filteredGames.map((game) => {
              const isSelectedA = selectedGameA.id === game.id;
              const isSelectedB = selectedGameB.id === game.id;

              return (
                <div
                  key={game.id}
                  onClick={() => handleSelectGame(game)}
                  className={`p-2.5 sm:p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group hover:-translate-y-0.5 ${
                    isSelectedA
                      ? 'border-indigo-500 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-200'
                      : isSelectedB
                      ? 'border-pink-500 bg-pink-50/70 shadow-sm ring-2 ring-pink-200'
                      : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div>
                    <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden mb-2 bg-slate-100 shadow-inner">
                      <GameCoverIllustration game={game} />
                      <div className="absolute top-1.5 left-1.5">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white/90 text-slate-800 shadow-2xs">
                          {game.category}
                        </span>
                      </div>
                      {isSelectedA && (
                        <div className="absolute top-1.5 right-1.5">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-2xs flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            <span>Bộ 1</span>
                          </span>
                        </div>
                      )}
                      {isSelectedB && (
                        <div className="absolute top-1.5 right-1.5">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-pink-600 text-white shadow-2xs flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            <span>Bộ 2</span>
                          </span>
                        </div>
                      )}
                    </div>

                    <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-indigo-600 transition line-clamp-1" title={game.title}>
                      {game.title}
                    </h5>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>{game.questions.length} câu</span>
                    <span className="font-extrabold text-[11px]">
                      {isSelectedA ? (
                        <span className="text-indigo-600">Đã gán Bộ 1</span>
                      ) : isSelectedB ? (
                        <span className="text-pink-600">Đã gán Bộ 2</span>
                      ) : (
                        <span className="text-slate-400 group-hover:text-indigo-600">
                          {activeSlot === 'A' ? '+ Chọn vào Bộ 1' : '+ Chọn vào Bộ 2'}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions - Compact & Clear */}
        <div className="px-4 py-2.5 sm:px-6 sm:py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <div className="text-xs font-bold text-slate-600 flex items-center gap-2 truncate max-w-full">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">
              Bộ 1: <strong className="text-indigo-700">{selectedGameA.title}</strong> · Bộ 2: <strong className="text-pink-700">{selectedGameB.title}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-black text-xs transition cursor-pointer"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleStartRoom}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>TẠO PHÒNG KẾT HỢP 2 BỘ ĐỀ</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
