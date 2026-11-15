import React, { useState, useEffect } from 'react';
import {
  User,
  Users,
  BookOpen,
  History,
  Settings,
  LogOut,
  Plus,
  Play,
  Edit3,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Grid,
  BookMarked,
  Gamepad2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Game } from '../../types/game';
import {
  getMyGames,
  getGameHistory,
  GameHistoryRecord,
  deleteGame,
  getAllGames,
  isGameVisibleToUser,
} from '../../services/gameStorage';
import { sounds } from '../../utils/sound';
import { Modal } from '../common/Modal';

export type ProfileTab = 'info' | 'classes' | 'games' | 'history' | 'password';

interface TeacherClass {
  id: string;
  name: string;
  studentsCount: number;
}

const DEFAULT_CLASSES: TeacherClass[] = [
  { id: 'cls_1', name: 'Lớp Lá 1', studentsCount: 15 },
  { id: 'cls_2', name: 'Lớp Lá 2', studentsCount: 18 },
  { id: 'cls_3', name: 'Lớp Lá 3', studentsCount: 16 },
];

interface MemberProfilePageProps {
  initialTab?: ProfileTab;
  onBack: () => void;
  onPlayGame: (game: Game) => void;
  onEditGame: (game: Game) => void;
  onCreateNewGame: () => void;
}

