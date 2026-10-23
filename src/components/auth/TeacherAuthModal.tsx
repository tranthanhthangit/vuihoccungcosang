import React, { useState } from 'react';
import { X, Lock, Mail, User, Eye, EyeOff, Sparkles, CheckCircle, AlertCircle, ExternalLink, Cloud } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sounds } from '../../utils/sound';

interface TeacherAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeacherAuthModal: React.FC<TeacherAuthModalProps> = ({ isOpen, onClose }) => {
  const { user, isConfigured, signIn, signUp, signOut, resetPassword } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

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
          setErrorMsg(
            error.message.includes('Invalid login credentials')
              ? 'Email hoặc mật khẩu không chính xác.'
              : error.message
          );
        } else {
          sounds.playCorrect();
          onClose();
        }
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          setErrorMsg(error.message);
        } else {
          sounds.playCorrect();
          setSuccessMsg('Đăng ký tài khoản thành công! Vui lòng kiểm tra email để xác thực (hoặc đăng nhập ngay nếu đã tắt xác thực email trên Supabase).');
          setMode('signin');
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          setErrorMsg(error.message);
        } else {
          sounds.playCorrect();
          setSuccessMsg('Đã gửi đường dẫn đặt lại mật khẩu về email của bạn. Vui lòng kiểm tra hộp thư!');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-2 border-indigo-100 overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
        {/* Header decoration banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-5 text-white relative">
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
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide">
                {user ? 'Tài khoản Giáo viên' : mode === 'signin' ? 'Đăng nhập Giáo viên' : mode === 'signup' ? 'Đăng ký Tài khoản' : 'Khôi phục Mật khẩu'}
              </h3>
              <p className="text-xs text-white/80 font-bold">
                {user ? 'Đang đồng bộ trò chơi trên Cloud' : 'Lưu trữ & đồng bộ bài dạy trên mọi thiết bị'}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {!isConfigured ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wide text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Chưa cấu hình khóa Supabase</span>
                </div>
                <p className="text-xs font-semibold leading-relaxed">
                  Ứng dụng hiện đang lưu trò chơi trên bộ nhớ máy (IndexedDB & LocalStorage).
                  Để đồng bộ lên Cloud và đăng nhập nhiều máy, bạn chỉ cần tạo 1 dự án miễn phí trên <b>Supabase</b> và thêm 2 biến môi trường vào dự án:
                </p>
                <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200 text-[11px] font-mono text-slate-700 space-y-1">
                  <div>VITE_SUPABASE_URL=https://xyz.supabase.co</div>
                  <div>VITE_SUPABASE_ANON_KEY=eyJhbGci...</div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs text-center flex items-center justify-center gap-2 shadow-md transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Mở Supabase.com tạo dự án miễn phí (0đ)</span>
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                >
                  Đóng & tiếp tục dùng offline
                </button>
              </div>
            </div>
          ) : user ? (
            /* Logged In View */
            <div className="space-y-5">
              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                  {user.email?.charAt(0).toUpperCase() || 'C'}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Đang đăng nhập
                  </span>
                  <p className="text-sm font-black text-slate-900 truncate">
                    {user.user_metadata?.full_name || 'Cô giáo'}
                  </p>
                  <p className="text-xs font-medium text-slate-600 truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs font-bold text-emerald-800">
                <Cloud className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Trò chơi của cô được tự động sao lưu và bảo mật an toàn trên Supabase Cloud!</span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    sounds.playClick();
                    await signOut();
                    onClose();
                  }}
                  className="flex-1 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-black text-xs transition cursor-pointer border border-rose-200"
                >
                  Đăng xuất tài khoản
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition cursor-pointer shadow-md"
                >
                  Hoàn tất
                </button>
              </div>
            </div>
          ) : (
            /* Auth Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                    Họ và tên / Tên cô giáo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ví dụ: Cô Mai Lan"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                      Mật khẩu
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setMode('forgot');
                          setErrorMsg(null);
                        }}
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
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : mode === 'signin' ? 'Đăng nhập ngay' : mode === 'signup' ? 'Tạo tài khoản' : 'Gửi link khôi phục'}
              </button>

              <div className="pt-2 border-t border-slate-100 text-center">
                {mode === 'signin' ? (
                  <p className="text-xs text-slate-600 font-semibold">
                    Chưa có tài khoản?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setMode('signup');
                        setErrorMsg(null);
                      }}
                      className="font-black text-indigo-600 hover:underline cursor-pointer"
                    >
                      Đăng ký miễn phí
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-slate-600 font-semibold">
                    Đã có tài khoản?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setMode('signin');
                        setErrorMsg(null);
                      }}
                      className="font-black text-indigo-600 hover:underline cursor-pointer"
                    >
                      Đăng nhập ngay
                    </button>
                  </p>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
