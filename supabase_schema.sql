-- ==============================================================================
-- KỊCH BẢN KHỞI TẠO CƠ SỞ DỮ LIỆU SUPABASE - VUI HỌC CÙNG CÔ
-- Chạy đoạn mã này trong: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. BẢNG TRÒ CHƠI (GAMES)
CREATE TABLE IF NOT EXISTS public.games (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_image TEXT,
  type TEXT DEFAULT 'quiz',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT true,
  deleted_at BIGINT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index để tìm kiếm nhanh theo giáo viên và thời gian tạo
CREATE INDEX IF NOT EXISTS idx_games_user_id ON public.games(user_id);
CREATE INDEX IF NOT EXISTS idx_games_updated_at ON public.games(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_is_public ON public.games(is_public);

-- 2. BẢNG LỊCH SỬ THI ĐẤU (GAME_HISTORY)
CREATE TABLE IF NOT EXISTS public.game_history (
  id TEXT PRIMARY KEY,
  room_code TEXT NOT NULL,
  game_title TEXT NOT NULL,
  date BIGINT NOT NULL,
  teams_count INT DEFAULT 0,
  questions_count INT DEFAULT 0,
  winner_team_name TEXT DEFAULT '',
  winner_score INT DEFAULT 0,
  teams_summary JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_history_created_by ON public.game_history(created_by);
CREATE INDEX IF NOT EXISTS idx_game_history_room_code ON public.game_history(room_code);

-- 3. KÍCH HOẠT BẢO MẬT PHÂN QUYỀN ROW LEVEL SECURITY (RLS)
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;

-- 4. CHÍNH SÁCH BẢO MẬT (RLS POLICIES) CHO BẢNG GAMES
-- Cho phép bất kỳ ai (kể cả học sinh vào phòng bằng mã PIN) đọc các game công khai hoặc game thuộc về giáo viên
DROP POLICY IF EXISTS "Public and owner read games" ON public.games;
CREATE POLICY "Public and owner read games" ON public.games
  FOR SELECT
  USING (
    is_public = true 
    OR auth.uid() = user_id 
    OR auth.uid() IS NULL
  );

-- Giáo viên đã đăng nhập được tạo game
DROP POLICY IF EXISTS "Authenticated users create games" ON public.games;
CREATE POLICY "Authenticated users create games" ON public.games
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR auth.uid() IS NOT NULL
  );

-- Giáo viên chỉ được sửa game do chính mình tạo (hoặc game công khai nếu là admin)
DROP POLICY IF EXISTS "Owners update own games" ON public.games;
CREATE POLICY "Owners update own games" ON public.games
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Giáo viên xóa game của mình
DROP POLICY IF EXISTS "Owners delete own games" ON public.games;
CREATE POLICY "Owners delete own games" ON public.games
  FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- 5. CHÍNH SÁCH BẢO MẬT CHO BẢNG GAME_HISTORY
DROP POLICY IF EXISTS "Allow all read game_history" ON public.game_history;
CREATE POLICY "Allow all read game_history" ON public.game_history
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all insert game_history" ON public.game_history;
CREATE POLICY "Allow all insert game_history" ON public.game_history
  FOR INSERT WITH CHECK (true);

-- 6. TẠO BUCKET LƯU TRỮ HÌNH ẢNH & FILE GAME (GAME-ASSETS) NẾU CẦN
INSERT INTO storage.buckets (id, name, public)
VALUES ('game-assets', 'game-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Cho phép đọc công khai tệp ảnh/game trong bucket game-assets
DROP POLICY IF EXISTS "Public access to game-assets" ON storage.objects;
CREATE POLICY "Public access to game-assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'game-assets');

-- Cho phép người dùng tải ảnh lên bucket game-assets
DROP POLICY IF EXISTS "Allow uploads to game-assets" ON storage.objects;
CREATE POLICY "Allow uploads to game-assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'game-assets');
