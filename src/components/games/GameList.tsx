import React, { useState, useEffect, useMemo } from 'react';
import {
  Gamepad2,
  Search,
  X,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { Game } from '../../types/game';
import {
  getAllGames,
  subscribeGames,
  moveToTrash,
  getTrashGames,
  subscribeTrash,
  isGameVisibleToUser,
} from '../../services/gameStorage';
import { useAuth } from '../../context/AuthContext';
import { sounds } from '../../utils/sound';
import { Modal } from '../common/Modal';
import { UploadHtmlGameModal } from './UploadHtmlGameModal';
import { HtmlGamePreviewModal } from './HtmlGamePreviewModal';
import { GameTrashModal } from './GameTrashModal';
import { GameCoverIllustration } from './GameCoverIllustration';

interface GameListProps {
  onSelectGameToPlay: (game: Game) => void;
  onEditGame: (game: Game) => void;
  onCreateNewGame: () => void;
  onCreateDualRoom?: () => void;
}

export const GameList: React.FC<GameListProps> = ({
  onSelectGameToPlay,
  onCreateNewGame,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const [games, setGames] = useState<Game[]>(() => getAllGames());
  const [trashGames, setTrashGames] = useState<Game[]>(() => getTrashGames());
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState<boolean>(false);
  const [previewHtmlGame, setPreviewHtmlGame] = useState<Game | null>(null);

  useEffect(() => {
    const unsubGames = subscribeGames((updated) => setGames(updated));
    const unsubTrash = subscribeTrash((updated) => setTrashGames(updated));
    return () => {
      unsubGames();
      unsubTrash();
    };
  }, []);

  // Filter visible games
  const visibleGames = useMemo(() => {
    return games.filter((g) => isGameVisibleToUser(g, currentUser, isAdmin));
  }, [games, currentUser, isAdmin]);

  // Sidebar categories matching Screen 4 in mockup:
  const categoriesList = [
    { id: 'all', label: 'Tất cả trò chơi', icon: '🎮', iconBg: 'bg-[#087CF5]' },
    { id: 'letters', label: 'Làm quen chữ cái', icon: '🅰️', iconBg: 'bg-[#F59E0B]' },
    { id: 'numbers', label: 'Làm quen số', icon: '🔢', iconBg: 'bg-[#087CF5]' },
    { id: 'classify', label: 'Nhận biết, phân loại', icon: '🧩', iconBg: 'bg-[#8B5CF6]' },
    { id: 'thinking', label: 'Tư duy – Trí tuệ', icon: '💡', iconBg: 'bg-[#F97316]' },
    { id: 'others', label: 'Trò chơi khác', icon: '🎲', iconBg: 'bg-[#FF2780]' },
  ];

  const filteredGames = useMemo(() => {
    return visibleGames.filter((g) => {
      let matchCat = true;
      const catLower = (g.category || '').toLowerCase();
      const titleLower = (g.title || '').toLowerCase();

      if (activeCategory === 'letters') {
        matchCat = catLower.includes('chữ') || titleLower.includes('chữ') || titleLower.includes('bảng chữ');
      } else if (activeCategory === 'numbers') {
        matchCat = catLower.includes('số') || catLower.includes('toán') || titleLower.includes('số') || titleLower.includes('đếm');
      } else if (activeCategory === 'classify') {
        matchCat = catLower.includes('nhận biết') || catLower.includes('phân loại') || catLower.includes('hình dạng') || titleLower.includes('kéo thả') || titleLower.includes('ô chữ');
      } else if (activeCategory === 'thinking') {
        matchCat = catLower.includes('tư duy') || catLower.includes('trí tuệ') || titleLower.includes('đua xe') || titleLower.includes('nhanh hơn');
      } else if (activeCategory === 'others') {
        matchCat = !catLower.includes('chữ') && !catLower.includes('số') && !catLower.includes('toán') && !catLower.includes('nhận biết');
      }

      const matchSearch =
        searchQuery.trim() === '' ||
        titleLower.includes(searchQuery.toLowerCase()) ||
        catLower.includes(searchQuery.toLowerCase());

      return matchCat && matchSearch;
    });
  }, [visibleGames, activeCategory, searchQuery]);

  const handleConfirmDelete = () => {
    if (!gameToDelete) return;
    sounds.playClick();
    moveToTrash(gameToDelete.id);
    setGameToDelete(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 select-none text-[#10234D]">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ================= 1. SIDEBAR DANH MỤC BÊN TRÁI (SCREEN 4) ================= */}
        <div className="w-full lg:w-64 shrink-0 bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs space-y-2">
          {categoriesList.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setActiveCategory(cat.id);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-[#EFF8FF] text-[#087CF5] font-extrabold shadow-2xs'
                    : 'text-[#10234D] hover:bg-slate-50'
                }`}
              >
                <span className="text-base shrink-0">{cat.icon}</span>
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}

          {/* Quick teacher utilities */}
          <div className="pt-4 mt-3 border-t border-slate-100 space-y-2">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onCreateNewGame();
              }}
              className="w-full py-2.5 px-3 rounded-2xl bg-[#087CF5] hover:bg-[#0066D6] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo trò chơi mới</span>
            </button>

            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="w-full py-2 px-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tải file ZIP / HTML5</span>
            </button>

            {trashGames.length > 0 && (
              <button
                type="button"
                onClick={() => setIsTrashModalOpen(true)}
                className="w-full py-2 px-3 rounded-2xl hover:bg-red-50 text-red-500 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Thùng rác ({trashGames.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* ================= 2. NỘI DUNG KHO TRÒ CHƠI BÊN PHẢI (SCREEN 4) ================= */}
        <div className="flex-1 w-full min-w-0">
          {/* Top Header Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#16A34A] text-white flex items-center justify-center shadow-xs shrink-0">
                <Gamepad2 className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-[#10234D] tracking-tight">
                  Kho trò chơi
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Khám phá nhiều trò chơi giáo dục hấp dẫn, phù hợp cho mầm non.
                </p>
              </div>
            </div>

            {/* Compact Search Box */}
            <div className="relative w-full md:w-64 shrink-0">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm trò chơi..."
                className="w-full pl-4 pr-9 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-[#10234D] placeholder-slate-400 focus:outline-none focus:border-[#087CF5] focus:bg-white transition"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              )}
            </div>
          </div>

          {/* ================= 3. LƯỚI TRÒ CHƠI 3 CỘT (SCREEN 4) ================= */}
          {filteredGames.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
              <p className="text-sm font-bold text-slate-500 mb-3">
                Không tìm thấy trò chơi nào phù hợp với bộ lọc
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('all');
                  setSearchQuery('');
                }}
                className="px-5 py-2.5 rounded-2xl bg-[#087CF5] text-white font-extrabold text-xs cursor-pointer shadow-xs"
              >
                Xem tất cả trò chơi
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {filteredGames.map((game) => {
                return (
                  <div
                    key={game.id}
                    onClick={() => {
                      sounds.playCorrect();
                      onSelectGameToPlay(game);
                    }}
                    className="bg-white rounded-2xl border border-slate-200/80 hover:border-[#087CF5]/60 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col overflow-hidden group"
                  >
                    {/* Thumbnail Illustration */}
                    <div className="h-36 sm:h-40 w-full bg-slate-50 overflow-hidden">
                      <GameCoverIllustration game={game} />
                    </div>

                    {/* Game Title below */}
                    <div className="p-3.5 text-center bg-white flex flex-col items-center justify-center">
                      <h3 className="text-sm font-extrabold text-[#10234D] group-hover:text-[#087CF5] transition-colors line-clamp-1">
                        {game.title}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upload HTML / ZIP Modal */}
      <UploadHtmlGameModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onGameUploaded={() => setGames(getAllGames())}
      />

      {/* Preview Modal */}
      <HtmlGamePreviewModal
        isOpen={Boolean(previewHtmlGame)}
        game={previewHtmlGame}
        onClose={() => setPreviewHtmlGame(null)}
      />

      {/* Trash Modal */}
      <GameTrashModal
        isOpen={isTrashModalOpen}
        trashGames={trashGames}
        onClose={() => setIsTrashModalOpen(false)}
        onGameRestored={() => {
          setGames(getAllGames());
          setTrashGames(getTrashGames());
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(gameToDelete)}
        title="Chuyển vào thùng rác?"
        message={`Cô có chắc chắn muốn chuyển trò chơi "${gameToDelete?.title}" vào thùng rác không?`}
        confirmText="Xóa trò chơi"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setGameToDelete(null)}
      />
    </div>
  );
};