export const MemberProfilePage: React.FC<MemberProfilePageProps> = ({
  initialTab = 'info',
  onBack,
  onPlayGame,
  onEditGame,
  onCreateNewGame,
}) => {
  const {
    currentUser,
    isAdmin,
    isPremium,
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

  // Classes state (stored in localStorage)
  const [classes, setClasses] = useState<TeacherClass[]>(() => {
    try {
      const saved = localStorage.getItem('vuihoc_teacher_classes');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_CLASSES;
  });

  const saveClasses = (newList: TeacherClass[]) => {
    setClasses(newList);
    try {
      localStorage.setItem('vuihoc_teacher_classes', JSON.stringify(newList));
    } catch (e) {}
  };

  // Add / Edit class modal state
  const [editingClass, setEditingClass] = useState<TeacherClass | null>(null);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [classNameInput, setClassNameInput] = useState('');
  const [studentsCountInput, setStudentsCountInput] = useState('15');

  const handleOpenAddClass = () => {
    sounds.playClick();
    setEditingClass(null);
    setClassNameInput('');
    setStudentsCountInput('15');
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls: TeacherClass) => {
    sounds.playClick();
    setEditingClass(cls);
    setClassNameInput(cls.name);
    setStudentsCountInput(String(cls.studentsCount));
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playCorrect();
    const count = parseInt(studentsCountInput, 10) || 15;
    if (editingClass) {
      const updated = classes.map((c) =>
        c.id === editingClass.id ? { ...c, name: classNameInput.trim() || c.name, studentsCount: count } : c
      );
      saveClasses(updated);
    } else {
      const newCls: TeacherClass = {
        id: `cls_${Date.now()}`,
        name: classNameInput.trim() || `Lớp Mới ${classes.length + 1}`,
        studentsCount: count,
      };
      saveClasses([...classes, newCls]);
    }
    setIsClassModalOpen(false);
  };

  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const handleDeleteClass = (id: string, name: string) => {
    setConfirmModal({
      title: 'Xóa lớp học?',
      message: `Cô có chắc chắn muốn xóa lớp "${name}" không?`,
      onConfirm: () => {
        sounds.playClick();
        saveClasses(classes.filter((c) => c.id !== id));
      },
    });
  };

  // Games state
  const [myGames, setMyGames] = useState<Game[]>([]);
  const [templateGames, setTemplateGames] = useState<Game[]>([]);
  const [questionTab, setQuestionTab] = useState<'my_packs' | 'template_library'>('my_packs');
  const [matchHistory, setMatchHistory] = useState<GameHistoryRecord[]>([]);

  // Password & Info states
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reloadData = () => {
    const visibleAll = getAllGames().filter((g) => isGameVisibleToUser(g, currentUser, isAdmin));
    setTemplateGames(visibleAll);
    if (currentUser?.email) {
      const games = getMyGames(currentUser.email);
      setMyGames(games.length > 0 ? games : visibleAll.slice(0, 6));
    } else {
      setMyGames(visibleAll.slice(0, 6));
    }
    const histories = getGameHistory();
    setMatchHistory(histories);
  };

  useEffect(() => {
    setFullName(currentUser?.fullName || '');
    setEmail(currentUser?.email || '');
    reloadData();
  }, [currentUser, isAdmin]);

  const handleDeleteGameItem = (gameId: string, title: string) => {
    setConfirmModal({
      title: 'Xóa bộ câu hỏi?',
      message: `Cô có chắc chắn muốn xóa bộ câu hỏi "${title}" không?`,
      onConfirm: () => {
        sounds.playClick();
        deleteGame(gameId);
        reloadData();
      },
    });
  };

  const handleSaveProfileInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setErrorMessage(null);
    const res = await updateProfile({ fullName, email });
    if (res.success) {
      sounds.playFanfare();
      setInfoMessage('Cập nhật thông tin thành công!');
      setTimeout(() => setInfoMessage(null), 3500);
    } else {
      setErrorMessage(res.error || 'Cập nhật thông tin không thành công.');
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setErrorMessage(null);
    const res = await changePassword(currentPassword, newPassword);
    if (res.success) {
      sounds.playFanfare();
      setInfoMessage('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setInfoMessage(null), 3500);
    } else {
      setErrorMessage(res.error || 'Đổi mật khẩu không thành công.');
    }
  };

  const displayedGames = questionTab === 'my_packs' ? myGames : templateGames;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 select-none text-[#10234D]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT SIDEBAR (Screen 5 in mockup) ================= */}
        <aside className="lg:col-span-3 space-y-4">
          {/* Teacher Profile Card matching Screen 5 */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-[#FF2780] to-[#F472B6] shrink-0 shadow-xs">
                <img
                  src="/assets/aistudio/avatar_teacher_clean.png"
                  alt="Cô Mai Linh"
                  className="w-full h-full object-cover rounded-full bg-white"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-[#10234D] text-sm sm:text-base truncate leading-tight">
                  {currentUser?.fullName || 'Cô Mai Linh'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {isAdmin ? 'Quản trị viên' : isPremium ? 'Giáo viên VIP' : 'Giáo viên'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Menu matching Screen 5 */}
          <div className="bg-white rounded-3xl p-2.5 border border-slate-200/80 shadow-2xs space-y-1 text-xs sm:text-sm font-bold">
            {/* 1. Trang cá nhân */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setActiveTab('info');
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-2xl flex items-center gap-3 transition cursor-pointer ${
                activeTab === 'info'
                  ? 'bg-[#EFF8FF] text-[#087CF5] font-extrabold shadow-2xs'
                  : 'text-[#10234D] hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4 text-inherit" />
              <span>Trang cá nhân</span>
            </button>

            {/* 2. Quản lí lớp học */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setActiveTab('classes');
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-2xl flex items-center gap-3 transition cursor-pointer ${
                activeTab === 'classes'
                  ? 'bg-[#EFF8FF] text-[#087CF5] font-extrabold shadow-2xs'
                  : 'text-[#10234D] hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4 text-inherit" />
              <span>Quản lí lớp học</span>
            </button>

            {/* 3. Bộ câu hỏi của tôi */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setActiveTab('games');
                setQuestionTab('my_packs');
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-2xl flex items-center gap-3 transition cursor-pointer ${
                activeTab === 'games'
                  ? 'bg-[#EFF8FF] text-[#087CF5] font-extrabold shadow-2xs'
                  : 'text-[#10234D] hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-inherit" />
              <span>Bộ câu hỏi của tôi</span>
            </button>

            {/* 4. Lịch sử chơi */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setActiveTab('history');
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-2xl flex items-center gap-3 transition cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-[#EFF8FF] text-[#087CF5] font-extrabold shadow-2xs'
                  : 'text-[#10234D] hover:bg-slate-50'
              }`}
            >
              <Clock className="w-4 h-4 text-inherit" />
              <span>Lịch sử chơi</span>
            </button>

            {/* 5. Cài đặt tài khoản */}
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setActiveTab('password');
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-2xl flex items-center gap-3 transition cursor-pointer ${
                activeTab === 'password'
                  ? 'bg-[#EFF8FF] text-[#087CF5] font-extrabold shadow-2xs'
                  : 'text-[#10234D] hover:bg-slate-50'
              }`}
            >
              <Settings className="w-4 h-4 text-inherit" />
              <span>Cài đặt tài khoản</span>
            </button>

            {/* 6. Đăng xuất */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setConfirmModal({
                    title: 'Đăng xuất tài khoản?',
                    message: 'Cô có chắc chắn muốn đăng xuất tài khoản này không?',
                    onConfirm: async () => {
                      await signOut();
                      onBack();
                    },
                  });
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-2xl text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ================= RIGHT MAIN AREA ================= */}
        <div className="lg:col-span-9 space-y-6">
          {/* Notification banners */}
          {infoMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ================= SCREEN 5 VIEW: TRANG CÁ NHÂN & LỚP HỌC ================= */}
          {(activeTab === 'info' || activeTab === 'classes') && (
            <div className="space-y-6">
              {/* Top Banner with Teacher Reading Illustration matching Screen 5 */}
              <div className="relative rounded-3xl bg-[#EFF8FF] border border-[#BAE6FD] p-6 sm:p-8 flex items-center justify-between overflow-hidden shadow-xs">
                <div className="relative z-10 max-w-md">
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#087CF5] text-white flex items-center justify-center shadow-xs">
                      <User className="w-5 h-5" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-[#10234D] tracking-tight">
                      Trang cá nhân
                    </h1>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-slate-500">
                    Quản lí tài khoản, lớp học và bộ câu hỏi của bạn.
                  </p>
                </div>

                {/* Teacher reading artwork right */}
                <div className="hidden sm:block absolute right-4 bottom-0 top-0 w-44 pointer-events-none">
                  <img
                    src="/assets/aistudio/teacher_reading_clean.png"
                    alt="Cô giáo đọc sách"
                    className="w-full h-full object-contain object-bottom"
                  />
                </div>
              </div>

              {/* 3 Summary Cards matching Screen 5 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                {/* Card 1: Quản lí lớp học (Yellow) */}
                <div
                  onClick={() => setActiveTab('classes')}
                  className="bg-[#FEFCE8] border border-[#FEF08A] rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-2xs hover:shadow-xs transition cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#FBBF24] text-white flex items-center justify-center shadow-2xs shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs text-slate-600 font-bold">Quản lí lớp học</h4>
                    <p className="text-lg sm:text-xl font-black text-[#10234D] mt-0.5 leading-tight">
                      {classes.length} lớp
                    </p>
                  </div>
                </div>

                {/* Card 2: Bộ câu hỏi của tôi (Purple) */}
                <div
                  onClick={() => {
                    setActiveTab('games');
                    setQuestionTab('my_packs');
                  }}
                  className="bg-[#FAF5FF] border border-[#E9D5FF] rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-2xs hover:shadow-xs transition cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6] text-white flex items-center justify-center shadow-2xs shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs text-slate-600 font-bold">Bộ câu hỏi của tôi</h4>
                    <p className="text-lg sm:text-xl font-black text-[#10234D] mt-0.5 leading-tight">
                      {myGames.length} bộ đề
                    </p>
                  </div>
                </div>

                {/* Card 3: Lịch sử chơi (Green) */}
                <div
                  onClick={() => setActiveTab('history')}
                  className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-2xs hover:shadow-xs transition cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#16A34A] text-white flex items-center justify-center shadow-2xs shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs text-slate-600 font-bold">Lịch sử chơi</h4>
                    <p className="text-lg sm:text-xl font-black text-[#10234D] mt-0.5 leading-tight">
                      {matchHistory.length} lượt
                    </p>
                  </div>
                </div>
              </div>

              {/* Section: Lớp học của tôi */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-black text-[#10234D]">
                    Lớp học của tôi
                  </h3>

                  <button
                    type="button"
                    onClick={handleOpenAddClass}
                    className="px-4 py-2 rounded-2xl bg-[#087CF5] hover:bg-[#0066D6] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tạo lớp mới</span>
                  </button>
                </div>

                {/* Class List items matching Screen 5 */}
                <div className="space-y-3">
                  {classes.map((cls, idx) => {
                    const colorBgs = [
                      'bg-[#DCFCE7] text-[#16A34A]',
                      'bg-[#FEF9C3] text-[#CA8A04]',
                      'bg-[#FCE7F3] text-[#DB2777]',
                    ];
                    const iconColor = colorBgs[idx % colorBgs.length];

                    return (
                      <div
                        key={cls.id}
                        className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#087CF5]/40 flex items-center justify-between gap-3 shadow-2xs transition"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`w-11 h-11 rounded-2xl ${iconColor} flex items-center justify-center shrink-0`}>
                            <Users className="w-5 h-5 fill-current" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base text-[#10234D]">
                              {cls.name}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium">
                              {cls.studentsCount} học sinh
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditClass(cls)}
                            className="p-2 rounded-xl text-slate-400 hover:text-[#087CF5] hover:bg-sky-50 transition cursor-pointer"
                            title="Sửa lớp"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClass(cls.id, cls.name)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                            title="Xóa lớp"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= SCREEN 6 VIEW: BỘ CÂU HỎI CỦA TÔI ================= */}
          {activeTab === 'games' && (
            <div className="space-y-5">
              {/* Top Header matching Screen 6 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#FF2780] text-white flex items-center justify-center shadow-xs shrink-0">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-[#10234D] tracking-tight">
                      Bộ câu hỏi của tôi
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Tạo, quản lí và sử dụng các bộ câu hỏi cho lớp học.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onCreateNewGame();
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-[#087CF5] hover:bg-[#0066D6] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Tạo bộ câu hỏi mới</span>
                </button>
              </div>

              {/* Two Tabs matching Screen 6 */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setQuestionTab('my_packs');
                  }}
                  className={`px-5 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
                    questionTab === 'my_packs'
                      ? 'bg-[#087CF5] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Bộ câu hỏi của tôi
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setQuestionTab('template_library');
                  }}
                  className={`px-5 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
                    questionTab === 'template_library'
                      ? 'bg-[#087CF5] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Thư viện mẫu
                </button>
              </div>

              {/* Table matching Screen 6 */}
              <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#F8FAFC] text-slate-600 font-extrabold text-xs border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Tên bộ câu hỏi</th>
                        <th className="py-3.5 px-4">Chủ đề</th>
                        <th className="py-3.5 px-4 text-center">Số câu</th>
                        <th className="py-3.5 px-4 text-center">Ngày tạo</th>
                        <th className="py-3.5 px-4 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-[#10234D]">
                      {displayedGames.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-slate-400 text-xs font-semibold">
                            Chưa có bộ câu hỏi nào trong mục này. Bấm "Tạo bộ câu hỏi mới" để bắt đầu nhé!
                          </td>
                        </tr>
                      ) : displayedGames.map((item) => (
                        <tr key={item.id} className="hover:bg-[#F8FAFC] transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xl shrink-0">
                                {item.gameType === 'html_game'
                                  ? '🕹️'
                                  : item.gameType === 'drag_drop'
                                  ? '🧩'
                                  : item.gameType === 'word_drag_drop'
                                  ? '🔤'
                                  : '🎮'}
                              </span>
                              <span className="font-bold text-[#10234D]">{item.title}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {item.category || 'Mầm non'}
                          </td>
                          <td className="py-3.5 px-4 text-center tabular-nums font-bold">
                            {item.questions?.length || 0}
                          </td>
                          <td className="py-3.5 px-4 text-center text-slate-500 tabular-nums">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '---'}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-2">
                              {/* Green Play button */}
                              <button
                                type="button"
                                onClick={() => {
                                  sounds.playCorrect();
                                  onPlayGame(item);
                                }}
                                className="w-8 h-8 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white flex items-center justify-center shadow-2xs transition cursor-pointer"
                                title="Chơi ngay"
                              >
                                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                              </button>

                              {/* Blue Edit button */}
                              <button
                                type="button"
                                onClick={() => {
                                  sounds.playClick();
                                  onEditGame(item);
                                }}
                                className="w-8 h-8 rounded-full bg-[#EFF8FF] text-[#087CF5] hover:bg-[#087CF5] hover:text-white flex items-center justify-center transition cursor-pointer"
                                title="Chỉnh sửa"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Red Delete button */}
                              <button
                                type="button"
                                onClick={() => {
                                  sounds.playClick();
                                  handleDeleteGameItem(item.id, item.title);
                                }}
                                className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center transition cursor-pointer"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}



          {/* ================= TAB: LỊCH SỬ CHƠI ================= */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_8px_rgba(16,35,77,0.04)] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#10234D]">
                    Lịch sử phòng chơi
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Các buổi học và kết quả thi đua đã hoàn thành
                  </p>
                </div>
              </div>

              {matchHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                  Chưa có lượt chơi nào được ghi nhận. Khi cô mở phòng học, kết quả sẽ hiển thị ở đây!
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {matchHistory.map((rec) => (
                    <div key={rec.id} className="py-3 sm:py-4 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-[#10234D]">
                          {rec.gameTitle}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Mã phòng: <b className="font-mono text-[#087CF5]">{rec.roomCode}</b> • {new Date(rec.date).toLocaleDateString('vi-VN')} • {rec.teamsCount} đội chơi
                        </p>
                      </div>
                      {rec.winnerTeamName && (
                        <div className="text-right">
                          <span className="text-[10px] text-amber-700 font-bold block uppercase">Vô địch 🏆</span>
                          <span className="text-xs font-black text-amber-900">{rec.winnerTeamName}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB: CÀI ĐẶT TÀI KHOẢN & MẬT KHẨU ================= */}
          {activeTab === 'password' && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_8px_rgba(16,35,77,0.04)] space-y-6 max-w-xl">
              <div>
                <h2 className="text-base sm:text-lg font-black text-[#10234D]">
                  Cài đặt tài khoản & Mật khẩu
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Cập nhật mật khẩu bảo mật cho tài khoản của cô.
                </p>
              </div>

              <form onSubmit={handleSavePassword} className="space-y-4 text-xs font-bold">
                <div>
                  <label className="block text-slate-700 mb-1.5">Mật khẩu hiện tại:</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#10234D] focus:outline-none focus:border-[#087CF5]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1.5">Mật khẩu mới (tối thiểu 6 ký tự):</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#10234D] focus:outline-none focus:border-[#087CF5]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#087CF5] hover:bg-[#076ed9] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>CẬP NHẬT MẬT KHẨU</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Class Create / Edit Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-black text-[#10234D]">
              {editingClass ? 'Chỉnh sửa thông tin lớp' : 'Tạo lớp học mới'}
            </h3>

            <form onSubmit={handleSaveClass} className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">Tên lớp học:</label>
                <input
                  type="text"
                  required
                  value={classNameInput}
                  onChange={(e) => setClassNameInput(e.target.value)}
                  placeholder="Ví dụ: Lớp Lá 4"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#10234D] focus:outline-none focus:border-[#087CF5]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Số học sinh trong lớp:</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  required
                  value={studentsCountInput}
                  onChange={(e) => setStudentsCountInput(e.target.value)}
                  placeholder="Ví dụ: 18"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#10234D] focus:outline-none focus:border-[#087CF5]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#087CF5] hover:bg-[#076ed9] text-white font-bold shadow-xs"
                >
                  Lưu lớp học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={Boolean(confirmModal)}
        title={confirmModal?.title || 'Xác nhận'}
        message={confirmModal?.message || ''}
        confirmText="Xác nhận"
        cancelText="Hủy"
        confirmVariant="danger"
        onConfirm={() => {
          confirmModal?.onConfirm();
          setConfirmModal(null);
        }}
        onCancel={() => setConfirmModal(null)}
      />
    </div>
  );
};
