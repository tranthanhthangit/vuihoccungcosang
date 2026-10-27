import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Search,
  ArrowLeft,
  Crown,
  Sparkles,
  BookOpen,
  Filter,
  Check,
  X,
  AlertTriangle,
  Play,
  Edit3,
  Lock,
  Unlock,
  GraduationCap,
  Calendar,
  School,
  FileQuestion,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Game, UserProfile, UserRole } from '../../types/game';
import {
  getAllGames,
  getPendingApprovalGames,
  approveGame,
  rejectGame,
  saveGame,
  subscribeGames,
} from '../../services/gameStorage';
import { sounds } from '../../utils/sound';

interface AdminDashboardProps {
  onBackToHome: () => void;
  onSelectGameToPlay?: (game: Game) => void;
  onEditGame?: (game: Game) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToHome,
  onSelectGameToPlay,
  onEditGame,
}) => {
  const {
    currentUser,
    isAdmin,
    registeredUsers,
    updateUserRole,
    toggleUserStatus,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'teachers' | 'approvals' | 'system_games'>('approvals');
  const [games, setGames] = useState<Game[]>(() => getAllGames());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'teacher_member' | 'teacher_premium' | 'admin'>('all');

  // Preview game modal state
  const [previewGame, setPreviewGame] = useState<Game | null>(null);

  // Reject modal state
  const [rejectingGame, setRejectingGame] = useState<Game | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Toast / feedback message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const unsub = subscribeGames((updated) => {
      setGames(updated);
    });
    return () => unsub();
  }, []);

  const pendingGames = games.filter((g) => g.visibility === 'pending_approval');
  const systemGames = games.filter((g) => g.isSystemDefault || g.visibility === 'public');
  const teacherMembers = registeredUsers.filter((u) => u.role === 'teacher_member');
  const teacherPremiums = registeredUsers.filter((u) => u.role === 'teacher_premium');

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleApprove = (game: Game) => {
    sounds.playCorrect();
    const approved = approveGame(game.id, currentUser?.fullName || 'Quản trị viên');
    if (approved) {
      showFeedback('success', `Đã phê duyệt bộ đề "${game.title}" công khai toàn website!`);
    }
  };

  const handleRejectConfirm = () => {
    if (!rejectingGame) return;
    sounds.playClick();
    rejectGame(rejectingGame.id, rejectReason.trim() || 'Cần chỉnh sửa thêm nội dung câu hỏi.');
    showFeedback('success', `Đã từ chối và gửi phản hồi đến tác giả bộ đề.`);
    setRejectingGame(null);
    setRejectReason('');
  };

  const handleRoleChange = async (userId: string, targetRole: UserRole, userFullName: string) => {
    sounds.playClick();
    const res = await updateUserRole(userId, targetRole);
    if (res.success) {
      const roleLabel =
        targetRole === 'teacher_premium'
          ? 'Giáo viên Premium (VIP)'
          : targetRole === 'admin'
          ? 'Quản trị viên'
          : 'Giáo viên Member';
      showFeedback('success', `Đã cập nhật phân quyền cho ${userFullName} thành: ${roleLabel}`);
    } else {
      showFeedback('error', res.error || 'Có lỗi xảy ra khi đổi quyền.');
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string, userFullName: string) => {
    sounds.playClick();
    const res = await toggleUserStatus(userId);
    if (res.success) {
      const nextText = currentStatus === 'active' ? 'Đã tạm khóa tài khoản' : 'Đã kích hoạt lại tài khoản';
      showFeedback('success', `${nextText} của ${userFullName}.`);
    } else {
      showFeedback('error', res.error || 'Có lỗi xảy ra khi cập nhật trạng thái.');
    }
  };

  // Filtered teachers list
  const filteredUsers = registeredUsers.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.schoolName && user.schoolName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onBackToHome();
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              title="Quay lại trang chính"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-md shadow-rose-200">
                <Shield className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                    Cổng Quản Trị Hệ Thống
                  </h1>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                    Admin Portal
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  Quản lý giáo viên, duyệt bộ câu hỏi & kiểm duyệt website
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-black text-slate-800 block">
                {currentUser?.fullName || 'Admin Trần Thắng'}
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                {currentUser?.email || 'tranthangit2025@gmail.com'}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-rose-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
              AD
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 flex flex-col gap-6">
        {/* Feedback Alert Toast */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 shadow-md animate-in slide-in-from-top-2 duration-200 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
                Đang chờ duyệt
              </span>
              <div className="text-2xl font-black text-slate-900 tabular-nums">
                {pendingGames.length}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
                Giáo viên Member
              </span>
              <div className="text-2xl font-black text-slate-900 tabular-nums">
                {teacherMembers.length}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
                Giáo viên VIP Premium
              </span>
              <div className="text-2xl font-black text-slate-900 tabular-nums">
                {teacherPremiums.length}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
                Bộ đề công khai
              </span>
              <div className="text-2xl font-black text-slate-900 tabular-nums">
                {systemGames.length}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('approvals');
            }}
            className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'approvals'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Duyệt bộ đề công khai</span>
            {pendingGames.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white text-amber-700 tabular-nums">
                {pendingGames.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('teachers');
            }}
            className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'teachers'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Quản lý tài khoản Giáo viên</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-slate-200 text-slate-700 tabular-nums">
              {registeredUsers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('system_games');
            }}
            className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'system_games'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Ngân hàng câu hỏi Website</span>
          </button>
        </div>

        {/* TAB 1: DUYỆT BỘ CÂU HỎI PUBLIC */}
        {activeTab === 'approvals' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Hàng đợi phê duyệt bộ câu hỏi ({pendingGames.length})
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Giáo viên gửi yêu cầu đưa bộ đề lên thư viện công khai toàn website. Admin kiểm duyệt nội dung trước khi phát hành.
                </p>
              </div>
            </div>

            {pendingGames.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-inner">
                  🎉
                </div>
                <h3 className="text-base font-black text-slate-800">
                  Không có bộ đề nào đang chờ duyệt!
                </h3>
                <p className="text-xs text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
                  Tất cả các bộ câu hỏi gửi lên đã được duyệt xong hoặc giáo viên đang lưu ở chế độ riêng tư của lớp.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingGames.map((game) => (
                  <div
                    key={game.id}
                    className="bg-white rounded-3xl p-5 border-2 border-amber-200 shadow-sm flex flex-col justify-between gap-4 relative overflow-hidden"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Chờ Admin duyệt
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 tabular-nums">
                          {game.submittedForApprovalAt
                            ? new Date(game.submittedForApprovalAt).toLocaleDateString('vi-VN')
                            : 'Mới gửi'}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-slate-900 leading-snug">
                        {game.title}
                      </h3>

                      {game.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {game.description}
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                          <b>Tác giả:</b> {game.authorName || 'Cô giáo mầm non'}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <FileQuestion className="w-3.5 h-3.5 text-emerald-500" />
                          <b>{game.questions.length}</b> câu hỏi
                        </span>
                        <span>·</span>
                        <span>Độ tuổi: {game.targetAge || '5-6 tuổi'}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setPreviewGame(game);
                        }}
                        className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem trước</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setRejectingGame(game);
                          setRejectReason('');
                        }}
                        className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-rose-200"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Từ chối</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApprove(game)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-200 transition cursor-pointer active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>Phê duyệt ngay</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: QUẢN LÝ TÀI KHOẢN GIÁO VIÊN */}
        {activeTab === 'teachers' && (
          <div className="space-y-4">
            {/* Search and Role Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên cô giáo, email, trường..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 transition"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setRoleFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                    roleFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất cả ({registeredUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('teacher_member')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                    roleFilter === 'teacher_member'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  Member ({teacherMembers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('teacher_premium')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                    roleFilter === 'teacher_premium'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  VIP Premium ({teacherPremiums.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('admin')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                    roleFilter === 'admin'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            {/* Teacher Accounts Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Cô giáo / Tài khoản</th>
                      <th className="py-3.5 px-4 hidden md:table-cell">Trường mầm non</th>
                      <th className="py-3.5 px-4">Phân quyền</th>
                      <th className="py-3.5 px-4 text-center">Trạng thái</th>
                      <th className="py-3.5 px-4 text-right">Hành động quản trị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-bold">
                          Không tìm thấy tài khoản giáo viên nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const isOwner = user.email.toLowerCase() === 'tranthangit2025@gmail.com';
                        return (
                          <tr key={user.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs text-white shrink-0 shadow-xs ${
                                    user.role === 'admin'
                                      ? 'bg-rose-600'
                                      : user.role === 'teacher_premium'
                                      ? 'bg-gradient-to-tr from-amber-500 to-yellow-500 text-slate-900'
                                      : 'bg-blue-600'
                                  }`}
                                >
                                  {user.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-black text-slate-900 truncate">
                                    {user.fullName}
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 hidden md:table-cell text-slate-600">
                              {user.schoolName || 'Chưa cập nhật'}
                            </td>

                            <td className="py-3.5 px-4">
                              {user.role === 'admin' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-black">
                                  <Shield className="w-3 h-3 text-rose-600" />
                                  Quản Trị Viên
                                </span>
                              ) : user.role === 'teacher_premium' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black border border-amber-300">
                                  <Crown className="w-3 h-3 text-amber-600" />
                                  VIP Premium
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-black">
                                  <GraduationCap className="w-3 h-3 text-blue-600" />
                                  Giáo viên (Member)
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              {user.status === 'active' ? (
                                <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                                  Hoạt động
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black">
                                  Đang khóa
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Toggle between Member & Premium */}
                                {user.role === 'teacher_member' && (
                                  <button
                                    type="button"
                                    onClick={() => handleRoleChange(user.id, 'teacher_premium', user.fullName)}
                                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold text-[11px] border border-amber-300 transition cursor-pointer flex items-center gap-1"
                                    title="Nâng cấp tài khoản này lên VIP Premium"
                                  >
                                    <Sparkles className="w-3 h-3 text-amber-600" />
                                    <span>Lên VIP</span>
                                  </button>
                                )}

                                {user.role === 'teacher_premium' && (
                                  <button
                                    type="button"
                                    onClick={() => handleRoleChange(user.id, 'teacher_member', user.fullName)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[11px] border border-slate-200 transition cursor-pointer"
                                    title="Chuyển về tài khoản giáo viên Member thường"
                                  >
                                    Về Member
                                  </button>
                                )}

                                {/* Admin Promotion */}
                                {user.role !== 'admin' && (
                                  <button
                                    type="button"
                                    onClick={() => handleRoleChange(user.id, 'admin', user.fullName)}
                                    className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-[11px] border border-rose-200 transition cursor-pointer"
                                    title="Cấp quyền Quản trị viên hệ thống"
                                  >
                                    Cấp Admin
                                  </button>
                                )}

                                {/* Lock / Unlock Button (Never lock owner) */}
                                {!isOwner && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStatus(user.id, user.status, user.fullName)}
                                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                      user.status === 'active'
                                        ? 'bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border-slate-200'
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                    }`}
                                    title={user.status === 'active' ? 'Khóa tài khoản này' : 'Mở khóa tài khoản này'}
                                  >
                                    {user.status === 'active' ? (
                                      <Lock className="w-3.5 h-3.5" />
                                    ) : (
                                      <Unlock className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: NGÂN HÀNG CÂU HỎI WEBSITE */}
        {activeTab === 'system_games' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Ngân hàng câu hỏi & Bộ đề chung toàn website ({systemGames.length})
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Các bộ câu hỏi mẫu chính thức được công khai cho tất cả giáo viên tham khảo và sử dụng để mở phòng chơi.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemGames.map((game) => (
                <div
                  key={game.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between gap-3 group hover:border-indigo-300 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                        {game.isSystemDefault ? 'Đề chuẩn Bộ GD&ĐT' : 'Đã duyệt công khai'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {game.questions.length} câu hỏi
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                      {game.title}
                    </h3>

                    {game.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {game.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setPreviewGame(game);
                      }}
                      className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem nội dung</span>
                    </button>

                    {onSelectGameToPlay && (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playCorrect();
                          onSelectGameToPlay(game);
                        }}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Mở phòng</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* PREVIEW GAME MODAL */}
      {previewGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border-2 border-indigo-100 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between shrink-0">
              <div className="min-w-0 pr-4">
                <h3 className="text-base font-black truncate">{previewGame.title}</h3>
                <p className="text-xs text-indigo-100">
                  {previewGame.questions.length} câu hỏi · Tác giả: {previewGame.authorName || 'Cô giáo'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewGame(null)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {previewGame.questions.map((q, idx) => (
                <div key={q.id || idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-700">Câu {idx + 1}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Loại: {q.type === 'drag_drop' ? 'Kéo thả' : q.type === 'open_ended' ? 'Vẽ/Tự luận' : 'Trắc nghiệm'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{q.title}</p>
                  {q.imageUrl && (
                    <img
                      src={q.imageUrl}
                      alt="Minh họa"
                      className="h-28 rounded-xl object-contain bg-white border border-slate-200 p-1"
                    />
                  )}
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={opt.id || oIdx}
                          className={`p-2 rounded-xl text-xs font-bold border ${
                            opt.isCorrect
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          {opt.isCorrect && '✓ '}
                          {opt.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewGame(null)}
                className="py-2 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs transition cursor-pointer"
              >
                Đóng
              </button>
              {previewGame.visibility === 'pending_approval' && (
                <button
                  type="button"
                  onClick={() => {
                    handleApprove(previewGame);
                    setPreviewGame(null);
                  }}
                  className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition cursor-pointer shadow-md"
                >
                  Phê duyệt bộ đề này
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL WITH REASON */}
      {rejectingGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-2 border-rose-100 p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-black text-slate-900">
                Từ chối phê duyệt bộ đề
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Bạn đang từ chối bộ đề <b>"{rejectingGame.title}"</b>. Vui lòng nhập lý do để giáo viên tác giả biết và chỉnh sửa:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="VD: Cần bổ sung hình ảnh rõ nét hơn, câu hỏi số 3 sai chính tả..."
              className="w-full h-24 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-rose-400"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingGame(null)}
                className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer shadow-md"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
