export type QRCardAnswer = 'A' | 'B' | 'C' | 'D';
export type QRDirection = QRCardAnswer;

export interface QRStudent {
  id: string;
  studentCode: string; // e.g. L1-01, STU01
  name: string;
  className: string;
  avatarUrl?: string;
  qrToken: string; // Token encoded in the QR code: e.g. "VHQ:STU_101"
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface QRQuestionOption {
  text: string;
  imageUrl?: string;
}

export interface QRQuestion {
  id: string;
  title: string;
  prompt?: string; // alias for title
  imageUrl?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  options?: {
    A: QRQuestionOption;
    B: QRQuestionOption;
    C: QRQuestionOption;
    D: QRQuestionOption;
  };
  correctAnswer: QRCardAnswer;
  explanation?: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  status?: 'ready' | 'draft';
  soundPrompt?: string;
  points?: number;
  timeLimitSeconds?: number;
}

export interface QRQuestionPack {
  id: string;
  title: string;
  description?: string;
  topic: string;
  targetAge?: string;
  ageGroup?: string;
  coverImage?: string;
  questions: QRQuestion[];
  createdAt: number;
  updatedAt: number;
  authorEmail?: string;
  authorName?: string;
}

export interface QRAnswerSubmission {
  studentId: string;
  studentName: string;
  className?: string;
  studentAvatar?: string;
  answer?: QRCardAnswer;
  selectedAnswer?: QRCardAnswer;
  detectedAngle?: number;
  timestamp: number;
  confidence?: number;
  isConfirmed?: boolean;
  isCorrect?: boolean;
  scoreAwarded?: number;
  pointsAwarded?: number;
}

export interface QRSessionState {
  roomCode: string; // 5-6 characters, e.g. "QR101"
  title: string;
  className: string;
  students: QRStudent[];
  pack: QRQuestionPack;
  currentQIndex: number;
  isAcceptingAnswers: boolean;
  isAnswerRevealed: boolean;
  pointsPerQuestion: number;
  timeLimit: number; // 0 for untimed
  answers: Record<string, QRAnswerSubmission>; // studentId -> submission
  updatedAt: number;
}

export interface QRStudentSummaryRecord {
  studentId: string;
  studentName: string;
  className?: string;
  avatarUrl?: string;
  correctCount: number;
  totalCount?: number;
  totalScore: number;
  answersList?: Array<{
    questionId: string;
    questionTitle: string;
    chosenAnswer: QRCardAnswer;
    correctAnswer: QRCardAnswer;
    isCorrect: boolean;
  }>;
}

export interface QRSessionHistoryRecord {
  id: string;
  sessionCode?: string;
  roomCode?: string;
  title?: string;
  packTitle?: string;
  className: string;
  date?: number;
  playedAt: number;
  totalQuestions: number;
  totalStudents: number;
  correctRate?: number;
  overallAccuracy?: number;
  teacherEmail?: string;
  teacherName?: string;
  questionsSnapshot?: QRQuestion[];
  studentSummaries: QRStudentSummaryRecord[];
}
