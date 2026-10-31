import { QRStudent, QRQuestionPack, QRSessionHistoryRecord } from '../types/qrQuiz';
import { supabase, isSupabaseConfigured } from './supabase';

const STUDENTS_STORAGE_KEY = 'vuihoc_qr_students_v1';
const PACKS_STORAGE_KEY = 'vuihoc_qr_question_packs_v1';
const HISTORY_STORAGE_KEY = 'vuihoc_qr_session_history_v1';

// Initial preschool student sample rosters
export const DEFAULT_STUDENTS: QRStudent[] = [
  {
    id: 'stu_101',
    studentCode: 'L1-01',
    name: 'Nguyễn Gia Bảo',
    className: 'Lớp Lá 1 (5-6T)',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=GiaBao',
    qrToken: 'VHQ:STU_101',
    status: 'active',
    createdAt: Date.now() - 20 * 86400000,
    updatedAt: Date.now(),
  },
  {
    id: 'stu_102',
    studentCode: 'L1-02',
    name: 'Trần Bảo Anh',
    className: 'Lớp Lá 1 (5-6T)',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=BaoAnh',
    qrToken: 'VHQ:STU_102',
    status: 'active',
    createdAt: Date.now() - 19 * 86400000,
    updatedAt: Date.now(),
  },
  {
    id: 'stu_103',
    studentCode: 'L1-03',
    name: 'Lê Minh Khang',
    className: 'Lớp Lá 1 (5-6T)',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=MinhKhang',
    qrToken: 'VHQ:STU_103',
    status: 'active',
    createdAt: Date.now() - 18 * 86400000,
    updatedAt: Date.now(),
  },
  {
    id: 'stu_104',
    studentCode: 'L1-04',
    name: 'Phạm Tuệ Nhi',
    className: 'Lớp Lá 1 (5-6T)',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=TueNhi',
    qrToken: 'VHQ:STU_104',
    status: 'active',
    createdAt: Date.now() - 17 * 86400000,
    updatedAt: Date.now(),
  },
  {
    id: 'stu_105',
    studentCode: 'L1-05',
    name: 'Hoàng Nhật Minh',
    className: 'Lớp Lá 1 (5-6T)',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=NhatMinh',
    qrToken: 'VHQ:STU_105',
    status: 'active',
    createdAt: Date.now() - 16 * 86400000,
    updatedAt: Date.now(),
  },
  {
    id: 'stu_106',
    studentCode: 'L1-06',
    name: 'Vũ Thảo Vy',
    className: 'Lớp Lá 1 (5-6T)',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ThaoVy',
    qrToken: 'VHQ:STU_106',
    status: 'active',
    createdAt: Date.now() - 15 * 86400000,
    updatedAt: Date.now(),
  },
  {
    id: 'stu_107',
    studentCode: 'L1-07',
    name: 'Đặng Đăng Khoa',
    className: 'Lớp Lá 1 (5-6T)',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=DangKhoa',
    qrToken: 'VHQ:STU_107',
    status: 'active',
    createdAt: Date.now() - 14 * 86400000,
    updatedAt: Date.now(),
  },
  {
    id: 'stu_108',
    studentCode: 'L1-08',
    name: 'Bùi Khánh Linh',
    className: 'Lớp Lá 1 (5-6T)',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=KhanhLinh',
    qrToken: 'VHQ:STU_108',
    status: 'active',
    createdAt: Date.now() - 13 * 86400000,
    updatedAt: Date.now(),
  },
  {
    id: 'stu_201',
    studentCode: 'C2-01',
    name: 'Phan Minh Anh',
    className: 'Lớp Chồi 2 (4-5T)',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=PhanMinhAnh',
    qrToken: 'VHQ:STU_201',
    status: 'active',
    createdAt: Date.now() - 12 * 86400000,
    updatedAt: Date.now(),
  },
  {
    id: 'stu_202',
    studentCode: 'C2-02',
    name: 'Đỗ Quỳnh Chi',
    className: 'Lớp Chồi 2 (4-5T)',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=QuynhChi',
    qrToken: 'VHQ:STU_202',
    status: 'active',
    createdAt: Date.now() - 11 * 86400000,
    updatedAt: Date.now(),
  },
];

