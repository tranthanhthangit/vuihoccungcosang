import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  School,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  Trophy,
  History,
  BookOpen,
  Plus,
  Play,
  Edit3,
  Trash2,
  Send,
  Crown,
  Shield,
  GraduationCap,
  Sparkles,
  Calendar,
  Users,
  CheckCircle,
  HelpCircle,
  Clock,
  Layers,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Game } from '../../types/game';
import {
  getMyGames,
  getGameHistory,
  GameHistoryRecord,
  deleteGame,
  submitGameForApproval,
} from '../../services/gameStorage';
import { sounds } from '../../utils/sound';

type ProfileTab = 'games' | 'history' | 'info' | 'password';

interface MemberProfilePageProps {
  initialTab?: ProfileTab;
  onBack: () => void;
  onPlayGame: (game: Game) => void;
  onEditGame: (game: Game) => void;
  onCreateNewGame: () => void;
}

export const MemberProfilePage: React.FC<MemberProfilePageProps> = ({
  initialTab = 'games',
  onBack,
  onPlayGame,
  onEditGame,
  onCreateNewGame,
}) => {
  const {
    currentUser,
    role,
    quota,
    isAdmin,
    isPremium,
    isMember,
    updateProfile,
    changePassword,
    signOut,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Games state
  const [myGames, setMyGames] = useState<Game[]>([]);
  const [gameFilter, setGameFilter] = useState<'all' | 'private' | 'pending' | 'public'>('all');
  const [gameFeedback, setGameFeedback] = useState<string | null>(null);

  // History state
  const [matchHistory, setMatchHistory] = useState<GameHistoryRecord[]>([]);

  // Profile Info form state
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [schoolName, setSchoolName] = useState(currentUser?.schoolName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState<string | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);

  // Change Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Load games and history
  const reloadData = () => {
    if (currentUser?.email) {
      const games = getMyGames(currentUser.email);
      setMyGames(games);

      const allHistories = getGameHistory();
      // Filter histories that belong to this teacher or match teacher email
      const userHistories = allHistories.filter(
        h => !h.teacherEmail || h.teacherEmail.toLowerCase() === currentUser.email.toLowerCase()
      );
      setMatchHistory(userHistories.length > 0 ? userHistories : allHistories);
    }
  };

  useEffect(() => {
    reloadData();
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || '');
      setSchoolName(currentUser.schoolName || '');
      setEmail(currentUser.email || '');
    }
  }, [currentUser]);

  // Handle submit private game for admin public approval
  const handleSubmitApproval = (gameId: string) => {
    sounds.playCorrect();
    submitGameForApproval(gameId);
    setGameFeedback('Đã gửi bộ câu hỏi sang hàng đợi duyệt của Quản trị viên!');
    reloadData();
    setTimeout(() => setGameFeedback(null), 4000);
  };

  // Handle delete game
  const handleDeleteGame = (gameId: string, title: string) => {
    if (window.confirm(`Cô có chắc chắn muốn xóa bộ câu hỏi "${title}" không?`)) {
      sounds.playClick();
      deleteGame(gameId);
      reloadData();
    }
  };

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setInfoLoading(true);
    setInfoSuccess(null);
    setInfoError(null);

    const res = await updateProfile({
      fullName,
      schoolName,
      email,
    });

    setInfoLoading(false);
    if (res.success) {
      sounds.playFanfare();
      setInfoSuccess('Cập nhật thông tin cá nhân thành công!');
      setTimeout(() => setInfoSuccess(null), 4000);
    } else {
      sounds.playWrong();
      setInfoError(res.error || 'Có lỗi xảy ra khi cập nhật.');
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setPasswordLoading(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      sounds.playWrong();
      setPasswordError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      setPasswordLoading(false);
      return;
    }

    const res = await changePassword(currentPassword, newPassword);
    setPasswordLoading(false);

    if (res.success) {
      sounds.playFanfare();
      setPasswordSuccess('Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của cô.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } else {
      sounds.playWrong();
      setPasswordError(res.error || 'Đổi mật khẩu không thành công.');
    }
  };

  // Filtered games
  const filteredGames = myGames.filter(g => {
    if (gameFilter === 'private') return g.visibility === 'private' || !g.visibility;
    if (gameFilter === 'pending') return g.visibility === 'pending_approval';
    if (gameFilter === 'public') return g.visibility === 'public';
    return true;
  });

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">Chưa đăng nhập tài khoản</h2>
        <p className="text-sm text-slate-500 mb-6">
          Vui lòng đăng nhập tài khoản giáo viên để xem trang cá nhân và lịch sử bài giảng.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm transition"
        >
          Quay về trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-16">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onBack();
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-extrabold text-xs sm:text-sm border border-slate-200 transition active:scale-95 cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang chủ</span>
        </button>

        <button
          type="button"
          onClick={async () => {
            sounds.playClick();
            if (window.confirm('Cô có chắc chắn muốn đăng xuất tài khoản?')) {
              await signOut();
              onBack();
            }
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs transition active:scale-95 cursor-pointer border border-rose-200"
        >
          <span>Đăng xuất</span>
        </button>
      </div>

      {/* User Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 rounded-l-full pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left">
          {/* Avatar Icon */}
          <div
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center text-3xl sm:text-4xl font-black shadow-xl shrink-0 ${
              isAdmin
                ? 'bg-rose-500 text-white ring-4 ring-rose-300/40'
                : isPremium
                ? 'bg-amber-400 text-slate-900 ring-4 ring-amber-300/40'
                : 'bg-white text-indigo-700 ring-4 ring-white/30'
            }`}
          >
            {isAdmin ? '👑' : isPremium ? '⭐' : currentUser.fullName.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{currentUser.fullName}</h1>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white uppercase tracking-wider shadow-sm">
                  <Shield className="w-3.5 h-3.5 fill-current" />
                  Tổng Quản Trị
                </span>
              )}
              {isPremium && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 uppercase tracking-wider shadow-sm">
                  <Crown className="w-3.5 h-3.5 fill-current text-slate-900" />
                  VIP Premium
                </span>
              )}
              {isMember && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-white/20 text-white uppercase tracking-wider backdrop-blur-xs">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Giáo Viên Member
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-indigo-100 flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 opacity-80" />
                {currentUser.email}
              </span>
              {currentUser.schoolName && (
                <span className="flex items-center gap-1">
                  <School className="w-3.5 h-3.5 opacity-80" />
                  {currentUser.schoolName}
                </span>
              )}
            </p>

            {/* Quota overview pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/15 text-xs">
              <div className="bg-black/15 rounded-2xl p-2.5 backdrop-blur-xs">
                <span className="text-[10px] text-indigo-200 block uppercase font-bold">Hạn mức câu hỏi</span>
                <span className="font-black text-sm">
                  {quota.maxQuestionsPerGame === Infinity ? 'Không giới hạn (VIP)' : `${quota.maxQuestionsPerGame} câu / bộ`}
                </span>
              </div>
              <div className="bg-black/15 rounded-2xl p-2.5 backdrop-blur-xs">
                <span className="text-[10px] text-indigo-200 block uppercase font-bold">Phòng cùng lúc</span>
                <span className="font-black text-sm">
                  {quota.maxActiveRooms === Infinity ? 'Không giới hạn (VIP)' : `${quota.maxActiveRooms} phòng tối đa`}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-black/15 rounded-2xl p-2.5 backdrop-blur-xs">
                <span className="text-[10px] text-indigo-200 block uppercase font-bold">Bộ câu hỏi đã tạo</span>
                <span className="font-black text-sm">{myGames.length} bộ đề</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setActiveTab('games');
          }}
          className={`py-3 px-4 font-black text-xs sm:text-sm flex items-center gap-2 border-b-2 transition cursor-pointer shrink-0 ${
            activeTab === 'games'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-2xl'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Bộ câu hỏi đã tạo ({myGames.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setActiveTab('history');
          }}
          className={`py-3 px-4 font-black text-xs sm:text-sm flex items-center gap-2 border-b-2 transition cursor-pointer shrink-0 ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-2xl'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Lịch sử phòng thi đấu ({matchHistory.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setActiveTab('info');
          }}
          className={`py-3 px-4 font-black text-xs sm:text-sm flex items-center gap-2 border-b-2 transition cursor-pointer shrink-0 ${
            activeTab === 'info'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-2xl'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Thông tin cá nhân & Email</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            setActiveTab('password');
          }}
          className={`py-3 px-4 font-black text-xs sm:text-sm flex items-center gap-2 border-b-2 transition cursor-pointer shrink-0 ${
            activeTab === 'password'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-2xl'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Đổi mật khẩu</span>
        </button>
      </div>

      {/* Feedback banner */}
      {gameFeedback && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{gameFeedback}</span>
        </div>
      )}

      {/* TAB 1: CREATED QUESTION SETS */}
      {activeTab === 'games' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter buttons */}
            <div className="flex bg-slate-100 p-1 rounded-2xl self-start">
              <button
                type="button"
                onClick={() => setGameFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  gameFilter === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Tất cả ({myGames.length})
              </button>
              <button
                type="button"
                onClick={() => setGameFilter('private')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  gameFilter === 'private' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Riêng tư
              </button>
              <button
                type="button"
                onClick={() => setGameFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  gameFilter === 'pending' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Chờ duyệt
              </button>
              <button
                type="button"
                onClick={() => setGameFilter('public')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  gameFilter === 'public' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Đã công khai
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onCreateNewGame();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-200 transition active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo bộ câu hỏi mới</span>
            </button>
          </div>

          {filteredGames.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-500 mx-auto flex items-center justify-center mb-3">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-800 mb-1">
                {gameFilter === 'all'
                  ? 'Cô chưa tạo bộ câu hỏi nào'
                  : 'Không có bộ câu hỏi phù hợp bộ lọc'}
              </h3>
              <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto">
                Cô có thể tạo các bộ câu hỏi trắc nghiệm, ghép chữ, hoặc trò chơi kéo thả dành riêng cho lớp của mình.
              </p>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onCreateNewGame();
                }}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition"
              >
                Bắt đầu tạo câu hỏi
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGames.map((game) => {
                const isPending = game.visibility === 'pending_approval';
                const isPublic = game.visibility === 'public';
                const isPrivate = !isPending && !isPublic;

                return (
                  <div
                    key={game.id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Status badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[11px] font-extrabold text-slate-400">
                          {game.category || 'Mầm non'} • {game.targetAge || '5-6 tuổi'}
                        </span>

                        {isPending && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Chờ Admin duyệt
                          </span>
                        )}
                        {isPublic && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Đã công khai
                          </span>
                        )}
                        {isPrivate && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Riêng tư lớp học
                          </span>
                        )}
                      </div>

                      <h4 className="font-black text-slate-900 text-base mb-1 line-clamp-1">{game.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                        {game.description || 'Bộ câu hỏi tương tác dành cho bé mầm non'}
                      </p>

                      {/* Rejection notice if any */}
                      {game.rejectionReason && (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] mb-3 leading-snug">
                          <span className="font-bold">Lý do từ chối: </span>
                          {game.rejectionReason}
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-xs text-slate-500 font-bold mb-4">
                        <span className="flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                          {game.questions?.length || 0} câu hỏi
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-emerald-500" />
                          {game.playCount || 0} lượt dạy
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            onPlayGame(game);
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Mở phòng dạy</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            onEditGame(game);
                          }}
                          className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                          title="Chỉnh sửa câu hỏi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteGame(game.id, game.title)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                          title="Xóa bộ câu hỏi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {isPrivate && (
                        <button
                          type="button"
                          onClick={() => handleSubmitApproval(game.id)}
                          className="w-full py-1.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer border border-amber-200"
                        >
                          <Send className="w-3 h-3 text-amber-600" />
                          <span>Gửi Admin duyệt công khai</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MATCH & ROOM HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Stats summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Tổng số phòng đã dạy</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">{matchHistory.length}</div>
              <p className="text-[11px] text-slate-400 mt-1">Các phiên học đã hoàn thành</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Tổng lượt đội tham gia</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {matchHistory.reduce((acc, h) => acc + (h.teamsCount || 0), 0)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Đội chơi học sinh trong lớp</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Đội vô địch gần nhất</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                  <Trophy className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg font-black text-slate-900 truncate">
                {matchHistory[0]?.winnerTeamName || 'Chưa có'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {matchHistory[0] ? `${matchHistory[0].winnerScore} điểm` : 'Chưa có lượt chơi'}
              </p>
            </div>
          </div>

          {matchHistory.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center mb-3">
                <History className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-800 mb-1">Chưa có lịch sử phòng thi đấu</h3>
              <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                Khi cô mở phòng học và cùng các bé hoàn thành các câu đố, kết quả và danh sách đội chiến thắng sẽ được ghi nhận tại đây.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="p-4 bg-slate-50/80 border-b border-slate-200 font-black text-xs text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Danh sách các phòng thi đấu ({matchHistory.length})</span>
                <span className="text-[11px] font-bold text-slate-400 normal-case">Tự động lưu sau mỗi trận</span>
              </div>

              <div className="divide-y divide-slate-100">
                {matchHistory.map((rec) => (
                  <div key={rec.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-lg font-mono font-black text-xs bg-indigo-100 text-indigo-700 tracking-wider">
                          PIN {rec.roomCode}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-sm truncate">{rec.gameTitle}</h4>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(rec.date).toLocaleString('vi-VN')}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-slate-600">
                          <Users className="w-3.5 h-3.5 text-indigo-500" />
                          {rec.teamsCount} đội chơi
                        </span>
                        <span className="flex items-center gap-1 font-bold text-slate-600">
                          <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
                          {rec.questionsCount} câu hỏi
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {rec.winnerTeamName && (
                        <div className="text-right sm:text-right bg-amber-50 px-3 py-1.5 rounded-2xl border border-amber-200">
                          <span className="text-[10px] font-bold text-amber-700 block uppercase">Đội Vô Địch 🏆</span>
                          <span className="text-xs font-black text-amber-900">
                            {rec.winnerTeamName} ({rec.winnerScore} đ)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PERSONAL INFO & EMAIL */}
      {activeTab === 'info' && (
        <div className="max-w-2xl bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
          <div className="mb-6">
            <h3 className="text-lg font-black text-slate-900">Thông tin cá nhân & Tài khoản</h3>
            <p className="text-xs text-slate-500 mt-1">
              Cô có thể cập nhật họ tên hiển thị trên chứng nhận, trường mầm non và email đăng nhập.
            </p>
          </div>

          {infoSuccess && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{infoSuccess}</span>
            </div>
          )}

          {infoError && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{infoError}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Họ và tên Giáo viên:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="VD: Cô Mai Linh"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Trường Mầm Non / Đơn vị công tác:
              </label>
              <div className="relative">
                <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="VD: Trường Mầm Non Hoa Sen"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Địa chỉ Email đăng nhập:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="VD: cogiaomamnon@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Lưu ý: Nếu đổi email, lần đăng nhập sau cô hãy dùng email mới này.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={infoLoading}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-200 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{infoLoading ? 'Đang lưu thay đổi...' : 'LƯU THAY ĐỔI THÔNG TIN'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: CHANGE PASSWORD */}
      {activeTab === 'password' && (
        <div className="max-w-2xl bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
          <div className="mb-6">
            <h3 className="text-lg font-black text-slate-900">Đổi mật khẩu tài khoản</h3>
            <p className="text-xs text-slate-500 mt-1">
              Bảo vệ tài khoản và kho câu hỏi của cô bằng mật khẩu bảo mật (tối thiểu 6 ký tự).
            </p>
          </div>

          {passwordSuccess && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mật khẩu hiện tại:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại (mặc định 123456)"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mật khẩu mới:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Xác nhận mật khẩu mới:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-200 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{passwordLoading ? 'Đang cập nhật mật khẩu...' : 'CẬP NHẬT MẬT KHẨU MỚI'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
