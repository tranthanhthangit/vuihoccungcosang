import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Crown,
  GraduationCap,
  Shield,
  School,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/game';
import { sounds } from '../../utils/sound';

interface TeacherAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdminPortal?: () => void;
  onOpenProfile?: () => void;
}

export const TeacherAuthModal: React.FC<TeacherAuthModalProps> = ({
  isOpen,
  onClose,
  onOpenAdminPortal,
  onOpenProfile,
}) => {
  const {
    currentUser,
    role,
    quota,
    isAdmin,
    isPremium,
    isMember,
    signIn,
    signUp,
    signOut,
    resetPassword,
    quickSwitchAccount,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    sounds.playClick();

    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ email.');
      return;
    }

    if (mode !== 'forgot' && !password) {
      setErrorMsg('Vui lòng nhập mật khẩu.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setErrorMsg('Mật khẩu cần tối thiểu 6 ký tự.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMsg(error.message);
        } else {
          sounds.playCorrect();
          onClose();
        }
      } else if (mode === 'signup') {
        const { error, profile } = await signUp(email, password, fullName, schoolName);
        if (error) {
          setErrorMsg(error.message);
        } else {
          sounds.playCorrect();
          const roleText = profile?.role === 'admin' ? 'Quản trị viên (Admin)' : 'Giáo viên Member';
          setSuccessMsg(`Đăng ký tài khoản thành công với quyền: ${roleText}!`);
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          setErrorMsg(error.message);
        } else {
          sounds.playCorrect();
          setSuccessMsg('Đã gửi thông tin đặt lại mật khẩu về email của bạn.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSwitch = (targetRole: UserRole) => {
    sounds.playCorrect();
    quickSwitchAccount(targetRole);
    setErrorMsg(null);
    setSuccessMsg(`Đã chuyển đổi sang tài khoản: ${
      targetRole === 'admin' ? 'Quản trị viên (Admin)' : targetRole === 'teacher_premium' ? 'Giáo viên VIP' : 'Giáo viên Member'
    }`);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-2 border-indigo-100 overflow-hidden flex flex-col relative my-auto animate-in zoom-in-95 duration-200 max-h-[92vh]">
        {/* Header decoration banner */}
        <div
          className={`p-5 text-white relative shrink-0 transition-colors ${
            isAdmin
              ? 'bg-gradient-to-r from-rose-600 via-red-600 to-amber-600'
              : isPremium
              ? 'bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-500'
              : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500'
          }`}
        >
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              {isAdmin ? (
                <Shield className="w-6 h-6 text-white" />
              ) : isPremium ? (
                <Crown className="w-6 h-6 text-yellow-200" />
              ) : (
                <GraduationCap className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide">
                {currentUser
                  ? 'Thông tin Tài khoản'
                  : mode === 'signin'
                  ? 'Đăng nhập Giáo viên'
                  : mode === 'signup'
                  ? 'Đăng ký Tài khoản'
                  : 'Khôi phục Mật khẩu'}
              </h3>
              <p className="text-xs text-white/80 font-bold">
                {currentUser
                  ? isAdmin
                    ? 'Toàn quyền Quản trị viên hệ thống'
                    : isPremium
                    ? 'Tài khoản VIP cao cấp (Không giới hạn)'
                    : 'Tài khoản Giáo viên tiêu chuẩn (Member)'
                  : 'Nền tảng giáo dục mầm non Vui Học Cùng Cô'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Demo Switcher Strip for Instant Testing */}
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600 gap-2">
          <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-slate-500 shrink-0">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Thử nhanh:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => handleQuickSwitch('admin')}
              className={`px-2 py-1 rounded-lg text-[11px] font-black transition cursor-pointer whitespace-nowrap ${
                isAdmin
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
              }`}
              title="Thử nghiệm quyền Quản trị viên (Admin)"
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickSwitch('teacher_premium')}
              className={`px-2 py-1 rounded-lg text-[11px] font-black transition cursor-pointer whitespace-nowrap ${
                isPremium
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-300'
              }`}
              title="Thử nghiệm quyền Giáo viên VIP Premium"
            >
              ⭐ VIP
            </button>
            <button
              type="button"
              onClick={() => handleQuickSwitch('teacher_member')}
              className={`px-2 py-1 rounded-lg text-[11px] font-black transition cursor-pointer whitespace-nowrap ${
                isMember
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
              }`}
              title="Thử nghiệm quyền Giáo viên Member"
            >
              🎓 Member
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* VIEW WHEN LOGGED IN */}
          {currentUser ? (
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-base text-white shadow-sm ${
                      isAdmin
                        ? 'bg-rose-600'
                        : isPremium
                        ? 'bg-gradient-to-tr from-amber-500 to-yellow-500 text-slate-900'
                        : 'bg-blue-600'
                    }`}
                  >
                    {currentUser.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-slate-900 truncate">
                        {currentUser.fullName}
                      </span>
                      {isAdmin && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 uppercase">
                          Admin
                        </span>
                      )}
                      {isPremium && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                          VIP
                        </span>
                      )}
                      {isMember && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">
                          Member
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{currentUser.email}</p>
                    {currentUser.schoolName && (
                      <p className="text-[11px] font-semibold text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <School className="w-3 h-3" /> {currentUser.schoolName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Permissions & Quotas Explanation Box */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
                <div className="flex items-center gap-1.5 font-black text-xs text-indigo-900 uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Quyền hạn & Hạn ngạch hiện tại:</span>
                </div>
                <ul className="text-xs space-y-1.5 text-slate-700 font-medium">
                  {isMember && (
                    <>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Giới hạn tối đa <b>20 câu hỏi</b> / mỗi bộ đề</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Tạo tối đa <b>2 phòng chơi</b> cùng lúc</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Tùy chọn đề <b>Riêng tư</b> hoặc gửi <b>Admin duyệt công khai</b></span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Xuất kết quả thi đấu cơ bản</span>
                      </li>
                    </>
                  )}
                  {isPremium && (
                    <>
                      <li className="flex items-center gap-1.5 font-bold text-amber-900">
                        <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span><b>Không giới hạn</b> số câu hỏi trong mỗi bộ đề</span>
                      </li>
                      <li className="flex items-center gap-1.5 font-bold text-amber-900">
                        <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span><b>Không giới hạn</b> số phòng chơi cùng lúc</span>
                      </li>
                      <li className="flex items-center gap-1.5 font-bold text-amber-900">
                        <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Xuất báo cáo <b>nâng cao</b> (phân tích từng câu, tải ảnh bài vẽ ZIP)</span>
                      </li>
                      <li className="flex items-center gap-1.5 font-bold text-amber-900">
                        <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Huy hiệu VIP Hoàng kim & quyền truy cập kho đề độc quyền</span>
                      </li>
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <li className="flex items-center gap-1.5 font-bold text-rose-900">
                        <Shield className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Quản lý danh sách toàn bộ giáo viên (nâng/hạ quyền, khóa tài khoản)</span>
                      </li>
                      <li className="flex items-center gap-1.5 font-bold text-rose-900">
                        <Shield className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Phê duyệt các bộ đề giáo viên gửi công khai lên website</span>
                      </li>
                      <li className="flex items-center gap-1.5 font-bold text-rose-900">
                        <Shield className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Quản lý ngân hàng câu hỏi gốc của hệ thống</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {onOpenProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      onClose();
                      onOpenProfile();
                    }}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-200 transition cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    <span>VÀO TRANG CÁ NHÂN GIÁO VIÊN</span>
                  </button>
                )}

                {isAdmin && onOpenAdminPortal && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      onClose();
                      onOpenAdminPortal();
                    }}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-200 transition cursor-pointer"
                  >
                    <Shield className="w-4 h-4 fill-current" />
                    <span>MỞ CỔNG QUẢN TRỊ ADMIN</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      sounds.playClick();
                      await signOut();
                      onClose();
                    }}
                    className="flex-1 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs transition cursor-pointer border border-rose-200"
                  >
                    Đăng xuất
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition cursor-pointer shadow-md"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* AUTH FORM WHEN NOT LOGGED IN */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Tab Mode Buttons */}
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setMode('signin');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    mode === 'signin' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setMode('signup');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    mode === 'signup' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Đăng ký mới
                </button>
              </div>

              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Họ và tên Cô giáo:
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="VD: Cô Mai Linh"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Trường Mầm non (tùy chọn):
                    </label>
                    <div className="relative">
                      <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="VD: Trường Mầm Non Hoa Sen"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Địa chỉ Email:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@truongmamnon.edu.vn"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Mật khẩu:</label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        Quên mật khẩu?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'signup' && (
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  * Tài khoản đăng ký mới là <b>Giáo viên Member</b> (tối đa 20 câu/bộ, 2 phòng chơi cùng lúc).
                  Nếu đăng ký với email <b>tranthangit2025@gmail.com</b>, hệ thống sẽ tự động gán quyền <b>Admin</b>.
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition cursor-pointer shadow-md disabled:opacity-50"
              >
                {loading
                  ? 'Đang xử lý...'
                  : mode === 'signin'
                  ? 'ĐĂNG NHẬP NGAY'
                  : mode === 'signup'
                  ? 'HOÀN TẤT ĐĂNG KÝ'
                  : 'GỬI ĐẶT LẠI MẬT KHẨU'}
              </button>
            </form>
          )}

          {/* Student zero-login reassurance */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-[11px] text-emerald-700 font-bold bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-200">
              👶 Học sinh không cần tài khoản! Chỉ cần mở trang chủ và nhập mã PIN để vào chơi ngay.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