// Initial preschool question packs
export const DEFAULT_QUESTION_PACKS: QRQuestionPack[] = [
  {
    id: 'pack_chu_cai_mam_non',
    title: 'Bé Làm Quen Nhóm Chữ Cái O, Ô, Ơ & A, Ă, Â',
    description: 'Bộ câu hỏi nhận biết chữ cái tiếng Việt với phát âm và hình ảnh sinh động',
    topic: 'Chữ cái',
    targetAge: '5-6 tuổi',
    createdAt: Date.now() - 10 * 86400000,
    updatedAt: Date.now(),
    questions: [
      {
        id: 'q_cc_1',
        title: 'Chữ cái nào tròn như quả trứng gà hả các bé?',
        imageUrl: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=600&auto=format&fit=crop&q=80',
        optionA: 'Chữ O',
        optionB: 'Chữ C',
        optionC: 'Chữ D',
        optionD: 'Chữ E',
        correctAnswer: 'A',
        explanation: 'O tròn như quả trứng gà, ô thì đội mũ, ơ thì thêm râu các bé nhé!',
        topic: 'Chữ cái',
        difficulty: 'easy',
        status: 'ready',
      },
      {
        id: 'q_cc_2',
        title: 'Chữ cái nào giống chữ O nhưng có thêm chiếc "nón đội đầu"?',
        imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=80',
        optionA: 'Chữ A',
        optionB: 'Chữ Ô',
        optionC: 'Chữ Ơ',
        optionD: 'Chữ U',
        correctAnswer: 'B',
        explanation: 'Chữ Ô có nón đội trên đầu rất đáng yêu!',
        topic: 'Chữ cái',
        difficulty: 'easy',
        status: 'ready',
      },
      {
        id: 'q_cc_3',
        title: 'Trong từ "Quả Cam", chữ cái đầu tiên là chữ gì?',
        imageUrl: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=600&auto=format&fit=crop&q=80',
        optionA: 'Chữ M',
        optionB: 'Chữ B',
        optionC: 'Chữ C',
        optionD: 'Chữ L',
        correctAnswer: 'C',
        explanation: '"Quả Cam" có tiếng Cam bắt đầu bằng chữ C!',
        topic: 'Chữ cái',
        difficulty: 'medium',
        status: 'ready',
      },
      {
        id: 'q_cc_4',
        title: 'Bé hãy tìm chữ cái có một nét móc ở bên phải: chữ gì nhỉ?',
        imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        optionA: 'Chữ O',
        optionB: 'Chữ Ô',
        optionC: 'Chữ U',
        optionD: 'Chữ Ơ',
        correctAnswer: 'D',
        explanation: 'Chữ Ơ có một cái râu móc xinh xắn ở góc trên bên phải!',
        topic: 'Chữ cái',
        difficulty: 'medium',
        status: 'ready',
      },
      {
        id: 'q_cc_5',
        title: 'Từ nào dưới đây có chứa chữ "Ă"?',
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
        optionA: 'Cái Cặp',
        optionB: 'Mặt Trăng',
        optionC: 'Con Voi',
        optionD: 'Bông Hoa',
        correctAnswer: 'B',
        explanation: '"Mặt Trăng" có tiếng Trăng chứa chữ Ă!',
        topic: 'Chữ cái',
        difficulty: 'hard',
        status: 'ready',
      },
    ],
  },
  {
    id: 'pack_toan_dem_mam_non',
    title: 'Bé Vui Học Toán & Chữ Số (Đếm 1 Đến 10)',
    description: 'Rèn luyện khả năng đếm số lượng, nhận biết hình học cơ bản',
    topic: 'Toán học',
    targetAge: '4-5 tuổi',
    createdAt: Date.now() - 5 * 86400000,
    updatedAt: Date.now(),
    questions: [
      {
        id: 'q_tm_1',
        title: 'Một bàn tay của bé có bao nhiêu ngón tay nhỉ?',
        imageUrl: 'https://images.unsplash.com/photo-1584441405886-bc91be61e56a?w=600&auto=format&fit=crop&q=80',
        optionA: '3 ngón',
        optionB: '4 ngón',
        optionC: '5 ngón',
        optionD: '6 ngón',
        correctAnswer: 'C',
        explanation: 'Mỗi bàn tay của bé có đúng 5 ngón tay xinh!',
        topic: 'Toán học',
        difficulty: 'easy',
        status: 'ready',
      },
      {
        id: 'q_tm_2',
        title: 'Hình nào có 3 cạnh và 3 góc nhọn?',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
        optionA: 'Hình tròn',
        optionB: 'Hình tam giác',
        optionC: 'Hình vuông',
        optionD: 'Hình chữ nhật',
        correctAnswer: 'B',
        explanation: 'Hình tam giác có 3 cạnh và 3 góc!',
        topic: 'Toán học',
        difficulty: 'easy',
        status: 'ready',
      },
      {
        id: 'q_tm_3',
        title: 'Có 2 quả táo, cô giáo tặng thêm 1 quả táo nữa. Hỏi bé có tất cả mấy quả táo?',
        imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80',
        optionA: '2 quả',
        optionB: '3 quả',
        optionC: '4 quả',
        optionD: '5 quả',
        correctAnswer: 'B',
        explanation: '2 thêm 1 bằng 3 quả táo ngon lành!',
        topic: 'Toán học',
        difficulty: 'easy',
        status: 'ready',
      },
      {
        id: 'q_tm_4',
        title: 'Con số nào giống như một chiếc cần câu cá?',
        imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        optionA: 'Số 1',
        optionB: 'Số 4',
        optionC: 'Số 7',
        optionD: 'Số 9',
        correctAnswer: 'C',
        explanation: 'Số 7 có nét ngang và gạch chéo giống chiếc cần câu cá!',
        topic: 'Toán học',
        difficulty: 'medium',
        status: 'ready',
      },
    ],
  },
  {
    id: 'pack_dong_vat_quanh_be',
    title: 'Khám Phá Thế Giới Động Vật Quanh Bé',
    description: 'Tìm hiểu các loài động vật nuôi trong nhà và trong rừng',
    topic: 'Khám phá thế giới',
    targetAge: '4-6 tuổi',
    createdAt: Date.now() - 3 * 86400000,
    updatedAt: Date.now(),
    questions: [
      {
        id: 'q_dv_1',
        title: 'Con vật nào gáy "Ò ó o o" đánh thức mọi người dậy vào mỗi buổi sáng?',
        imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600&auto=format&fit=crop&q=80',
        optionA: 'Con chó',
        optionB: 'Con gà trống',
        optionC: 'Con vịt',
        optionD: 'Con mèo',
        correctAnswer: 'B',
        explanation: 'Chú gà trống có mào đỏ tươi gáy báo thức buổi sáng!',
        topic: 'Động vật',
        difficulty: 'easy',
        status: 'ready',
      },
      {
        id: 'q_dv_2',
        title: 'Con vật nào có chiếc vòi dài và đôi tai to như chiếc quạt nan?',
        imageUrl: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=600&auto=format&fit=crop&q=80',
        optionA: 'Con voi',
        optionB: 'Con hươu cao cổ',
        optionC: 'Con khỉ',
        optionD: 'Con sư tử',
        correctAnswer: 'A',
        explanation: 'Chú voi to lớn có chiếc vòi dài uống nước và đôi tai phe phẩy!',
        topic: 'Động vật',
        difficulty: 'easy',
        status: 'ready',
      },
      {
        id: 'q_dv_3',
        title: 'Con vật nào bơi lội dưới nước và thở bằng mang?',
        imageUrl: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=600&auto=format&fit=crop&q=80',
        optionA: 'Con thỏ',
        optionB: 'Con mèo',
        optionC: 'Con cá',
        optionD: 'Con chim',
        correctAnswer: 'C',
        explanation: 'Các chú cá bơi tung tăng dưới nước bằng vây và thở bằng mang!',
        topic: 'Động vật',
        difficulty: 'easy',
        status: 'ready',
      },
    ],
  },
];

