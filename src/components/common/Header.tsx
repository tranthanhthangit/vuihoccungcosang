import React, { useState, useRef, useEffect } from 'react';
import { Home, Users, Sparkles, ChevronDown, Gamepad2, Layers, User as UserIcon, Shield, Crown } from 'lucide-react';
import { SoundToggle } from './SoundToggle';
import { sounds } from '../../utils/sound';
import { useAuth } from '../../context/AuthContext';
import { TeacherAuthModal } from '../auth/TeacherAuthModal';
import { getPendingApprovalGames, subscribeGames } from '../../services/gameStorage';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onHome?: () => void;
  onCreateRoom?: () => void;
  onCreateDefaultRoom?: () => void;
  onCreateDualRoom?: () => void;
  onJoinRoom?: () => void;
  onOpenAdminPortal?: () => void;
  onOpenProfile?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  onHome,
  onCreateRoom,
  onCreateDefaultRoom,
  onCreateDualRoom,
  onJoinRoom,
  onOpenAdminPortal,
  onOpenProfile,
  rightAction,
}) => {
  const { user, currentUser, role, isAdmin, isPremium, isMember } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(() => getPendingApprovalGames().length);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeGames(() => {
      setPendingCount(getPendingApprovalGames().length);
    });
    return () => unsub();
  }, []);


  const handleLogoClick = () => {
    sounds.playClick();
    if (onHome) {
      onHome();
    }
  };

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimerRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 200);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const handleSelectDefaultRoom = () => {
    sounds.playClick();
    setIsDropdownOpen(false);
    if (onCreateDefaultRoom) {
      onCreateDefaultRoom();
    } else if (onCreateRoom) {
      onCreateRoom();
    }
  };

  const handleSelectDualRoom = () => {
    sounds.playClick();
    setIsDropdownOpen(false);
    if (onCreateDualRoom) {
      onCreateDualRoom();
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-2xs sticky top-0 z-40 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Clickable Logo matching the user image */}
        <button
          type="button"
          onClick={handleLogoClick}
          className="flex items-center gap-2.5 text-left group cursor-pointer hover:opacity-95 active:scale-98 transition focus:outline-none shrink-0"
          title="Về trang chủ Vui Học Cùng Cô"
        >
          {/* Friendly Sun Mascot Icon with smiling face and colorful rays */}
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
              {/* Sun rays */}
              <g className="animate-spin-slow origin-center">
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
                  const colors = ['#f59e0b', '#ef4444', '#f97316', '#eab308'];
                  const color = colors[i % colors.length];
                  return (
                    <circle
                      key={deg}
                      cx="50"
                      cy="12"
                      r="6.5"
                      fill={color}
                      transform={`rotate(${deg} 50 50)`}
                    />
                  );
                })}
              </g>
              {/* Sun Body */}
              <circle cx="50" cy="50" r="28" fill="#facc15" />
              <circle cx="50" cy="50" r="24" fill="#fbbf24" />
              {/* Cute smiling eyes */}
              <circle cx="41" cy="45" r="3.5" fill="#1e293b" />
              <circle cx="59" cy="45" r="3.5" fill="#1e293b" />
              <circle cx="42" cy="43.5" r="1.2" fill="#ffffff" />
              <circle cx="60" cy="43.5" r="1.2" fill="#ffffff" />
              {/* Rosy cheeks */}
              <circle cx="36" cy="52" r="3" fill="#f43f5e" opacity="0.6" />
              <circle cx="64" cy="52" r="3" fill="#f43f5e" opacity="0.6" />
              {/* Happy smile */}
              <path
                d="M 43 53 Q 50 61 57 53"
                stroke="#1e293b"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-1 font-black text-lg sm:text-xl tracking-tight leading-tight">
              <span className="text-blue-700">Vui Học</span>
              <span className="text-rose-500">Cùng</span>
              <span className="text-emerald-600">Cô</span>
              <span className="text-amber-400 text-sm sm:text-base">💛</span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 leading-none mt-0.5 hidden xs:block">
              Thế giới trò chơi mầm non
            </p>
          </div>
        </button>

        {/* Center: Top Menu Navigation with Dropdown on Hover for "Tạo phòng" */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {(onCreateRoom || onCreateDefaultRoom || onCreateDualRoom) && (
            <div
              ref={dropdownRef}
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setIsDropdownOpen(prev => !prev);
                }}
                className={`p-2 sm:px-4 sm:py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-md shadow-sky-200 hover:shadow-lg transition active:scale-95 cursor-pointer shrink-0 ${
                  isDropdownOpen ? 'ring-2 ring-sky-300 ring-offset-1' : ''
                }`}
                title="Tạo phòng chơi: Chọn phòng mặc định hoặc phòng 2 bộ đề"
                aria-haspopup="true"
                aria-expanded={isDropdownOpen}
              >
                <Home className="w-4 h-4 fill-current shrink-0" />
                <span className="whitespace-nowrap hidden sm:inline">Tạo phòng</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 hidden sm:inline ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Hover Dropdown Menu */}
              {isDropdownOpen && (
                <div
                  className="absolute top-full left-0 sm:left-1/2 sm:-translate-x-1/2 mt-1.5 w-64 sm:w-72 bg-white rounded-2xl shadow-2xl border-2 border-indigo-100 p-2 z-50 animate-scale-up"
                  style={{ transformOrigin: 'top center' }}
                >
                  {/* Invisible bridge to prevent hover loss */}
                  <div className="absolute -top-2 left-0 right-0 h-2 bg-transparent" />

                  {/* Option 1: Phòng chơi mặc định */}
                  <button
                    type="button"
                    onClick={handleSelectDefaultRoom}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-sky-50 text-slate-800 hover:text-blue-700 transition flex items-center gap-3 cursor-pointer group/item"
                  >
                    <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 group-hover/item:bg-blue-600 group-hover/item:text-white flex items-center justify-center text-lg shrink-0 transition-colors shadow-2xs">
                      🎮
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover/item:text-blue-700 flex items-center justify-between">
                        <span>Phòng chơi mặc định</span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-400 group-hover/item:text-slate-600 truncate mt-0.5">
                        Chơi 1 bộ câu hỏi tiêu chuẩn
                      </p>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  {/* Option 2: Phòng chơi 2 bộ đề */}
                  <button
                    type="button"
                    onClick={handleSelectDualRoom}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-purple-50 text-slate-800 hover:text-purple-700 transition flex items-center gap-3 cursor-pointer group/item"
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 group-hover/item:bg-gradient-to-r group-hover/item:from-purple-600 group-hover/item:to-pink-600 group-hover/item:text-white flex items-center justify-center text-lg shrink-0 transition-colors shadow-2xs">
                      ⚡
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover/item:text-purple-700 flex items-center justify-between">
                        <span>Phòng chơi 2 bộ đề</span>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900 shadow-2xs">
                          Mới
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-400 group-hover/item:text-slate-600 truncate mt-0.5">
                        Kết hợp 2 bộ đề, chia từng đội
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {onJoinRoom && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onJoinRoom();
              }}
              className="p-2 sm:px-4.5 sm:py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-md shadow-emerald-200 hover:shadow-lg transition active:scale-95 cursor-pointer shrink-0"
              title="Nhập mã phòng để tham gia"
              aria-label="Tham gia phòng"
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap hidden sm:inline">Tham gia phòng</span>
            </button>
          )}

          {/* Admin Portal Button (Visible only to Admin) */}
          {isAdmin && onOpenAdminPortal && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onOpenAdminPortal();
              }}
              className="p-2 sm:px-3.5 sm:py-2.5 rounded-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-rose-200 hover:shadow-lg transition active:scale-95 cursor-pointer shrink-0 animate-pulse-subtle"
              title="Cổng quản trị hệ thống và phê duyệt bộ đề"
            >
              <Shield className="w-4 h-4 fill-current shrink-0" />
              <span className="whitespace-nowrap hidden sm:inline">Quản trị</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white text-rose-700 tabular-nums shadow-xs">
                  {pendingCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Right: Sound Toggle, Teacher Auth & Optional Extra Action */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {rightAction}

          {/* Quick link to Member Profile when logged in */}
          {currentUser && onOpenProfile && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onOpenProfile();
              }}
              className="p-1.5 sm:px-3 sm:py-2 rounded-full bg-white hover:bg-indigo-50 text-indigo-700 font-extrabold text-xs flex items-center gap-1.5 border border-indigo-200 hover:border-indigo-300 transition active:scale-95 cursor-pointer shadow-2xs shrink-0"
              title="Vào xem câu hỏi đã tạo, lịch sử thi đấu và chỉnh sửa thông tin"
            >
              <UserIcon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="hidden sm:inline">Trang cá nhân</span>
            </button>
          )}

          {/* Teacher Login / Account button with Role Indication */}
          {currentUser ? (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setIsAuthModalOpen(true);
              }}
              className={`p-1 sm:px-2.5 sm:py-1.5 rounded-full font-extrabold text-xs flex items-center gap-1.5 border transition active:scale-95 cursor-pointer shadow-2xs ${
                isAdmin
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300'
                  : isPremium
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
              }`}
              title={`Đã đăng nhập: ${currentUser.fullName} (${currentUser.role}). Bấm để xem thông tin`}
            >
              <div
                className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-black shadow-xs ${
                  isAdmin
                    ? 'bg-rose-600'
                    : isPremium
                    ? 'bg-gradient-to-tr from-amber-500 to-yellow-500 text-slate-900'
                    : 'bg-indigo-600'
                }`}
              >
                {isAdmin ? '👑' : isPremium ? '⭐' : currentUser.fullName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:inline truncate max-w-[90px]">
                {currentUser.fullName}
              </span>
              {isPremium && (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 shadow-2xs">
                  VIP
                </span>
              )}
              {isAdmin && (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-rose-600 text-white shadow-2xs">
                  Admin
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setIsAuthModalOpen(true);
              }}
              className="p-1.5 sm:px-3 sm:py-2 rounded-full bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-extrabold text-xs flex items-center gap-1.5 border border-slate-200 hover:border-indigo-300 transition active:scale-95 cursor-pointer shadow-2xs"
              title="Đăng nhập tài khoản Giáo viên"
            >
              <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Tài khoản</span>
            </button>
          )}

          <SoundToggle />
        </div>
      </div>

      {/* Teacher Authentication & Account Modal */}
      <TeacherAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onOpenAdminPortal={onOpenAdminPortal}
        onOpenProfile={onOpenProfile}
      />
    </header>
  );
};


