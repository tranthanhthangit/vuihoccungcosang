import React, { useState, useRef, useEffect } from 'react';
import {
  Home,
  BookOpen,
  Gamepad2,
  QrCode,
  ChevronDown,
  User,
  Users,
  BookMarked,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  PlusCircle,
} from 'lucide-react';
import { sounds } from '../../utils/sound';
import { useAuth } from '../../context/AuthContext';
import { TeacherAuthModal } from '../auth/TeacherAuthModal';
import { Modal } from './Modal';

interface HeaderProps {
  currentView?: string;
  title?: string;
  subtitle?: string;
  onHome?: () => void;
  onOpenGamesBank?: () => void;
  onCreateRoom?: () => void;
  onCreateDefaultRoom?: () => void;
  onCreateDualRoom?: () => void;
  onCreateNewGame?: () => void;
  onJoinRoom?: () => void;
  onOpenQRQuiz?: (tab?: 'host' | 'students' | 'print' | 'bank' | 'history') => void;
  onOpenAdminPortal?: () => void;
  onOpenProfile?: (tab?: 'games' | 'history' | 'info' | 'password' | 'classes') => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  currentView = 'home',
  onHome,
  onOpenGamesBank,
  onCreateRoom,
  onCreateDefaultRoom,
  onCreateDualRoom,
  onCreateNewGame,
  onJoinRoom,
  onOpenQRQuiz,
  onOpenAdminPortal,
  onOpenProfile,
  rightAction,
}) => {
  const { currentUser, isAdmin, isPremium, signOut } = useAuth();

  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on view change
  useEffect(() => {
    setIsAccountDropdownOpen(false);
    setIsMobileMenuOpen(false);
  }, [currentView]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(target)) {
        setIsAccountDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoClick = () => {
    sounds.playClick();
    if (onHome) onHome();
  };

  const handleNavClick = (callback?: () => void) => {
    sounds.playClick();
    if (callback) callback();
  };

  const handleSignOut = () => {
    sounds.playClick();
    setIsAccountDropdownOpen(false);
    setShowSignOutConfirm(true);
  };

  const isHomeActive = currentView === 'home';
  const isGamesActive = currentView === 'games_list';
  const isCreateRoomActive = currentView === 'create_room' || currentView === 'host';
  const isQRActive =
    currentView === 'qr_quiz' ||
    currentView === 'qr_host' ||
    currentView === 'qr_scanner';

  return (
    <header className="bg-white border-b border-slate-100/90 sticky top-0 z-40 transition-all select-none shadow-[0_2px_8px_rgba(16,35,77,0.04)] print:hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[68px] flex items-center justify-between gap-3">
        {/* ================= LEFT: OFFICIAL LOGO ================= */}
        <button
          type="button"
          onClick={handleLogoClick}
          className="flex items-center gap-2 group cursor-pointer focus:outline-none shrink-0"
          title="Vui học cùng cô"
        >
          <img
            src="/assets/aistudio/logo_vuihoc_official.png"
            alt="Vui học cùng cô"
            className="h-9 sm:h-10 md:h-11 w-auto object-contain hover:scale-102 transition-transform"
          />
        </button>

        {/* ================= CENTER: DESKTOP NAVIGATION ================= */}
        <nav className="hidden md:flex items-center justify-center flex-1 mx-4 gap-1.5 sm:gap-2">
          {/* 1. Trang chủ */}
          <button
            type="button"
            onClick={() => handleNavClick(onHome)}
            className={`px-3.5 py-1.5 rounded-full text-[13px] transition cursor-pointer shrink-0 ${
              isHomeActive
                ? 'border border-[#16A34A] text-[#16A34A] bg-[#F0FDF4] font-bold shadow-2xs'
                : 'text-[#10234D] hover:text-[#16A34A] hover:bg-slate-50 font-semibold'
            }`}
          >
            <span>Trang chủ</span>
          </button>

          {/* 2. Kho trò chơi */}
          <button
            type="button"
            onClick={() => handleNavClick(onOpenGamesBank)}
            className={`px-3.5 py-1.5 rounded-full text-[13px] transition cursor-pointer shrink-0 ${
              isGamesActive
                ? 'border border-[#16A34A] text-[#16A34A] bg-[#F0FDF4] font-bold shadow-2xs'
                : 'text-[#10234D] hover:text-[#16A34A] hover:bg-slate-50 font-semibold'
            }`}
          >
            <span>Kho trò chơi</span>
          </button>

          {/* 3. Tạo phòng */}
          <button
            type="button"
            onClick={() => handleNavClick(onCreateRoom || onCreateDefaultRoom)}
            className={`px-3.5 py-1.5 rounded-full text-[13px] transition cursor-pointer shrink-0 ${
              isCreateRoomActive
                ? 'border border-[#16A34A] text-[#16A34A] bg-[#F0FDF4] font-bold shadow-2xs'
                : 'text-[#10234D] hover:text-[#16A34A] hover:bg-slate-50 font-semibold'
            }`}
          >
            <span>Tạo phòng</span>
          </button>

          {/* 4. Quét mã QR giấy */}
          <button
            type="button"
            onClick={() => handleNavClick(onOpenQRQuiz ? () => onOpenQRQuiz('host') : undefined)}
            className={`px-3.5 py-1.5 rounded-full text-[13px] transition cursor-pointer shrink-0 ${
              isQRActive
                ? 'border border-[#16A34A] text-[#16A34A] bg-[#F0FDF4] font-bold shadow-2xs'
                : 'text-[#10234D] hover:text-[#16A34A] hover:bg-slate-50 font-semibold'
            }`}
          >
            <span>Quét mã QR giấy</span>
          </button>
        </nav>

        {/* ================= RIGHT: ACCOUNT ICON & HAMBURGER ================= */}
        <div className="flex items-center gap-2 shrink-0">
          {rightAction}

          {/* Account Profile Trigger Button (matches template's green ring with user icon) */}
          <div ref={accountDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setIsAccountDropdownOpen((prev) => !prev);
              }}
              className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 transition active:scale-95 cursor-pointer focus:outline-none"
              title="Tài khoản giáo viên"
              aria-haspopup="true"
              aria-expanded={isAccountDropdownOpen}
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-[#16A34A] flex items-center justify-center text-[#16A34A] bg-[#F0FDF4] shadow-2xs">
                <User className="w-5 h-5 stroke-[2.2]" />
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#10234D] transition-transform duration-200 ${
                  isAccountDropdownOpen ? 'rotate-180 text-[#16A34A]' : ''
                }`}
              />
            </button>

            {/* Account Dropdown Menu */}
            {isAccountDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-scale-up text-xs">
                {/* Teacher Info Card */}
                <div className="p-3 rounded-xl bg-[#EFF8FF] mb-2 flex items-center gap-3">
                  <img
                    src="/assets/aistudio/avatar_teacher_clean.png"
                    alt=""
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-[#10234D] text-sm truncate">
                      {currentUser?.fullName || 'Cô Mai Linh'}
                    </h4>
                    <p className="text-[11px] font-medium text-[#087CF5]">
                      {isAdmin ? 'Quản trị viên' : isPremium ? 'Giáo viên VIP' : 'Giáo viên'}
                    </p>
                  </div>
                </div>

                <div className="space-y-0.5">
                  {/* 1. Trang cá nhân */}
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setIsAccountDropdownOpen(false);
                      if (onOpenProfile) onOpenProfile('info');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-[#10234D] hover:bg-[#EFF8FF] hover:text-[#087CF5] font-semibold flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <User className="w-4 h-4 text-[#087CF5]" />
                    <span>Trang cá nhân</span>
                  </button>

                  {/* 2. Quản lý lớp học */}
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setIsAccountDropdownOpen(false);
                      if (onOpenProfile) onOpenProfile('classes');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-[#10234D] hover:bg-[#EFF8FF] hover:text-[#087CF5] font-semibold flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Quản lý lớp học</span>
                  </button>

                  {/* 3. Bộ câu hỏi của tôi */}
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setIsAccountDropdownOpen(false);
                      if (onOpenProfile) onOpenProfile('games');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-[#10234D] hover:bg-[#EFF8FF] hover:text-[#087CF5] font-semibold flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <BookMarked className="w-4 h-4 text-[#FF2780]" />
                    <span>Bộ câu hỏi của tôi</span>
                  </button>

                  {/* 4. Lịch sử chơi */}
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setIsAccountDropdownOpen(false);
                      if (onOpenProfile) onOpenProfile('history');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-[#10234D] hover:bg-[#EFF8FF] hover:text-[#087CF5] font-semibold flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <History className="w-4 h-4 text-amber-500" />
                    <span>Lịch sử chơi</span>
                  </button>

                  {/* 5. Cài đặt tài khoản */}
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setIsAccountDropdownOpen(false);
                      if (onOpenProfile) onOpenProfile('info');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-[#10234D] hover:bg-[#EFF8FF] hover:text-[#087CF5] font-semibold flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Cài đặt tài khoản</span>
                  </button>

                  {/* Admin Portal (if admin) */}
                  {isAdmin && onOpenAdminPortal && (
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setIsAccountDropdownOpen(false);
                        onOpenAdminPortal();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-50 font-bold flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-rose-600" />
                      <span>Cổng Quản trị Admin</span>
                    </button>
                  )}
                </div>

                {/* 6. Đăng xuất */}
                <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setIsMobileMenuOpen((prev) => !prev);
            }}
            className="md:hidden p-2 rounded-xl text-[#10234D] hover:bg-slate-100 transition cursor-pointer"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* ================= MOBILE NAVIGATION DRAWER ================= */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden border-t border-slate-100 bg-white px-4 py-3 shadow-lg space-y-1 text-sm animate-scale-up"
        >
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleNavClick(onHome);
            }}
            className={`w-full text-left px-3 py-2.5 rounded-xl font-bold flex items-center gap-3 transition cursor-pointer ${
              isHomeActive ? 'bg-[#EFF8FF] text-[#087CF5]' : 'text-[#10234D] hover:bg-slate-50'
            }`}
          >
            <Home className="w-5 h-5 text-inherit" />
            <span>Trang chủ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleNavClick(onOpenGamesBank);
            }}
            className={`w-full text-left px-3 py-2.5 rounded-xl font-bold flex items-center gap-3 transition cursor-pointer ${
              isGamesActive ? 'bg-[#EFF8FF] text-[#087CF5]' : 'text-[#10234D] hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-5 h-5 text-inherit" />
            <span>Kho trò chơi</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleNavClick(onCreateRoom || onCreateDefaultRoom);
            }}
            className={`w-full text-left px-3 py-2.5 rounded-xl font-bold flex items-center gap-3 transition cursor-pointer ${
              isCreateRoomActive ? 'bg-[#EFF8FF] text-[#087CF5]' : 'text-[#10234D] hover:bg-slate-50'
            }`}
          >
            <Gamepad2 className="w-5 h-5 text-inherit" />
            <span>Tạo phòng</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleNavClick(onOpenQRQuiz ? () => onOpenQRQuiz('host') : undefined);
            }}
            className={`w-full text-left px-3 py-2.5 rounded-xl font-bold flex items-center gap-3 transition cursor-pointer ${
              isQRActive ? 'bg-[#EFF8FF] text-[#087CF5]' : 'text-[#10234D] hover:bg-slate-50'
            }`}
          >
            <QrCode className="w-5 h-5 text-inherit" />
            <span>Quét mã QR giấy</span>
          </button>

          {onJoinRoom && (
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleNavClick(onJoinRoom);
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl font-bold text-[#10234D] hover:bg-slate-50 flex items-center gap-3 transition cursor-pointer"
            >
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Tham gia phòng chơi (Học sinh)</span>
            </button>
          )}

          {onCreateNewGame && (
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleNavClick(onCreateNewGame);
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl font-bold text-[#10234D] hover:bg-slate-50 flex items-center gap-3 transition cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 text-[#FF2780]" />
              <span>Tạo trò chơi mới</span>
            </button>
          )}
        </div>
      )}

      {/* Auth Modal */}
      <TeacherAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onOpenAdminPortal={onOpenAdminPortal}
        onOpenProfile={() => {
          if (onOpenProfile) onOpenProfile('info');
        }}
      />

      {/* Sign Out Confirmation Modal */}
      <Modal
        isOpen={showSignOutConfirm}
        title="Đăng xuất tài khoản?"
        message="Cô có chắc chắn muốn đăng xuất tài khoản giáo viên này không?"
        confirmText="Đăng xuất"
        cancelText="Ở lại"
        confirmVariant="danger"
        onConfirm={async () => {
          setShowSignOutConfirm(false);
          await signOut();
          if (onHome) onHome();
        }}
        onCancel={() => setShowSignOutConfirm(false)}
      />
    </header>
  );
};