// In-memory cache
let cachedStudents: QRStudent[] = [];
let cachedPacks: QRQuestionPack[] = [];
let cachedHistory: QRSessionHistoryRecord[] = [];

// Listeners
const studentListeners = new Set<(students: QRStudent[]) => void>();
const packListeners = new Set<(packs: QRQuestionPack[]) => void>();
const historyListeners = new Set<(history: QRSessionHistoryRecord[]) => void>();

function notifyStudentListeners() {
  const current = [...cachedStudents];
  studentListeners.forEach(fn => fn(current));
}

function notifyPackListeners() {
  const current = [...cachedPacks];
  packListeners.forEach(fn => fn(current));
}

function notifyHistoryListeners() {
  const current = [...cachedHistory];
  historyListeners.forEach(fn => fn(current));
}

export function subscribeQRStudents(fn: (students: QRStudent[]) => void): () => void {
  studentListeners.add(fn);
  return () => studentListeners.delete(fn);
}

export function subscribeQRPacks(fn: (packs: QRQuestionPack[]) => void): () => void {
  packListeners.add(fn);
  return () => packListeners.delete(fn);
}

export function subscribeQRHistory(fn: (history: QRSessionHistoryRecord[]) => void): () => void {
  historyListeners.add(fn);
  return () => historyListeners.delete(fn);
}

