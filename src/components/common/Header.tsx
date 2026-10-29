import React, { useState, useRef, useEffect } from 'react';
import {
  Home,
  Users,
  Gamepad2,
  ChevronDown,
  User as UserIcon,
  Shield,
  Crown,
  BookOpen,
  Trophy,
  LogOut,
  Settings,
  Sparkles,
  Menu,
  X,
  GraduationCap,
  PlusCircle,
  Hash,
} from 'lucide-react';
import { SoundToggle } from './SoundToggle';
import { sounds } from '../../utils/sound';
import { useAuth } from '../../context/AuthContext';
import { TeacherAuthModal } from '../auth/TeacherAuthModal';
import { getPendingApprovalGames, getMyGames, subscribeGames } from '../../services/gameStorage';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  currentView?: string;
  onBack?: () => void;
  onHome?: () => void;
  onOpenGamesBank?: () => void;
  onCreateRoom?: () => void;
  onCreateDefaultRoom?: () => void;
  onCreateDualRoom?: () => void;
  onJoinRoom?: () => void;
  onOpenAdminPortal?: () => void;
  onOpenProfile?: (tab?: 'games' | 'history' | 'info' | 'password') => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  currentView = 'home',
  onHome,
  onOpenGamesBank,
  onCreateRoom,
  onCreateDefaultRoom,
  onCreateDualRoom,
  onJoinRoom,
  onOpenAdminPortal,
  onOpenProfile,
  rightAction,
}) => {
  const { currentUser, role, quota, isAdmin, isPremium, isMember, signOut } = useAuth();

  // Modals & Dropdown states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(() => getPendingApprovalGames().length);
  const [myGamesCount, setMyGamesCount] = useState<number>(0);

  const roomDropdownRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  // Sync pending approvals count and my games count
  useEffect(() => {
    const updateCounts = () => {
      setPendingCount(getPendingApprovalGames().length);
      if (currentUser?.email) {
        setMyGamesCount(getMyGames(currentUser.email).length);
      }
    };
    updateCounts();
    const unsub = subscribeGames(updateCounts);
    return () => unsub();
  }, [currentUser]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (roomDropdownRef.current && !roomDropdownRef.current.contains(target)) {
        setIsRoomDropdownOpen(false);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(target)) {
        setIsAccountDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoClick = () => {
    sounds.playClick();
    if (onHome) onHome();
  };

  const handleSelectDefaultRoom = () => {
    sounds.playClick();
    setIsRoomDropdownOpen(false);
    if (onCreateDefaultRoom) {
      onCreateDefaultRoom();
    } else if (onCreateRoom) {
      onCreateRoom();
    }
  };

  const handleSelectDualRoom = () => {
    sounds.playClick();
    setIsRoomDropdownOpen(false);
    if (onCreateDualRoom) {
      onCreateDualRoom();
    }
  };

  const handleNavigateProfile = (tab?: 'games' | 'history' | 'info' | 'password') => {
    sounds.playClick();
    setIsAccountDropdownOpen(false);
    if (onOpenProfile) {
      onOpenProfile(tab);
    }
  };

  const handleSignOut = async () => {
    sounds.playClick();
    setIsAccountDropdownOpen(false);
    if (window.confirm('Cô có chắc chắn muốn đăng xuất tài khoản này không?')) {
      await signOut();
      if (onHome) onHome();
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 transition-all select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-[68px] flex items-center justify-between gap-3">
        {/* ================= LEFT: LOGO ================= */}
        <button
          type="button"
          onClick={handleLogoClick}
          className="flex items-center gap-2.5 text-left group cursor-pointer hover:opacity-95 active:scale-98 transition focus:outline-none shrink-0"
          title="Về trang chủ Vui Học Cùng Cô"
        >
          {/* Friendly Sun Mascot Icon from mockup */}
          <img
            src="/assets/aistudio/logo_sun.png"
            alt="Logo Mặt Trời"
            className="w-9 h-9 sm:w-11 sm:h-11 object-contain drop-shadow-xs group-hover:scale-105 transition-transform shrink-0"
          />

          <div>
            <div className="flex items-center font-black text-lg sm:text-2xl tracking-tight leading-tight">
              <span className="text-[#0284c7]">Vui Học </span>
              <span className="text-[#f43f5e] ml-1">Cùng </span>
              <span className="text-[#059669] ml-1">Cô</span>
              <span className="text-[#f43f5e] ml-1 text-sm sm:text-base">❤</span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 leading-none hidden xs:block">
              Trò chơi tương tác mầm non
            </p>
          </div>
        </button>

        {/* ================= CENTER: NAVIGATION MENU (Desktop & Mobile matching image_09e49f55) ================= */}
        {/* ================= CENTER: NAVIGATION MENU ================= */}
        <nav className="flex items-center gap-1 sm:gap-2 p-0.5">
          {/* Nút Quay về Trang chủ (chỉ hiện khi đang ở trang khác) */}
          {onHome && currentView !== 'home' && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onHome();
              }}
              className="flex items-center justify-center px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full font-black text-xs sm:text-sm transition cursor-pointer gap-1.5 shrink-0 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200/80 shadow-2xs"
              title="Quay lại Trang chủ"
            >
              <Home className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="whitespace-nowrap">Trang chủ</span>
            </button>
          )}

          {/* 1. Kho trò chơi */}
          {onOpenGamesBank && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onOpenGamesBank();
              }}
              className={`flex items-center justify-center px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full font-black text-xs sm:text-sm transition cursor-pointer gap-1.5 shrink-0 ${
                currentView === 'games_list'
                  ? 'bg-purple-100 text-purple-800 shadow-xs ring-1 ring-purple-300'
                  : 'text-slate-700 hover:text-purple-700 hover:bg-purple-50'
              }`}
              title="Kho trò chơi"
            >
              <Gamepad2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-purple-600 shrink-0" />
              <span className="whitespace-nowrap">Kho trò chơi</span>
            </button>
          )}

          {/* 2. Tạo phòng chơi (Dropdown: Tiêu chuẩn / 2 bộ đề) */}
          {(onCreateRoom || onCreateDefaultRoom || onCreateDualRoom) && (
            <div ref={roomDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setIsRoomDropdownOpen((prev) => !prev);
                }}
                className={`flex items-center justify-center px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full font-black text-xs sm:text-sm transition cursor-pointer gap-1.5 shrink-0 ${
                  isRoomDropdownOpen || currentView === 'host'
                    ? 'bg-emerald-100 text-emerald-800 shadow-xs ring-1 ring-emerald-300'
                    : 'text-slate-700 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
                title="Tạo phòng thi đấu"
              >
                <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-600 shrink-0" />
                <span className="whitespace-nowrap">Tạo phòng</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                    isRoomDropdownOpen ? 'rotate-180 text-emerald-700' : ''
                  }`}
                />
              </button>

              {/* Room Type Dropdown Menu */}
              {isRoomDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-scale-up">
                  <button
                    type="button"
                    onClick={handleSelectDefaultRoom}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-sky-50 text-slate-800 transition flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-base shrink-0 transition-colors">
                      🎮
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-xs text-slate-900 group-hover:text-blue-700">
                        Phòng chơi tiêu chuẩn
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tổ chức 1 bộ câu hỏi cho cả lớp
                      </p>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={handleSelectDualRoom}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-purple-50 text-slate-800 transition flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center text-base shrink-0 transition-colors">
                      ⚡
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-xs text-slate-900 group-hover:text-purple-700 flex items-center justify-between">
                        <span>Phòng chơi 2 bộ đề</span>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950">
                          Mới
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Chia đội chơi 2 bộ câu hỏi song song
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. Tham gia phòng */}
          {onJoinRoom && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onJoinRoom();
              }}
              className={`flex items-center justify-center px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full font-black text-xs sm:text-sm transition cursor-pointer gap-1.5 shrink-0 ${
                currentView === 'player'
                  ? 'bg-emerald-100 text-emerald-800 shadow-xs ring-1 ring-emerald-300'
                  : 'text-slate-700 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
              title="Tham gia phòng thi đấu"
            >
              <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-600 shrink-0" />
              <span className="whitespace-nowrap">Tham gia phòng</span>
            </button>
          )}

          {/* 4. Cổng Quản Trị (Chỉ hiển thị cho Admin) */}
          {isAdmin && onOpenAdminPortal && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onOpenAdminPortal();
              }}
              className={`flex items-center justify-center px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full font-black text-xs sm:text-sm transition cursor-pointer gap-1.5 shrink-0 ${
                currentView === 'admin_dashboard'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
              title="Cổng quản trị"
            >
              <Shield className="w-4 h-4 fill-current text-rose-500 shrink-0" />
              <span className="whitespace-nowrap hidden sm:inline">Quản trị</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          )}
        </nav>

        {/* ================= RIGHT: SOUND & USER ACCOUNT DROPDOWN ================= */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {rightAction}

          {/* Sound Toggle */}
          <SoundToggle />

          {/* User Account / Profile Dropdown matching mockup */}
          {currentUser ? (
            <div ref={accountDropdownRef} className="relative">
            {/* Account Trigger Button */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setIsAccountDropdownOpen((prev) => !prev);
              }}
              className={`pl-1.5 pr-3 py-1 rounded-full flex items-center gap-2.5 border transition active:scale-95 cursor-pointer shadow-xs ${
                isAccountDropdownOpen
                  ? 'bg-slate-50 border-purple-300 ring-2 ring-purple-100'
                  : 'bg-white hover:bg-slate-50 border-slate-200'
              }`}
              title={`Tài khoản: ${currentUser ? currentUser.fullName : 'Cô Mai Linh'}. Bấm để mở menu`}
              aria-haspopup="true"
              aria-expanded={isAccountDropdownOpen}
            >
              {/* Circular purple avatar with 'C' letter */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-xs shrink-0 ${
                  isAdmin
                    ? 'bg-rose-600 text-white'
                    : isPremium
                    ? 'bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950'
                    : 'bg-[#7c3aed] text-white'
                }`}
              >
                {isAdmin ? '👑' : isPremium ? '⭐' : (currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'C')}
              </div>

              <div className="text-left hidden sm:block max-w-[120px] md:max-w-[140px]">
                <span className="block font-black text-xs text-slate-800 truncate leading-tight">
                  {currentUser ? currentUser.fullName.replace(/\s*\(.*?\)\s*/g, '') : 'Cô Mai Linh'}
                </span>
                <span className="block text-[10px] font-bold text-slate-400 truncate leading-tight">
                  {isAdmin
                    ? 'Tổng Quản Trị'
                    : isPremium
                    ? 'VIP Premium'
                    : 'Giáo viên'}
                </span>
              </div>

              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                  isAccountDropdownOpen ? 'rotate-180 text-purple-600' : ''
                }`}
              />
            </button>

              {/* Account Dropdown Menu */}
              {isAccountDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-2.5 z-50 animate-scale-up">
                  {/* User Profile Header Card */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/40 border border-slate-100 mb-2">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-black shadow-xs shrink-0 ${
                          isAdmin
                            ? 'bg-rose-600 text-white ring-2 ring-rose-200'
                            : isPremium
                            ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-200'
                            : 'bg-indigo-600 text-white ring-2 ring-indigo-200'
                        }`}
                      >
                        {isAdmin ? '👑' : isPremium ? '⭐' : currentUser.fullName.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-black text-sm text-slate-900 truncate">
                            {currentUser.fullName}
                          </h4>
                          {isPremium && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 shrink-0">
                              VIP
                            </span>
                          )}
                          {isAdmin && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-rose-600 text-white shrink-0">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>

                    {/* Role quota description */}
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-500">Hạn mức tài khoản:</span>
                      <span className="font-extrabold text-indigo-700">
                        {quota.maxQuestionsPerGame === Infinity
                          ? 'VIP: Không giới hạn'
                          : `${quota.maxQuestionsPerGame} câu / bộ`}
                      </span>
                    </div>
                  </div>

                  {/* Dropdown Navigation Actions */}
                  <div className="space-y-1">
                    {/* 1. Trang cá nhân tổng quan */}
                    <button
                      type="button"
                      onClick={() => handleNavigateProfile('info')}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 transition flex items-center gap-2.5 cursor-pointer font-bold text-xs"
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                        <UserIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block font-black text-slate-800">Trang cá nhân của cô</span>
                        <span className="block text-[10px] text-slate-400 font-normal">
                          Xem thông tin cá nhân & đổi mật khẩu
                        </span>
                      </div>
                    </button>

                    {/* 2. Kho câu hỏi đã tạo */}
                    <button
                      type="button"
                      onClick={() => handleNavigateProfile('games')}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 transition flex items-center gap-2.5 cursor-pointer font-bold text-xs"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0 flex items-center justify-between">
                        <div>
                          <span className="block font-black text-slate-800">Bộ câu hỏi đã tạo</span>
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Quản lý các trò chơi do cô tạo
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600">
                          {myGamesCount}
                        </span>
                      </div>
                    </button>

                    {/* 3. Lịch sử phòng thi đấu */}
                    <button
                      type="button"
                      onClick={() => handleNavigateProfile('history')}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 transition flex items-center gap-2.5 cursor-pointer font-bold text-xs"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <Trophy className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block font-black text-slate-800">Lịch sử phòng thi đấu</span>
                        <span className="block text-[10px] text-slate-400 font-normal">
                          Kết quả và danh sách đội vô địch
                        </span>
                      </div>
                    </button>

                    {/* 4. Admin Portal (if admin) */}
                    {isAdmin && onOpenAdminPortal && (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setIsAccountDropdownOpen(false);
                          onOpenAdminPortal();
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-rose-50 text-rose-800 transition flex items-center gap-2.5 cursor-pointer font-bold text-xs border border-rose-100"
                      >
                        <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                          <Shield className="w-3.5 h-3.5 fill-current" />
                        </div>
                        <div className="flex-1 min-w-0 flex items-center justify-between">
                          <div>
                            <span className="block font-black text-rose-900">Cổng Quản Trị Admin</span>
                            <span className="block text-[10px] text-rose-500 font-normal">
                              Quản lý tài khoản & duyệt đề
                            </span>
                          </div>
                          {pendingCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">
                              {pendingCount} chờ
                            </span>
                          )}
                        </div>
                      </button>
                    )}

                    {/* 5. Switch / Inspect account details modal */}
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setIsAccountDropdownOpen(false);
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 transition flex items-center gap-2.5 cursor-pointer font-bold text-xs"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <Settings className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block font-black text-slate-800">Chuyển đổi tài khoản</span>
                        <span className="block text-[10px] text-slate-400 font-normal">
                          Đăng nhập tài khoản khác
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Sign Out Button */}
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition flex items-center gap-2.5 cursor-pointer font-black text-xs"
                    >
                      <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Đăng xuất tài khoản</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Teacher Account Pill when not logged in yet (opens login modal) */
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setIsAuthModalOpen(true);
              }}
              className="pl-1.5 pr-3 py-1 rounded-full flex items-center gap-2.5 border border-slate-200 bg-white hover:bg-slate-50 transition active:scale-95 cursor-pointer shadow-xs"
              title="Đăng nhập tài khoản Giáo viên"
            >
              <div className="w-8 h-8 rounded-full bg-[#7c3aed] text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0">
                C
              </div>
              <div className="text-left hidden sm:block">
                <span className="block font-black text-xs text-slate-800 truncate leading-tight">
                  Cô Mai Linh
                </span>
                <span className="block text-[10px] font-bold text-slate-400 truncate leading-tight">
                  Giáo viên
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* Teacher Authentication & Account Modal */}
      <TeacherAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onOpenAdminPortal={onOpenAdminPortal}
        onOpenProfile={() => handleNavigateProfile('info')}
      />
    </header>
  );
};
