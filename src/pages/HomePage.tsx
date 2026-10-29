import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Sparkles,
  Star,
  ArrowRight,
  Check,
  Search,
  X,
  CheckCircle2,
  User,
  Heart,
  BookOpen,
  Gamepad2,
  Compass,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { sounds } from '../utils/sound';
import { DEFAULT_GAMES } from '../data/defaultGames';
import { Game } from '../types/game';
import {
  getAllGames,
  getFeaturedGameId,
  setFeaturedGameId,
  subscribeGames,
  subscribeFeaturedGame,
  isGameVisibleToUser,
  getFavoriteGameIds,
  toggleFavoriteGameId,
  subscribeFavorites,
  getAdminHomepageGameIds,
  subscribeAdminHomepageGames,
} from '../services/gameStorage';
import { GameCoverIllustration } from '../components/games/GameCoverIllustration';
import { SelectRoomTypeModal } from '../components/host/SelectRoomTypeModal';
import { useAuth } from '../context/AuthContext';

interface HomePageProps {
  onQuickPlay: (game: Game) => void;
  onOpenGamesBank: () => void;
  onCreateGame: () => void;
  onCreateDualRoom?: () => void;
  onJoinRoom: () => void;
  onViewHistory: () => void;
  onOpenProfile?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onQuickPlay,
  onOpenGamesBank,
  onCreateGame,
  onCreateDualRoom,
  onJoinRoom,
  onViewHistory,
  onOpenProfile,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const [allGamesList, setAllGamesList] = useState<Game[]>(() => getAllGames());
  const [featuredId, setFeaturedId] = useState<string>(() => getFeaturedGameId());
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => getFavoriteGameIds());
  const [adminHomepageIds, setAdminHomepageIds] = useState<string[]>(() => getAdminHomepageGameIds());
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'favorite' | 'letters' | 'math' | 'explore'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const GAMES_PER_PAGE = 8;
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);
  const [isSelectFeaturedModalOpen, setIsSelectFeaturedModalOpen] = useState(false);
  const [isSelectRoomTypeModalOpen, setIsSelectRoomTypeModalOpen] = useState(false);
  const [featuredSearch, setFeaturedSearch] = useState('');

  // Subscribe to storage changes
  useEffect(() => {
    const unsubGames = subscribeGames((updated) => setAllGamesList(updated));
    const unsubFeatured = subscribeFeaturedGame((newId) => setFeaturedId(newId));
    const unsubFavs = subscribeFavorites((newFavs) => setFavoriteIds(newFavs));
    const unsubAdminHp = subscribeAdminHomepageGames((ids) => setAdminHomepageIds(ids));
    return () => {
      unsubGames();
      unsubFeatured();
      unsubFavs();
      unsubAdminHp();
    };
  }, []);

  // Reset page when category tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilterTab]);

  // Filter games accessible to the current user (strictly hide private/pending from strangers)
  const visibleGamesList = useMemo(() => {
    return allGamesList.filter((g) => isGameVisibleToUser(g, currentUser, isAdmin));
  }, [allGamesList, currentUser, isAdmin]);

  // Determine the active featured game (must be visible to user, else fallback to safe default)
  const candidateFeatured = allGamesList.find((g) => g.id === featuredId);
  const featuredGame: Game =
    (candidateFeatured && isGameVisibleToUser(candidateFeatured, currentUser, isAdmin)
      ? candidateFeatured
      : null) ||
    DEFAULT_GAMES.find((g) => g.id === featuredId) ||
    DEFAULT_GAMES[0];

  const handleSelectFeatured = (game: Game) => {
    sounds.playCorrect();
    setFeaturedGameId(game.id);
    setFeaturedId(game.id);
    setIsSelectFeaturedModalOpen(false);
    setToastFeedback(`✨ Đã ghim trò chơi "${game.title}" lên banner trang chủ!`);
    setTimeout(() => setToastFeedback(null), 3500);
  };

  const handleToggleFavorite = (game: Game, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sounds.playClick();
    const isNowFav = toggleFavoriteGameId(game.id);
    setToastFeedback(
      isNowFav
        ? `❤️ Đã thêm "${game.title}" vào danh sách yêu thích!`
        : `Đã bỏ "${game.title}" khỏi danh sách yêu thích.`
    );
    setTimeout(() => setToastFeedback(null), 3000);
  };

  const handlePinToBanner = (game: Game, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    handleSelectFeatured(game);
  };

  // Filter games for modal
  const filteredGamesForModal = visibleGamesList.filter((g) =>
    (g.title || '').toLowerCase().includes(featuredSearch.toLowerCase()) ||
    (g.category || '').toLowerCase().includes(featuredSearch.toLowerCase())
  );

  // Favorite games list
  const favoriteGames = useMemo(() => {
    return visibleGamesList.filter((g) => favoriteIds.includes(g.id));
  }, [visibleGamesList, favoriteIds]);

  // Showcase games for homepage
  const displayedShowcaseGames = useMemo(() => {
    let list = [...visibleGamesList];

    if (activeFilterTab === 'favorite') {
      return favoriteGames;
    }

    if (activeFilterTab === 'letters') {
      list = list.filter((g) => {
        const cat = (g.category || '').toLowerCase();
        const title = (g.title || '').toLowerCase();
        return cat.includes('chữ') || title.includes('chữ') || title.includes('tiếng việt');
      });
    } else if (activeFilterTab === 'math') {
      list = list.filter((g) => {
        const cat = (g.category || '').toLowerCase();
        const title = (g.title || '').toLowerCase();
        return cat.includes('toán') || title.includes('toán') || title.includes('số') || title.includes('đếm');
      });
    } else if (activeFilterTab === 'explore') {
      list = list.filter((g) => {
        const cat = (g.category || '').toLowerCase();
        const title = (g.title || '').toLowerCase();
        return (
          cat.includes('động vật') ||
          cat.includes('môi trường') ||
          cat.includes('kỹ năng') ||
          title.includes('nghề') ||
          title.includes('con') ||
          title.includes('khám phá')
        );
      });
    }

    // Sort priority as requested by Admin:
    // 1. Featured game on top banner
    // 2. Admin curated & pinned games on homepage (adminHomepageIds)
    // 3. User favorited games (favoriteIds)
    // 4. Play count or creation time
    return list.sort((a, b) => {
      if (a.id === featuredId) return -1;
      if (b.id === featuredId) return 1;

      const aAdminPinned = adminHomepageIds.includes(a.id) ? 1 : 0;
      const bAdminPinned = adminHomepageIds.includes(b.id) ? 1 : 0;
      if (aAdminPinned !== bAdminPinned) return bAdminPinned - aAdminPinned;

      const aFav = favoriteIds.includes(a.id) ? 1 : 0;
      const bFav = favoriteIds.includes(b.id) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;

      return (b.playCount || 0) - (a.playCount || 0);
    });
  }, [visibleGamesList, activeFilterTab, favoriteGames, featuredId, favoriteIds, adminHomepageIds]);

  const totalPages = Math.ceil(displayedShowcaseGames.length / GAMES_PER_PAGE) || 1;
  const paginatedGames = useMemo(() => {
    const start = (currentPage - 1) * GAMES_PER_PAGE;
    return displayedShowcaseGames.slice(start, start + GAMES_PER_PAGE);
  }, [displayedShowcaseGames, currentPage]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 select-none">
      {/* ---------------------------------------------------- */}
      {/* HERO BANNER MATCHING MOCKUP ARTWORK EXACTLY          */}
      {/* ---------------------------------------------------- */}
      {/* ---------------------------------------------------- */}
      {/* HERO BANNER MATCHING MOCKUP ARTWORK EXACTLY          */}
      {/* ---------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] border-2 border-white/90 shadow-xl shadow-sky-100/70 mb-6 sm:mb-8 bg-sky-200">
        {/* Desktop View: Full Preschool Artwork Banner with Real Interactive Elements */}
        <div className="hidden lg:block relative w-full overflow-hidden">
          <img
            src="/assets/aistudio/banner_full.png"
            alt="Cùng nhau khám phá và học thật vui! - Vui Học Cùng Cô"
            className="w-full h-auto object-cover block select-none pointer-events-none"
          />

          {/* Interactive Button: Tạo phòng 2 bộ đề (Mới) */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              if (onCreateDualRoom) {
                onCreateDualRoom();
              } else {
                setIsSelectRoomTypeModalOpen(true);
              }
            }}
            style={{ left: '3.0%', top: '78.8%', width: '23.8%', height: '14.2%' }}
            className="absolute rounded-full bg-gradient-to-r from-[#ff2872] via-[#ff3b83] to-[#ff2872] text-white shadow-xl shadow-pink-600/40 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 sm:gap-2.5 px-3 py-1 cursor-pointer border-2 border-white/80 group overflow-hidden z-20"
            title="Tạo phòng chơi 2 bộ đề (Mới)"
            aria-label="Tạo phòng 2 bộ đề"
          >
            <span className="w-6 h-6 xl:w-7 xl:h-7 rounded-full bg-white/25 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform shadow-inner">
              <Play className="w-3.5 h-3.5 xl:w-4 xl:h-4 fill-white translate-x-0.5" />
            </span>
            <span className="font-black text-xs xl:text-sm 2xl:text-base tracking-wide whitespace-nowrap drop-shadow-sm">
              Tạo phòng 2 bộ đề
            </span>
            <span className="bg-[#ffcb05] text-[#8c3500] font-black text-[10px] xl:text-xs px-2 py-0.5 rounded-full shadow-xs shrink-0 uppercase tracking-wider">
              Mới
            </span>
          </button>

          {/* Real Interactive Card: Trò chơi mới nhất / Trò chơi nổi bật */}
          <div
            style={{
              left: '72.8%',
              top: '11.0%',
              width: '25.4%',
              height: '81.2%',
            }}
            className="absolute bg-white rounded-2xl xl:rounded-[28px] p-3 xl:p-4 shadow-xl border-2 border-white flex flex-col justify-between z-20 select-auto"
          >
            {/* Header: Tag vàng & tia trang trí */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff9d00] text-white font-black text-xs shadow-xs">
                <Star className="w-3.5 h-3.5 fill-white" />
                <span>Trò chơi mới nhất</span>
              </div>
              <div className="flex gap-0.5 text-amber-400 font-black text-sm select-none pr-1">
                <span>\</span><span>|</span><span>/</span>
              </div>
            </div>

            {/* Content: Thumbnail, Tên trò chơi, Số câu, Tuổi & Nút Chơi ngay */}
            <div className="flex items-center gap-3 my-auto">
              <div className="w-14 h-14 xl:w-16 xl:h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-sky-400 to-blue-500 shadow-sm shrink-0 flex items-center justify-center border border-sky-100">
                {featuredGame.coverImage ? (
                  <img
                    src={featuredGame.coverImage}
                    alt={featuredGame.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#1ea7fd] text-white font-black">
                    <span className="text-lg xl:text-xl tracking-tighter">abc</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <h4
                  className="font-black text-sky-950 text-xs xl:text-sm 2xl:text-base leading-tight line-clamp-1"
                  title={featuredGame.title}
                >
                  {featuredGame.title}
                </h4>
                <p className="text-[11px] xl:text-xs font-bold text-slate-500 mt-0.5 truncate">
                  {featuredGame.targetAge || '5 - 6 tuổi'} · {featuredGame.questions?.length || 5} câu
                </p>
                <div className="mt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playCorrect();
                      onQuickPlay(featuredGame);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#ff2a75] to-[#ff438b] hover:from-[#e91e63] hover:to-[#ff2a75] text-white font-black text-xs xl:text-sm shadow-md shadow-pink-500/30 active:scale-95 transition-all cursor-pointer"
                    title={`Chơi ngay: ${featuredGame.title}`}
                  >
                    <Play className="w-3.5 h-3.5 fill-white translate-x-0.5" />
                    <span>Chơi ngay</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer links: Chơi các trò khác / Đổi gợi ý nổi bật */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] xl:text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onOpenGamesBank();
                }}
                className="text-sky-600 hover:text-sky-700 hover:underline cursor-pointer transition"
              >
                Chơi các
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setIsSelectFeaturedModalOpen(true);
                }}
                className="text-amber-500 hover:text-amber-600 font-black flex items-center gap-1 cursor-pointer transition hover:underline"
                title="Đổi hoặc chọn trò chơi nổi bật"
              >
                <span>⭐</span>
                <span>Gợi ý nổi bật</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile & Tablet Responsive View */}
        <div className="block lg:hidden relative w-full overflow-hidden">
          <img
            src="/assets/aistudio/mobile_banner_card.png"
            alt="Cùng nhau khám phá và học thật vui! - Vui Học Cùng Cô"
            className="w-full h-auto object-cover block select-none pointer-events-none"
          />

          {/* Interactive Button: Tạo phòng 2 bộ đề (Mới) on Mobile */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              if (onCreateDualRoom) {
                onCreateDualRoom();
              } else {
                setIsSelectRoomTypeModalOpen(true);
              }
            }}
            style={{ left: '2.8%', top: '77.0%', width: '45.0%', height: '16.5%' }}
            className="absolute rounded-full bg-gradient-to-r from-[#ff2872] via-[#ff3b83] to-[#ff2872] text-white shadow-lg shadow-pink-600/40 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 px-2.5 py-1 cursor-pointer border-2 border-white/60 group overflow-hidden z-20"
            title="Tạo phòng 2 bộ đề (Mới)"
            aria-label="Tạo phòng 2 bộ đề"
          >
            <span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center text-white shrink-0">
              <Play className="w-3 h-3 fill-white translate-x-0.5" />
            </span>
            <span className="font-black text-[11px] sm:text-xs tracking-wide whitespace-nowrap drop-shadow-sm">
              Tạo phòng 2 bộ đề
            </span>
            <span className="bg-[#ffcb05] text-[#8c3500] font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-xs shrink-0 uppercase">
              Mới
            </span>
          </button>
        </div>
      </div>

      {/* Mobile-only Interactive Featured Game Card */}
      <div className="block lg:hidden mb-6 bg-white rounded-2xl p-3.5 shadow-md border-2 border-amber-100">
        <div className="flex items-center justify-between mb-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ff9d00] text-white font-black text-[11px] shadow-xs">
            <Star className="w-3 h-3 fill-white" />
            <span>Trò chơi mới nhất</span>
          </div>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setIsSelectFeaturedModalOpen(true);
            }}
            className="text-amber-600 hover:text-amber-700 font-black text-xs flex items-center gap-1 cursor-pointer"
          >
            <span>⭐</span>
            <span>Gợi ý nổi bật</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-sky-400 to-blue-500 shadow-xs shrink-0 flex items-center justify-center text-white font-black border border-sky-100">
            {featuredGame.coverImage ? (
              <img
                src={featuredGame.coverImage}
                alt={featuredGame.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-base tracking-tighter">abc</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-black text-sky-950 text-sm truncate" title={featuredGame.title}>
              {featuredGame.title}
            </h4>
            <p className="text-[11px] font-bold text-slate-500">
              {featuredGame.targetAge || '5 - 6 tuổi'} · {featuredGame.questions?.length || 5} câu
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              sounds.playCorrect();
              onQuickPlay(featuredGame);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#ff2a75] to-[#ff438b] text-white font-black text-xs shadow-md shadow-pink-500/25 shrink-0 active:scale-95 transition cursor-pointer"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>Chơi ngay</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 4 MAIN ACTION CARDS (2x2 GRID ON MOBILE / 4 ON DESKTOP) */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 mb-8">
        {/* CARD 1: TẠO PHÒNG CHƠI */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setIsSelectRoomTypeModalOpen(true);
          }}
          className="group relative rounded-[20px] sm:rounded-[28px] overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] transition-all duration-200 cursor-pointer block p-0 border-0 bg-transparent text-left focus:outline-none w-full"
          title="Tạo phòng chơi: Cô tạo phòng để cả lớp cùng chơi"
          aria-label="Tạo phòng chơi"
        >
          <img
            src="/assets/aistudio/m_card1.png"
            alt="Tạo phòng chơi: Cô tạo phòng để cả lớp cùng chơi"
            className="w-full h-auto block select-none pointer-events-none rounded-[20px] sm:rounded-[28px]"
          />
        </button>

        {/* CARD 2: THAM GIA PHÒNG */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onJoinRoom();
          }}
          className="group relative rounded-[20px] sm:rounded-[28px] overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] transition-all duration-200 cursor-pointer block p-0 border-0 bg-transparent text-left focus:outline-none w-full"
          title="Tham gia phòng: Nhập mã phòng để tham gia"
          aria-label="Tham gia phòng"
        >
          <img
            src="/assets/aistudio/m_card2.png"
            alt="Tham gia phòng: Nhập mã phòng để tham gia"
            className="w-full h-auto block select-none pointer-events-none rounded-[20px] sm:rounded-[28px]"
          />
        </button>

        {/* CARD 3: TẠO TRÒ CHƠI MỚI */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onCreateGame();
          }}
          className="group relative rounded-[20px] sm:rounded-[28px] overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] transition-all duration-200 cursor-pointer block p-0 border-0 bg-transparent text-left focus:outline-none w-full"
          title="Tạo trò chơi mới: Tự thiết kế trò chơi của cô"
          aria-label="Tạo trò chơi mới"
        >
          <img
            src="/assets/aistudio/m_card3.png"
            alt="Tạo trò chơi mới: Tự thiết kế trò chơi của cô"
            className="w-full h-auto block select-none pointer-events-none rounded-[20px] sm:rounded-[28px]"
          />
        </button>

        {/* CARD 4: LỊCH SỬ CHƠI */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onViewHistory();
          }}
          className="group relative rounded-[20px] sm:rounded-[28px] overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] transition-all duration-200 cursor-pointer block p-0 border-0 bg-transparent text-left focus:outline-none w-full"
          title="Lịch sử chơi: Xem lại các lần chơi"
          aria-label="Lịch sử chơi"
        >
          <img
            src="/assets/aistudio/m_card4.png"
            alt="Lịch sử chơi: Xem lại các lần chơi"
            className="w-full h-auto block select-none pointer-events-none rounded-[20px] sm:rounded-[28px]"
          />
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* FEATURED & FAVORITE GAMES SHOWCASE SECTION           */}
      {/* ---------------------------------------------------- */}
      <section className="mt-8 sm:mt-10 mb-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5 sm:mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 font-black text-xs mb-2">
              <Sparkles className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>Gợi ý cho cô và bé</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Trò chơi nổi bật & Được yêu thích</span>
              <span className="text-xl sm:text-2xl">✨</span>
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-semibold mt-1">
              Những bộ trò chơi giáo dục mầm non sinh động, trực quan giúp bé vừa học vừa chơi hào hứng
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onOpenGamesBank();
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-sky-50 text-sky-700 font-extrabold text-xs sm:text-sm border-2 border-sky-100 hover:border-sky-300 shadow-xs hover:shadow-md transition-all self-start sm:self-auto cursor-pointer group"
          >
            <span>Xem tất cả kho trò chơi</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-sky-600" />
          </button>
        </div>

        {/* Category & Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveFilterTab('all');
            }}
            className={`px-3.5 py-2 rounded-2xl font-black text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
              activeFilterTab === 'all'
                ? 'bg-rose-500 text-white shadow-rose-300 ring-2 ring-rose-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:text-slate-900'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${activeFilterTab === 'all' ? 'fill-current' : ''}`} />
            <span>Tất cả gợi ý</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeFilterTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {visibleGamesList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveFilterTab('favorite');
            }}
            className={`px-3.5 py-2 rounded-2xl font-black text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
              activeFilterTab === 'favorite'
                ? 'bg-rose-500 text-white shadow-rose-300 ring-2 ring-rose-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:text-slate-900'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${activeFilterTab === 'favorite' ? 'fill-current text-white' : 'text-rose-500'}`} />
            <span>Yêu thích</span>
            {favoriteGames.length > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeFilterTab === 'favorite' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {favoriteGames.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveFilterTab('letters');
            }}
            className={`px-3.5 py-2 rounded-2xl font-black text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
              activeFilterTab === 'letters'
                ? 'bg-rose-500 text-white shadow-rose-300 ring-2 ring-rose-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Chữ cái</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveFilterTab('math');
            }}
            className={`px-3.5 py-2 rounded-2xl font-black text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
              activeFilterTab === 'math'
                ? 'bg-rose-500 text-white shadow-rose-300 ring-2 ring-rose-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:text-slate-900'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Làm quen với toán</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveFilterTab('explore');
            }}
            className={`px-3.5 py-2 rounded-2xl font-black text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
              activeFilterTab === 'explore'
                ? 'bg-rose-500 text-white shadow-rose-300 ring-2 ring-rose-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Khám phá xung quanh</span>
          </button>
        </div>

        {/* Games Showcase Grid */}
        {displayedShowcaseGames.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {paginatedGames.map((game) => {
                const isFav = favoriteIds.includes(game.id);
                const isPinnedBanner = game.id === featuredId;
                const isPinnedHomepage = adminHomepageIds.includes(game.id);

                return (
                  <div
                    key={game.id}
                    className="group bg-white rounded-3xl border-2 border-slate-100 hover:border-pink-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1"
                  >
                    {/* Card Cover Illustration */}
                    <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                      <GameCoverIllustration
                        game={game}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Gradient overlay for readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-black/20 pointer-events-none" />

                      {/* Category Badge top-left */}
                      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider text-sky-900 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full shadow-xs border border-white/60">
                          {game.category || 'Mầm non'}
                        </span>
                        {isPinnedHomepage && !isPinnedBanner && (
                          <span
                            className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50/95 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-xs border border-rose-200 flex items-center gap-1"
                            title="Trò chơi được Quản trị viên chọn hiển thị trang chủ"
                          >
                            <Sparkles className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                            <span>Gợi ý nổi bật</span>
                          </span>
                        )}
                      </div>

                      {/* Actions top-right: Heart + Star */}
                      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                        {isPinnedBanner && (
                          <span
                            className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[10px] flex items-center gap-1 shadow-xs border border-amber-300"
                            title="Trò chơi này đang ghim trên banner chính"
                          >
                            <Star className="w-3 h-3 fill-amber-950" />
                            <span>Banner</span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(game, e)}
                          className={`p-1.5 rounded-full backdrop-blur-xs transition cursor-pointer shadow-xs active:scale-90 ${
                            isFav
                              ? 'bg-white text-rose-500 ring-2 ring-rose-300'
                              : 'bg-white/85 hover:bg-white text-slate-400 hover:text-rose-500'
                          }`}
                          title={isFav ? 'Bỏ thích' : 'Thêm vào yêu thích'}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>
                      </div>

                      {/* Info badges bottom */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between text-[10px] font-black text-white">
                        <span className="bg-slate-900/75 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/20 flex items-center gap-1 shadow-xs">
                          <BookOpen className="w-3 h-3 text-indigo-300" />
                          <span>{game.questions?.length || 0} câu hỏi</span>
                        </span>
                        <span className="bg-slate-900/75 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/20 shadow-xs">
                          {game.targetAge || '5 - 6 tuổi'}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3
                          className="text-base font-black text-slate-900 group-hover:text-pink-600 transition-colors leading-snug line-clamp-1 cursor-pointer"
                          onClick={() => {
                            sounds.playCorrect();
                            onQuickPlay(game);
                          }}
                          title={game.title}
                        >
                          {game.title}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {game.description || 'Trò chơi tương tác mầm non trực quan, giúp các bé làm quen bài học hào hứng.'}
                        </p>
                      </div>

                      {/* Card Actions Bottom */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playCorrect();
                            onQuickPlay(game);
                          }}
                          className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 active:scale-[0.98] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/25 transition cursor-pointer"
                          title={`Chơi ngay trò chơi ${game.title}`}
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>CHƠI NGAY</span>
                        </button>

                        {/* Quick Pin to Banner button */}
                        {!isPinnedBanner && (
                          <button
                            type="button"
                            onClick={(e) => handlePinToBanner(game, e)}
                            className="p-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition cursor-pointer active:scale-95"
                            title="Ghim trò chơi này lên banner trang chủ"
                          >
                            <Star className="w-4 h-4 text-amber-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls when games exceed 8 per page */}
            {totalPages > 1 && (
              <div className="mt-6 pt-5 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs font-bold text-slate-500">
                  Hiển thị <span className="text-slate-800 font-black">{(currentPage - 1) * GAMES_PER_PAGE + 1} - {Math.min(displayedShowcaseGames.length, currentPage * GAMES_PER_PAGE)}</span> trên tổng số <span className="text-slate-800 font-black">{displayedShowcaseGames.length}</span> trò chơi
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => {
                      sounds.playClick();
                      setCurrentPage((prev) => Math.max(1, prev - 1));
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition ${
                      currentPage === 1
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        : 'bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 shadow-2xs cursor-pointer'
                    }`}
                    title="Trang trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Trước</span>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setCurrentPage(pageNum);
                      }}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center ${
                        pageNum === currentPage
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      sounds.playClick();
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition ${
                      currentPage === totalPages
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        : 'bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 shadow-2xs cursor-pointer'
                    }`}
                    title="Trang sau"
                  >
                    <span className="hidden sm:inline">Sau</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border-2 border-dashed border-slate-200 max-w-md mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3.5 text-2xl shadow-inner">
              {activeFilterTab === 'favorite' ? '❤️' : '🔍'}
            </div>
            <h3 className="font-black text-lg text-slate-800">
              {activeFilterTab === 'favorite'
                ? 'Chưa có trò chơi yêu thích nào'
                : 'Không tìm thấy trò chơi phù hợp'}
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1.5 leading-relaxed">
              {activeFilterTab === 'favorite'
                ? 'Hãy bấm vào biểu tượng trái tim ❤️ ở bất kỳ trò chơi nào để lưu lại danh sách yêu thích của cô và bé nhé!'
                : 'Cô hãy thử chuyển sang chủ đề khác hoặc vào Kho trò chơi để xem đầy đủ nhé.'}
            </p>
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setActiveFilterTab('all');
              }}
              className="mt-4 px-5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs shadow-md shadow-rose-200 transition cursor-pointer"
            >
              Xem tất cả gợi ý
            </button>
          </div>
        )}
      </section>

      {/* Floating Toast Feedback */}
      {toastFeedback && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-slate-900/90 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2.5 shadow-2xl backdrop-blur-md border border-white/20 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastFeedback}</span>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: CHỌN TRÒ CHƠI NỔI BẬT ĐỂ HIỂN THỊ TRÊN BANNER */}
      {/* ---------------------------------------------------- */}
      {isSelectFeaturedModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border-2 border-slate-200 flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-400 to-pink-500 p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg">
                  ⭐
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg">
                    Chọn trò chơi nổi bật trên trang chủ
                  </h3>
                  <p className="text-xs font-semibold text-amber-100">
                    Trò chơi được chọn sẽ xuất hiện nổi bật tại góc banner chính
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSelectFeaturedModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search filter */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={featuredSearch}
                  onChange={(e) => setFeaturedSearch(e.target.value)}
                  placeholder="Tìm kiếm trò chơi để ghim nổi bật..."
                  className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Games List to pick from */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
              {filteredGamesForModal.length === 0 ? (
                <div className="text-center py-8 text-xs font-bold text-slate-400">
                  Không tìm thấy trò chơi nào phù hợp
                </div>
              ) : (
                filteredGamesForModal.map((g) => {
                  const isCurrent = g.id === featuredId;

                  return (
                    <div
                      key={g.id}
                      className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-amber-50/80 border-amber-400 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div
                        onClick={() => handleSelectFeatured(g)}
                        className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                          g.theme === 'rose'
                            ? 'bg-rose-100 text-rose-600'
                            : g.theme === 'cyan'
                            ? 'bg-cyan-100 text-cyan-600'
                            : 'bg-amber-100 text-amber-600'
                        }`}>
                          {g.category === 'Làm quen với toán' ? '🔢' : '🔤'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sm text-slate-900 truncate">
                            {g.title}
                          </h4>
                          <span className="text-[11px] font-bold text-slate-400 block mt-0.5">
                            {g.category} · {g.targetAge || '5 - 6 tuổi'} · {g.questions?.length || 0} câu
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <span className="px-3 py-1.5 rounded-full bg-amber-400 text-white font-black text-xs flex items-center gap-1 shadow-2xs">
                            <Check className="w-3.5 h-3.5" />
                            <span>Đang nổi bật</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelectFeatured(g)}
                            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 font-extrabold text-xs transition cursor-pointer flex items-center gap-1"
                          >
                            <Star className="w-3.5 h-3.5 text-amber-500" />
                            <span>Ghim banner</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsSelectFeaturedModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select Room Type Modal (Option 1: Standard Room vs Option 2: Dual Question Set Room) */}
      <SelectRoomTypeModal
        isOpen={isSelectRoomTypeModalOpen}
        onClose={() => setIsSelectRoomTypeModalOpen(false)}
        onSelectNormalRoom={() => {
          setIsSelectRoomTypeModalOpen(false);
          onOpenGamesBank();
        }}
        onSelectDualRoom={() => {
          setIsSelectRoomTypeModalOpen(false);
          if (onCreateDualRoom) onCreateDualRoom();
        }}
      />
    </div>
  );
};