// Initialize memory cache from localStorage
function initQRStorage() {
  if (typeof window === 'undefined') return;

  // 1. Students
  try {
    const rawStu = localStorage.getItem(STUDENTS_STORAGE_KEY);
    if (rawStu) {
      cachedStudents = JSON.parse(rawStu);
    } else {
      cachedStudents = [...DEFAULT_STUDENTS];
      localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(cachedStudents));
    }
  } catch {
    cachedStudents = [...DEFAULT_STUDENTS];
  }

  // 2. Question Packs
  try {
    const rawPacks = localStorage.getItem(PACKS_STORAGE_KEY);
    if (rawPacks) {
      cachedPacks = JSON.parse(rawPacks);
    } else {
      cachedPacks = [...DEFAULT_QUESTION_PACKS];
      localStorage.setItem(PACKS_STORAGE_KEY, JSON.stringify(cachedPacks));
    }
  } catch {
    cachedPacks = [...DEFAULT_QUESTION_PACKS];
  }

  // 3. History
  try {
    const rawHist = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (rawHist) {
      cachedHistory = JSON.parse(rawHist);
    } else {
      cachedHistory = [];
    }
  } catch {
    cachedHistory = [];
  }
}

initQRStorage();

// ----------------------------------------------------------------------
// STUDENTS API
// ----------------------------------------------------------------------
export function getAllStudents(): QRStudent[] {
  return [...cachedStudents];
}

export function getStudentsByClass(className: string): QRStudent[] {
  if (!className || className === 'all') return cachedStudents;
  return cachedStudents.filter(s => s.className === className);
}

export function getAllClassNames(): string[] {
  const set = new Set(cachedStudents.map(s => s.className).filter(Boolean));
  return Array.from(set);
}

export function getStudentByToken(token: string): QRStudent | undefined {
  const clean = token.trim();
  return cachedStudents.find(
    s => s.qrToken === clean || s.qrToken === `VHQ:${clean}` || s.id === clean
  );
}

