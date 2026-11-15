import React, { useState, useEffect, useMemo } from 'react';
import {
  Gamepad2,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Heart,
  BookOpen,
  Compass,
  Play,
  Star,
} from 'lucide-react';
import { sounds } from '../utils/sound';
import { Game } from '../types/game';
import {
  getAllGames,
  subscribeGames,
  isGameVisibleToUser,
  getFeaturedGameId,
  setFeaturedGameId,
  subscribeFeaturedGame,
  getFavoriteGameIds,
  toggleFavoriteGameId,
  subscribeFavorites,
  getAdminHomepageGameIds,
  subscribeAdminHomepageGames,
} from '../services/gameStorage';
import { useAuth } from '../context/AuthContext';
import { GameCoverIllustration } from '../components/games/GameCoverIllustration';

interface HomePageProps {
  onQuickPlay: (game: Game) => void;
  onOpenGamesBank: () => void;
  onCreateGame: () => void;
  onCreateDualRoom?: () => void;
  onJoinRoom: () => void;
  onOpenQRQuiz?: (tab?: 'host' | 'students' | 'print' | 'bank' | 'history') => void;
  onViewHistory: () => void;
  onOpenProfile?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onQuickPlay,
  onOpenGamesBank,
  onCreateDualRoom,
  onOpenQRQuiz,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const [games, setGames] = useState<Game[]>(() => getAllGames());
  const [featuredBannerId, setFeaturedBannerIdState] = useState<string>(() => getFeaturedGameId());
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => getFavoriteGameIds());
  const [adminPinnedIds, setAdminPinnedIds] = useState<string[]>(() => getAdminHomepageGameIds());
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'favorites' | 'letters' | 'math' | 'explore'>('all');

  useEffect(() => {
    const unsubGames = subscribeGames((updated) => setGames(updated));
    const unsubFeatured = subscribeFeaturedGame((id) => setFeaturedBannerIdState(id));
    const unsubFavs = subscribeFavorites((ids) => setFavoriteIds(ids));
    const unsubPinned = subscribeAdminHomepageGames((ids) => setAdminPinnedIds(ids));
    return () => {
      unsubGames();
      unsubFeatured();
      unsubFavs();
      unsubPinned();
    };
  }, []);

  // Filter visible games
  const visibleGames = useMemo(
    () => games.filter((g) => isGameVisibleToUser(g, currentUser, isAdmin)),
    [games, currentUser, isAdmin]
  );

  // Helper to check if a game is the active Banner game
  const isBannerGame = (gameId: string) => {
    if (gameId === featuredBannerId) return true;
    if (featuredBannerId === 'game_chu_h_k' && gameId === 'game_hk_mam_non') return true;
    return false;
  };

  // Helper to check if a game is pinned as "Gợi ý nổi bật"
  const isHighlightedSuggestion = (gameId: string) => {
    return (
      adminPinnedIds.includes(gameId) ||
      gameId === 'game_html_u_uw_nghe_nghiep' ||
      gameId === 'game_chu_u_u'
    );
  };

  // Curated & sorted games for "Trò chơi nổi bật & Được yêu thích"
  const curatedGames = useMemo(() => {
    const priorityOrder = [
      'game_chu_h_k',
      'game_hk_mam_non',
      'game_html_u_uw_nghe_nghiep',
      'game_chu_u_u',
      'game_keo_tha_o_chu_mau',
      'game_toan_1_5',
      'game_a_aw_aa',
    ];
    const quickStripIds = new Set([
      'game_tim_chu_cai',
      'game_keo_tha_vao_o',
      'game_dua_xe_tri_thuc',
      'game_nhan_biet_hinh_dang',
      'game_con_vat_quanh_be',
      'game_vong_quay_may_man',
    ]);

    // Filter out the old 6-card mockup placeholders unless explicitly pinned/favorited
    const pool = visibleGames.filter(
      (g) => !quickStripIds.has(g.id) || adminPinnedIds.includes(g.id) || favoriteIds.includes(g.id)
    );
    const baseList = pool.length > 0 ? pool : visibleGames;

    // Deduplicate if both legacy 'game_chu_h_k' and 'game_hk_mam_non' exist in localStorage
    const hasLegacyHK = baseList.some((g) => g.id === 'game_chu_h_k');
    const deduped = baseList.filter((g) => !(hasLegacyHK && g.id === 'game_hk_mam_non'));

    return [...deduped].sort((a, b) => {
      const aBanner = isBannerGame(a.id) ? 1 : 0;
      const bBanner = isBannerGame(b.id) ? 1 : 0;
      if (aBanner !== bBanner) return bBanner - aBanner;

      const aIdx = priorityOrder.indexOf(a.id);
      const bIdx = priorityOrder.indexOf(b.id);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;

      const aPinned = isHighlightedSuggestion(a.id) ? 1 : 0;
      const bPinned = isHighlightedSuggestion(b.id) ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;

      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [visibleGames, featuredBannerId, adminPinnedIds, favoriteIds]);

  const filteredCuratedGames = useMemo(() => {
    return curatedGames.filter((g) => {
      if (featuredFilter === 'favorites') {
        return favoriteIds.includes(g.id);
      }
      const cat = (g.category || '').toLowerCase();
      const title = (g.title || '').toLowerCase();
      if (featuredFilter === 'letters') {
        return cat.includes('chữ') || title.includes('chữ');
      }
      if (featuredFilter === 'math') {
        return cat.includes('toán') || cat.includes('số') || title.includes('đếm') || title.includes('số');
      }
      if (featuredFilter === 'explore') {
        return (
          !cat.includes('chữ') &&
          !cat.includes('toán') &&
          !cat.includes('số') &&
          !title.includes('chữ') &&
          !title.includes('đếm')
        );
      }
      return true;
    });
  }, [curatedGames, featuredFilter, favoriteIds]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 select-none text-[#10234D]">
      {/* ================= 1. BANNER CHÍNH (SCREEN 1) ================= */}
      <div className="relative rounded-2xl sm:rounded-3xl border border-[#BAE6FD]/80 mb-5 overflow-hidden shadow-xs">
        <img
          src="/assets/aistudio/banner_compact_clean.png"
          alt="Cùng nhau khám phá và học thật vui - Thế giới học mầm non"
          referrerPolicy="no-referrer"
          className="w-full h-auto block object-contain"
        />
      </div>

      {/* ================= 2. HAI CARD CHỨC NĂNG NGANG ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
        {/* Card 1: Tạo phòng chơi trực tuyến (Nền xanh nhạt #EFF8FF) */}
        <div
          onClick={() => {
            sounds.playClick();
            if (onCreateDualRoom) onCreateDualRoom();
          }}
          className="bg-[#EFF8FF] border border-[#BAE6FD] hover:border-[#087CF5]/60 rounded-2xl p-5 sm:p-6 flex items-center justify-between shadow-2xs hover:shadow-sm transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#087CF5] text-white flex items-center justify-center text-2xl shadow-2xs group-hover:scale-105 transition-transform shrink-0">
              <Gamepad2 className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#10234D] group-hover:text-[#087CF5] transition-colors leading-snug">
                Tạo phòng chơi trực tuyến
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Chế độ 1 bộ đề hoặc 2 bộ đề A/B cho cả lớp
              </p>
            </div>
          </div>

          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#087CF5] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:translate-x-1 transition-all">
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        {/* Card 2: Quét mã QR giấy (Nền hồng nhạt #FFF0F6) */}
        <div
          onClick={() => {
            sounds.playClick();
            if (onOpenQRQuiz) onOpenQRQuiz('host');
          }}
          className="bg-[#FFF0F6] border border-[#FED7E2] hover:border-[#FF2780]/60 rounded-2xl p-5 sm:p-6 flex items-center justify-between shadow-2xs hover:shadow-sm transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#FF2780] text-white flex items-center justify-center text-2xl shadow-2xs group-hover:scale-105 transition-transform shrink-0">
              <QrCode className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#10234D] group-hover:text-[#FF2780] transition-colors leading-snug">
                Quét mã QR giấy
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Bé cầm bảng thẻ xoay A-B-C-D, cô quét camera
              </p>
            </div>
          </div>

          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#FF2780] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:translate-x-1 transition-all">
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* ================= 3. TRÒ CHƠI NỔI BẬT & ĐƯỢC YÊU THÍCH ================= */}
      <section className="mb-10">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0F6] border border-[#FED7E2] text-[#FF2780] text-xs font-extrabold mb-2">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Gợi ý cho cô và bé</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#10234D] tracking-tight flex items-center gap-2">
              <span>Trò chơi nổi bật & Được yêu thích</span>
              <span className="text-2xl">✨</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Những bộ trò chơi giáo dục mầm non sinh động, trực quan giúp bé vừa học vừa chơi hào hứng
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onOpenGamesBank();
            }}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-sky-50 border border-slate-200/90 text-[#087CF5] font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition cursor-pointer self-start md:self-auto shrink-0 group"
          >
            <span>Xem tất cả kho trò chơi</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center flex-wrap gap-2.5 mb-6">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setFeaturedFilter('all');
            }}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-extrabold flex items-center gap-2 transition cursor-pointer ${
              featuredFilter === 'all'
                ? 'bg-[#FF2780] text-white shadow-sm shadow-[#FF2780]/25'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tất cả gợi ý</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                featuredFilter === 'all'
                  ? 'bg-white/25 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {curatedGames.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setFeaturedFilter('favorites');
            }}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer ${
              featuredFilter === 'favorites'
                ? 'bg-[#FF2780] text-white shadow-sm shadow-[#FF2780]/25'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${featuredFilter === 'favorites' ? 'fill-current' : 'text-[#FF2780]'}`} />
            <span>Yêu thích</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setFeaturedFilter('letters');
            }}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer ${
              featuredFilter === 'letters'
                ? 'bg-[#FF2780] text-white shadow-sm shadow-[#FF2780]/25'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Chữ cái</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setFeaturedFilter('math');
            }}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer ${
              featuredFilter === 'math'
                ? 'bg-[#FF2780] text-white shadow-sm shadow-[#FF2780]/25'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Làm quen với toán</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setFeaturedFilter('explore');
            }}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer ${
              featuredFilter === 'explore'
                ? 'bg-[#FF2780] text-white shadow-sm shadow-[#FF2780]/25'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Khám phá xung quanh</span>
          </button>
        </div>

        {/* 4-Column Rich Game Cards Grid */}
        {filteredCuratedGames.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80">
            <p className="text-sm font-bold text-slate-500">
              Chưa có trò chơi nào trong danh mục này.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredCuratedGames.map((game) => {
              const isBanner = isBannerGame(game.id);
              const isHighlighted = !isBanner && isHighlightedSuggestion(game.id);
              const isFav = favoriteIds.includes(game.id);
              const categoryLabel = (game.category || 'CHỮ CÁI')
                .replace(/^Làm quen chữ cái$/i, 'CHỮ CÁI')
                .toUpperCase();
              const ageLabel = game.targetAge || '5 – 6 tuổi';
              const qCount = game.questions?.length || 1;

              return (
                <div
                  key={game.id}
                  onClick={() => {
                    sounds.playCorrect();
                    onQuickPlay(game);
                  }}
                  className="bg-white rounded-3xl border border-slate-200/80 hover:border-[#FF2780]/50 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col overflow-hidden group"
                >
                  {/* Top Illustration Container */}
                  <div className="relative h-44 m-2.5 mb-0 rounded-2xl overflow-hidden bg-slate-100">
                    <GameCoverIllustration game={game} />

                    {/* Top-left Category & Banner/Featured Badges */}
                    <div className="absolute top-2.5 left-2.5 right-10 flex items-center flex-wrap gap-1.5 z-10 pointer-events-none">
                      <span className="px-2.5 py-1 rounded-full bg-white/95 text-[#10234D] text-[10px] font-black uppercase tracking-wider shadow-xs">
                        {categoryLabel}
                      </span>

                      {isBanner && (
                        <span className="px-2.5 py-1 rounded-full bg-[#FBBF24] text-slate-900 text-[10px] font-black flex items-center gap-1 shadow-xs">
                          <Star className="w-3 h-3 fill-slate-900 text-slate-900" />
                          <span>Banner</span>
                        </span>
                      )}

                      {isHighlighted && (
                        <span className="px-2.5 py-1 rounded-full bg-[#FFF0F6] border border-[#FED7E2] text-[#FF2780] text-[10px] font-black flex items-center gap-1 shadow-xs">
                          <Sparkles className="w-3 h-3 fill-current" />
                          <span>GỢI Ý NỔI BẬT</span>
                        </span>
                      )}
                    </div>

                    {/* Top-right Favorite Heart Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playClick();
                        toggleFavoriteGameId(game.id);
                      }}
                      title={isFav ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-xs transition z-10 cursor-pointer"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          isFav ? 'fill-[#FF2780] text-[#FF2780]' : 'text-slate-600'
                        }`}
                      />
                    </button>

                    {/* Bottom-left Question Count Badge */}
                    <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full bg-slate-900/75 backdrop-blur-xs text-white text-[11px] font-bold flex items-center gap-1 z-10 pointer-events-none">
                      <BookOpen className="w-3 h-3 text-sky-300" />
                      <span>{qCount} câu hỏi</span>
                    </div>

                    {/* Bottom-right Target Age Badge */}
                    <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-slate-900/75 backdrop-blur-xs text-white text-[11px] font-bold z-10 pointer-events-none">
                      {ageLabel}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-[#10234D] group-hover:text-[#FF2780] transition-colors line-clamp-1">
                        {game.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {game.description || 'Trò chơi tương tác giáo dục mầm non sinh động cho bé'}
                      </p>
                    </div>

                    {/* Action Row */}
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          sounds.playCorrect();
                          onQuickPlay(game);
                        }}
                        className="flex-1 py-2.5 px-4 rounded-full bg-gradient-to-r from-[#FF2780] to-[#F43F5E] hover:opacity-95 text-white font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>CHƠI NGAY</span>
                      </button>

                      {!isBanner && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            sounds.playClick();
                            setFeaturedGameId(game.id);
                          }}
                          title="Đặt làm trò chơi nổi bật đầu trang"
                          className="w-9 h-9 rounded-full border border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-amber-500 flex items-center justify-center shrink-0 transition cursor-pointer"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ================= 5. BĂNG CAM KẾT: VÌ SAO CHỌN VUI HỌC CÙNG CÔ ================= */}
      <div className="rounded-2xl bg-[#EFF8FF] border border-[#BAE6FD]/80 p-3.5 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="font-extrabold text-[#087CF5] flex items-center gap-1.5 shrink-0">
          <span>Vì sao chọn Vui học cùng cô?</span>
        </div>

        <div className="flex items-center flex-wrap gap-4 sm:gap-6 text-slate-700 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
            <span>Trò chơi tương tác, sinh động</span>
          </div>

          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
            <span>Dễ sử dụng, phù hợp mầm non</span>
          </div>

          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
            <span>Hỗ trợ dạy học hiệu quả</span>
          </div>
        </div>
      </div>
    </div>
  );
};