export function saveStudent(student: QRStudent): void {
  const index = cachedStudents.findIndex(s => s.id === student.id);
  student.updatedAt = Date.now();
  if (index >= 0) {
    cachedStudents[index] = student;
  } else {
    cachedStudents.push(student);
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(cachedStudents));
  }
  notifyStudentListeners();
}

export function deleteStudent(studentId: string): void {
  cachedStudents = cachedStudents.filter(s => s.id !== studentId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(cachedStudents));
  }
  notifyStudentListeners();
}

export function batchImportStudents(
  newStudents: Array<Omit<QRStudent, 'id' | 'qrToken' | 'createdAt' | 'updatedAt'>>
): number {
  let count = 0;
  const currentMaxNum = cachedStudents.length + 1;

  newStudents.forEach((stu, i) => {
    const id = 'stu_' + Date.now() + '_' + (i + 1);
    const codeNum = String(currentMaxNum + i).padStart(2, '0');
    const studentCode = stu.studentCode || `STU-${codeNum}`;
    const student: QRStudent = {
      ...stu,
      id,
      studentCode,
      qrToken: `VHQ:${id}`,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    cachedStudents.push(student);
    count++;
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(cachedStudents));
  }
  notifyStudentListeners();
  return count;
}

// ----------------------------------------------------------------------
// QUESTION PACKS API
// ----------------------------------------------------------------------
export function getAllQuestionPacks(): QRQuestionPack[] {
  return [...cachedPacks];
}

export function getQuestionPackById(id: string): QRQuestionPack | undefined {
  return cachedPacks.find(p => p.id === id);
}

export function saveQuestionPack(pack: QRQuestionPack): void {
  pack.updatedAt = Date.now();
  const index = cachedPacks.findIndex(p => p.id === pack.id);
  if (index >= 0) {
    cachedPacks[index] = pack;
  } else {
    cachedPacks.unshift(pack);
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(PACKS_STORAGE_KEY, JSON.stringify(cachedPacks));
  }
  notifyPackListeners();
}

export function deleteQuestionPack(id: string): void {
  cachedPacks = cachedPacks.filter(p => p.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(PACKS_STORAGE_KEY, JSON.stringify(cachedPacks));
  }
  notifyPackListeners();
}

// ----------------------------------------------------------------------
// SESSIONS & HISTORY API
// ----------------------------------------------------------------------
export function getAllQRHistory(): QRSessionHistoryRecord[] {
  return [...cachedHistory];
}

export function saveQRSessionHistory(record: QRSessionHistoryRecord): void {
  cachedHistory.unshift(record);
  if (typeof window !== 'undefined') {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(cachedHistory.slice(0, 50)));
  }
  notifyHistoryListeners();

  // Sync to Supabase game_history if configured
  if (supabase && isSupabaseConfigured()) {
    try {
      const insertPromise = supabase.from('game_history').insert({
        id: record.id,
        room_code: record.sessionCode || record.roomCode || '',
        game_title: `[Bảng QR] ${record.title || record.packTitle || 'Trắc nghiệm QR'}`,
        date: record.date || record.playedAt || Date.now(),
        teams_count: 1,
        questions_count: record.totalQuestions,
        winner_team_name: record.className,
        winner_score: Math.round(record.correctRate ?? record.overallAccuracy ?? 0),
        teams_summary: {
          className: record.className,
          correctRate: record.correctRate ?? record.overallAccuracy ?? 0,
          totalStudents: record.totalStudents,
          teacherEmail: record.teacherEmail,
          teacherName: record.teacherName,
          studentSummaries: record.studentSummaries,
        },
      });
      Promise.resolve(insertPromise).catch(() => {});
    } catch {}
  }
}

// ----------------------------------------------------------------------
// CONVENIENCE ALIASES & CSV HELPERS
// ----------------------------------------------------------------------
export const getQRStudents = getAllStudents;
export const getQRQuestionPacks = getAllQuestionPacks;
export const getQRSessionsHistory = getAllQRHistory;

export function deleteQRStudent(studentId: string): void {
  deleteStudent(studentId);
}

export function deleteQRQuestionPack(packId: string): void {
  deleteQuestionPack(packId);
}

export function deleteQRSessionHistory(id: string): void {
  cachedHistory = cachedHistory.filter(h => h.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(cachedHistory));
  }
  notifyHistoryListeners();
}

export function saveQRStudent(input: {
  id?: string;
  name: string;
  className: string;
  avatarUrl?: string;
  notes?: string;
}): QRStudent {
  const existing = input.id ? cachedStudents.find(s => s.id === input.id) : undefined;
  if (existing) {
    const updated: QRStudent = {
      ...existing,
      name: input.name,
      className: input.className,
      avatarUrl: input.avatarUrl ?? existing.avatarUrl,
      notes: input.notes ?? existing.notes,
      updatedAt: Date.now(),
    };
    saveStudent(updated);
    return updated;
  } else {
    const id = 'stu_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const codeNum = String(cachedStudents.length + 1).padStart(2, '0');
    const newStudent: QRStudent = {
      id,
      studentCode: `STU-${codeNum}`,
      name: input.name,
      className: input.className,
      avatarUrl: input.avatarUrl,
      notes: input.notes,
      qrToken: `VHQ:${id}`,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveStudent(newStudent);
    return newStudent;
  }
}

export function saveQRQuestionPack(packData: {
  id?: string;
  title: string;
  description?: string;
  topic: string;
  ageGroup?: string;
  coverImage?: string;
  questions: any[];
}): QRQuestionPack {
  const existing = packData.id ? cachedPacks.find(p => p.id === packData.id) : undefined;
  if (existing) {
    const updated: QRQuestionPack = {
      ...existing,
      title: packData.title,
      description: packData.description ?? existing.description,
      topic: packData.topic,
      ageGroup: packData.ageGroup ?? existing.ageGroup,
      coverImage: packData.coverImage ?? existing.coverImage,
      questions: packData.questions,
      updatedAt: Date.now(),
    };
    saveQuestionPack(updated);
    return updated;
  } else {
    const id = 'pack_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newPack: QRQuestionPack = {
      id,
      title: packData.title,
      description: packData.description || '',
      topic: packData.topic,
      ageGroup: packData.ageGroup || 'Lớp Lá (5-6 tuổi)',
      coverImage: packData.coverImage,
      questions: packData.questions,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveQuestionPack(newPack);
    return newPack;
  }
}

export function importStudentsFromCSV(
  csvText: string,
  defaultClass: string = 'Lớp Lá 1'
): { added: number; errors: string[] } {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const errors: string[] = [];
  const toAdd: Array<Omit<QRStudent, 'id' | 'qrToken' | 'createdAt' | 'updatedAt'>> = [];

  lines.forEach((line, idx) => {
    // Ignore header
    if (idx === 0 && (line.toLowerCase().includes('họ và tên') || line.toLowerCase().includes('name'))) {
      return;
    }
    const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
    const name = parts[0];
    const className = parts[1] || defaultClass;
    const avatarUrl = parts[2] || undefined;

    if (!name) {
      errors.push(`Dòng ${idx + 1}: Thiếu họ tên học sinh.`);
      return;
    }

    toAdd.push({
      name,
      className,
      studentCode: '',
      avatarUrl,
      status: 'active',
    });
  });

  const added = batchImportStudents(toAdd);
  return { added, errors };
}

export function exportStudentsToCSV(className?: string): string {
  const targetStudents = className && className !== 'all'
    ? cachedStudents.filter(s => s.className === className)
    : cachedStudents;

  const header = ['Mã học sinh', 'Họ và tên', 'Lớp', 'Mã QR Token', 'Ghi chú'];
  const rows = targetStudents.map(s => [
    s.studentCode,
    s.name,
    s.className,
    s.qrToken,
    s.notes || '',
  ]);

  return [header, ...rows]
    .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}
