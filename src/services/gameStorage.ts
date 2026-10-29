import { Game } from '../types/game';
import { DEFAULT_GAMES } from '../data/defaultGames';
import { supabase, isSupabaseConfigured } from './supabase';


const STORAGE_KEY = 'vuihoc_custom_games';
const TRASH_STORAGE_KEY = 'vuihoc_trash_games';
const PURGED_DEFAULT_IDS_KEY = 'vuihoc_purged_default_ids';
const IDB_NAME = 'vuihoc_app_db';
const IDB_STORE = 'games';
const IDB_VERSION = 1;

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface GameHistoryRecord {
  id: string;
  gameTitle: string;
  roomCode: string;
  date: number;
  teamsCount: number;
  questionsCount: number;
  winnerTeamName: string;
  winnerScore: number;
  teacherEmail?: string;
  teacherName?: string;
}

// In-memory cache
let cachedGames: Game[] = [];
let cachedTrash: Game[] = [];
let cachedPurgedDefaultIds: Set<string> = new Set();
let isIdbInitialized = false;

const gameListeners = new Set<(games: Game[]) => void>();
const trashListeners = new Set<(trash: Game[]) => void>();

function notifyGameListeners() {
  const current = [...cachedGames];
  gameListeners.forEach(fn => {
    try {
      fn(current);
    } catch (err) {
      console.error('Error notifying game storage listener:', err);
    }
  });
}

function notifyTrashListeners() {
  const current = [...cachedTrash];
  trashListeners.forEach(fn => {
    try {
      fn(current);
    } catch (err) {
      console.error('Error notifying trash listener:', err);
    }
  });
}

export function subscribeGames(listener: (games: Game[]) => void): () => void {
  gameListeners.add(listener);
  return () => {
    gameListeners.delete(listener);
  };
}

export function subscribeTrash(listener: (trash: Game[]) => void): () => void {
  trashListeners.add(listener);
  return () => {
    trashListeners.delete(listener);
  };
}

/**
 * Open or initialize IndexedDB for permanent local storage
 */
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGetAllGames(): Promise<Game[]> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not read from IndexedDB:', err);
    return [];
  }
}

async function idbSaveGame(game: Game): Promise<void> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(game);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not save to IndexedDB:', err);
  }
}

async function idbDeleteGame(id: string): Promise<void> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not delete from IndexedDB:', err);
  }
}

/**
 * Safely writes games to localStorage with automatic compression fallback
 */
function safeSaveGamesToLocalStorage(games: Game[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  } catch {
    try {
      const lightweight = games.map(g => ({
        ...g,
        questions: g.questions.map(q => ({
          ...q,
          htmlContent: q.htmlContent && q.htmlContent.length > 20000 ? undefined : q.htmlContent,
        })),
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweight));
    } catch {
      console.warn('LocalStorage quota limit reached for active games');
    }
  }
}

function safeSaveTrashToLocalStorage(trash: Game[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(trash));
  } catch {
    console.warn('LocalStorage quota limit reached for trash');
  }
}

function savePurgedDefaultIdsToLocalStorage(ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PURGED_DEFAULT_IDS_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

/**
 * Auto-purge items in trash older than 7 days
 */
export function purgeExpiredTrash(): boolean {
  const now = Date.now();
  const initialCount = cachedTrash.length;
  const expired: Game[] = [];
  const valid: Game[] = [];

  for (const item of cachedTrash) {
    if (item.deletedAt && now - item.deletedAt > SEVEN_DAYS_MS) {
      expired.push(item);
    } else {
      valid.push(item);
    }
  }

  if (expired.length > 0) {
    cachedTrash = valid;
    safeSaveTrashToLocalStorage(cachedTrash);

    // Clean from IndexedDB & server
    expired.forEach(g => {
      idbDeleteGame(g.id);
      if (typeof fetch !== 'undefined') {
        fetch(`/api/games/trash/${encodeURIComponent(g.id)}`, { method: 'DELETE' }).catch(() => {});
      }
    });

    notifyTrashListeners();
    return true;
  }
  return initialCount !== valid.length;
}

// Initial synchronous load from localStorage
function initMemoryCache(): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Load purged default IDs to prevent deleted games from resurrecting
    const rawPurged = localStorage.getItem(PURGED_DEFAULT_IDS_KEY);
    if (rawPurged) {
      cachedPurgedDefaultIds = new Set(JSON.parse(rawPurged));
    }

    // 2. Load trash games & purge items > 7 days
    const rawTrash = localStorage.getItem(TRASH_STORAGE_KEY);
    if (rawTrash) {
      const parsedTrash: Game[] = JSON.parse(rawTrash);
      const now = Date.now();
      cachedTrash = parsedTrash.filter(g => g.deletedAt && now - g.deletedAt <= SEVEN_DAYS_MS);
    } else {
      cachedTrash = [];
    }

    const trashIds = new Set(cachedTrash.map(g => g.id));

    // 3. Load active games
    const rawGames = localStorage.getItem(STORAGE_KEY);
    if (rawGames) {
      const parsed: Game[] = JSON.parse(rawGames);
      const existingIds = new Set(parsed.map(g => g.id));

      // Inject defaults only if they have not been deleted/moved to trash or purged
      for (const def of DEFAULT_GAMES) {
        if (!existingIds.has(def.id) && !trashIds.has(def.id) && !cachedPurgedDefaultIds.has(def.id)) {
          parsed.push(def);
        }
      }
      // Ensure all games support up to 12 teams and default games have correct flags
      parsed.forEach(g => {
        if (DEFAULT_GAMES.some(d => d.id === g.id)) {
          g.isSystemDefault = true;
          if (!g.visibility) g.visibility = 'public';
        }
        if (g.settings && (!g.settings.maxTeams || g.settings.maxTeams < 12)) {
          g.settings.maxTeams = 12;
        }
      });
      // Ensure no deleted/trash items sneak into active list
      cachedGames = parsed.filter(g => !g.deletedAt && !trashIds.has(g.id));
      safeSaveGamesToLocalStorage(cachedGames);
    } else {
      // First time load: only defaults that are not in trash/purged
      cachedGames = DEFAULT_GAMES
        .filter(d => !trashIds.has(d.id) && !cachedPurgedDefaultIds.has(d.id))
        .map(d => ({
          ...d,
          isSystemDefault: true,
          visibility: 'public' as const,
        }));
      safeSaveGamesToLocalStorage(cachedGames);
    }
  } catch (err) {
    console.error('Error during initMemoryCache:', err);
    cachedGames = [...DEFAULT_GAMES];
    cachedTrash = [];
  }
}

// Asynchronously load from IndexedDB and server
async function asyncHydrateFromPersistentStores(): Promise<void> {
  if (isIdbInitialized || typeof window === 'undefined') return;
  isIdbInitialized = true;

  try {
    // 1. Load from IndexedDB
    const idbGames = await idbGetAllGames();
    let hasChanges = false;

    if (idbGames && idbGames.length > 0) {
      const activeMap = new Map<string, Game>();
      const trashMap = new Map<string, Game>();

      cachedGames.forEach(g => activeMap.set(g.id, g));
      cachedTrash.forEach(g => trashMap.set(g.id, g));

      idbGames.forEach(g => {
        if (g.deletedAt) {
          const now = Date.now();
          if (now - g.deletedAt <= SEVEN_DAYS_MS) {
            trashMap.set(g.id, g);
            activeMap.delete(g.id);
            hasChanges = true;
          } else {
            // Delete expired permanently
            idbDeleteGame(g.id);
          }
        } else if (!trashMap.has(g.id) && !cachedPurgedDefaultIds.has(g.id)) {
          activeMap.set(g.id, g);
          hasChanges = true;
        }
      });

      cachedGames = Array.from(activeMap.values());
      cachedTrash = Array.from(trashMap.values());
    }

    // 2. Fetch from backend server /api/games/custom and /api/games/trash
    try {
      let customApiUrl = '/api/games/custom';
      if (typeof window !== 'undefined') {
        try {
          const rawUser = localStorage.getItem('vuihoc_current_user_v2');
          if (rawUser) {
            const u = JSON.parse(rawUser);
            const params = new URLSearchParams();
            if (u.email) params.set('userEmail', u.email);
            if (u.id) params.set('userId', u.id);
            if (u.role === 'admin' || (u.email && u.email.toLowerCase() === 'tranthangit2025@gmail.com')) {
              params.set('isAdmin', 'true');
            }
            const qs = params.toString();
            if (qs) customApiUrl += `?${qs}`;
          }
        } catch {}
      }

      const [customRes, trashRes] = await Promise.all([
        fetch(customApiUrl),
        fetch('/api/games/trash'),
      ]);

      if (trashRes.ok) {
        const serverTrash: Game[] = await trashRes.json();
        if (Array.isArray(serverTrash)) {
          const now = Date.now();
          serverTrash.forEach(st => {
            if (st.deletedAt && now - st.deletedAt <= SEVEN_DAYS_MS) {
              const existingIdx = cachedTrash.findIndex(g => g.id === st.id);
              if (existingIdx >= 0) {
                cachedTrash[existingIdx] = st;
              } else {
                cachedTrash.push(st);
              }
              cachedGames = cachedGames.filter(g => g.id !== st.id);
              hasChanges = true;
            }
          });
        }
      }

      if (customRes.ok) {
        const serverGames: Game[] = await customRes.json();
        if (Array.isArray(serverGames)) {
          const trashIds = new Set(cachedTrash.map(g => g.id));
          serverGames.forEach(sg => {
            if (!trashIds.has(sg.id) && !cachedPurgedDefaultIds.has(sg.id)) {
              const existing = cachedGames.find(g => g.id === sg.id);
              if (!existing || !existing.questions?.[0]?.htmlContent) {
                cachedGames = cachedGames.filter(g => g.id !== sg.id);
                cachedGames.push(sg);
                idbSaveGame(sg);
                hasChanges = true;
              }
            }
          });
        }
      }
    } catch {
      // Offline fallback
    }

    // 3. Fetch from Supabase Cloud Database if configured
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data: cloudGames, error } = await supabase
          .from('games')
          .select('*')
          .is('deleted_at', null)
          .order('updated_at', { ascending: false });

        if (!error && Array.isArray(cloudGames)) {
          const trashIds = new Set(cachedTrash.map(g => g.id));
          cloudGames.forEach((cg: any) => {
            if (!trashIds.has(cg.id) && !cachedPurgedDefaultIds.has(cg.id)) {
              const cloudGame: Game = {
                id: cg.id,
                title: cg.title,
                description: cg.description || '',
                theme: cg.theme || 'default',
                category: cg.category || 'default',
                coverImage: cg.cover_image || undefined,
                gameType: cg.type || 'multiple_choice',
                questions: cg.questions || [],
                settings: cg.settings || { timePerQuestion: 30, speedBonus: true, maxTeams: 12, soundEffects: true },
                createdAt: cg.created_at ? new Date(cg.created_at).getTime() : Date.now(),
                playCount: cg.play_count || 0,
              };

              const existingIdx = cachedGames.findIndex(g => g.id === cg.id);
              if (existingIdx >= 0) {
                // If local doesn't have custom questions but cloud does, overwrite
                cachedGames[existingIdx] = cloudGame;
              } else {
                cachedGames.push(cloudGame);
              }
              idbSaveGame(cloudGame);
              hasChanges = true;
            }
          });
        }

      } catch (cloudErr) {
        console.warn('[Supabase] Hydration warning:', cloudErr);
      }
    }


    if (hasChanges) {
      safeSaveGamesToLocalStorage(cachedGames);
      safeSaveTrashToLocalStorage(cachedTrash);
      notifyGameListeners();
      notifyTrashListeners();
    }
  } catch (err) {
    console.warn('Hydration error:', err);
  }
}

// Run initial sync on module evaluation
initMemoryCache();
if (typeof window !== 'undefined') {
  setTimeout(() => {
    purgeExpiredTrash();
    asyncHydrateFromPersistentStores();
  }, 10);
}

export function getAllGames(): Game[] {
  // Only active games, never deleted
  return cachedGames
    .filter(g => !g.deletedAt)
    .map(g => {
      if (g.gameUrl && Array.isArray(g.questions)) {
        g.questions.forEach(q => {
          if (q.type === 'html_game' && !q.gameUrl) {
            q.gameUrl = g.gameUrl;
          }
        });
      }
      return g;
    });
}

export function getTrashGames(): Game[] {
  purgeExpiredTrash();
  return cachedTrash;
}

export function getGameById(id: string): Game | undefined {
  const g = cachedGames.find(g => g.id === id);
  if (g && g.gameUrl && Array.isArray(g.questions)) {
    g.questions.forEach(q => {
      if (q.type === 'html_game' && !q.gameUrl) {
        q.gameUrl = g.gameUrl;
      }
    });
  }
  return g;
}

// ----------------------------------------------------
// SUPABASE ASYNC CLOUD SYNC HELPERS
// ----------------------------------------------------
async function syncGameToSupabase(game: Game) {
  if (!supabase || !isSupabaseConfigured()) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('games').upsert({
      id: game.id,
      user_id: user?.id || null,
      title: game.title,
      description: game.description || '',
      cover_image: game.coverImage || null,
      type: game.gameType || 'quiz',
      questions: game.questions || [],
      settings: game.settings || { maxTeams: 12 },
      is_public: true,
      deleted_at: null,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Supabase] Sync game error:', err);
  }
}

async function syncSoftDeleteToSupabase(id: string) {
  if (!supabase || !isSupabaseConfigured()) return;
  try {
    await supabase.from('games').update({
      deleted_at: Date.now(),
      updated_at: new Date().toISOString(),
    }).eq('id', id);
  } catch (err) {
    console.warn('[Supabase] Soft-delete error:', err);
  }
}

async function syncRestoreToSupabase(id: string) {
  if (!supabase || !isSupabaseConfigured()) return;
  try {
    await supabase.from('games').update({
      deleted_at: null,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
  } catch (err) {
    console.warn('[Supabase] Restore error:', err);
  }
}

async function syncPermanentDeleteToSupabase(id: string) {
  if (!supabase || !isSupabaseConfigured()) return;
  try {
    await supabase.from('games').delete().eq('id', id);
  } catch (err) {
    console.warn('[Supabase] Permanent delete error:', err);
  }
}

export function saveGame(game: Game): void {
  // Ensure game is not in trash
  delete game.deletedAt;
  cachedTrash = cachedTrash.filter(g => g.id !== game.id);
  cachedPurgedDefaultIds.delete(game.id);
  savePurgedDefaultIdsToLocalStorage(cachedPurgedDefaultIds);

  if (game.gameUrl && Array.isArray(game.questions)) {
    game.questions.forEach(q => {
      if (q.type === 'html_game' && !q.gameUrl) {
        q.gameUrl = game.gameUrl;
      }
    });
  }

  // Default visibility and system default flag
  if (!game.visibility) {
    if (game.isSystemDefault || DEFAULT_GAMES.some(d => d.id === game.id)) {
      game.visibility = 'public';
      game.isSystemDefault = true;
    } else {
      game.visibility = 'private';
    }
  }

  const index = cachedGames.findIndex(g => g.id === game.id);
  if (index >= 0) {
    cachedGames[index] = game;
  } else {
    cachedGames.unshift(game);
  }

  safeSaveGamesToLocalStorage(cachedGames);
  safeSaveTrashToLocalStorage(cachedTrash);
  idbSaveGame(game);

  if (typeof fetch !== 'undefined') {
    fetch('/api/games/custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(game),
    }).catch(() => {});
  }

  // Supabase Cloud Sync
  syncGameToSupabase(game);

  notifyGameListeners();
  notifyTrashListeners();
}

/**
 * Moves a game to trash. It will no longer show on the games page,
 * and will be kept for 7 days before auto-deletion.
 */
export function moveToTrash(id: string): void {
  const target = cachedGames.find(g => g.id === id);
  if (!target) return;

  target.deletedAt = Date.now();

  // Remove from active games
  cachedGames = cachedGames.filter(g => g.id !== id);

  // If default game, mark as purged default so it never resurrects on refresh
  const isDefault = DEFAULT_GAMES.some(d => d.id === id);
  if (isDefault) {
    cachedPurgedDefaultIds.add(id);
    savePurgedDefaultIdsToLocalStorage(cachedPurgedDefaultIds);
  }

  // Add to trash list
  cachedTrash = cachedTrash.filter(g => g.id !== id);
  cachedTrash.unshift(target);

  safeSaveGamesToLocalStorage(cachedGames);
  safeSaveTrashToLocalStorage(cachedTrash);
  idbSaveGame(target);

  if (typeof fetch !== 'undefined') {
    fetch(`/api/games/trash/${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(target),
    }).catch(() => {});
  }

  // Supabase Cloud soft-delete
  syncSoftDeleteToSupabase(id);

  notifyGameListeners();
  notifyTrashListeners();
}

/**
 * Backward compatibility alias for moveToTrash
 */
export function deleteGame(id: string): void {
  moveToTrash(id);
}

/**
 * Restores a game from the trash back to active games
 */
export function restoreFromTrash(id: string): void {
  const target = cachedTrash.find(g => g.id === id);
  if (!target) return;

  delete target.deletedAt;
  cachedTrash = cachedTrash.filter(g => g.id !== id);
  cachedPurgedDefaultIds.delete(id);
  savePurgedDefaultIdsToLocalStorage(cachedPurgedDefaultIds);

  cachedGames = cachedGames.filter(g => g.id !== id);
  cachedGames.unshift(target);

  safeSaveGamesToLocalStorage(cachedGames);
  safeSaveTrashToLocalStorage(cachedTrash);
  idbSaveGame(target);

  if (typeof fetch !== 'undefined') {
    fetch(`/api/games/restore/${encodeURIComponent(id)}`, {
      method: 'POST',
    }).catch(() => {});
  }

  // Supabase Cloud restore
  syncRestoreToSupabase(id);

  notifyGameListeners();
  notifyTrashListeners();
}

/**
 * Permanently deletes a game from trash and all storage immediately
 */
export function permanentlyDeleteGame(id: string): void {
  cachedTrash = cachedTrash.filter(g => g.id !== id);
  cachedGames = cachedGames.filter(g => g.id !== id);

  const isDefault = DEFAULT_GAMES.some(d => d.id === id);
  if (isDefault) {
    cachedPurgedDefaultIds.add(id);
    savePurgedDefaultIdsToLocalStorage(cachedPurgedDefaultIds);
  }

  safeSaveGamesToLocalStorage(cachedGames);
  safeSaveTrashToLocalStorage(cachedTrash);
  idbDeleteGame(id);

  if (typeof fetch !== 'undefined') {
    fetch(`/api/games/trash/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch(() => {});
  }

  // Supabase Cloud permanent delete
  syncPermanentDeleteToSupabase(id);

  notifyGameListeners();
  notifyTrashListeners();
}


/**
 * Empties all games from trash permanently
 */
export function emptyTrash(): void {
  const toDelete = [...cachedTrash];
  toDelete.forEach(g => {
    if (DEFAULT_GAMES.some(d => d.id === g.id)) {
      cachedPurgedDefaultIds.add(g.id);
    }
    idbDeleteGame(g.id);
  });

  cachedTrash = [];
  savePurgedDefaultIdsToLocalStorage(cachedPurgedDefaultIds);
  safeSaveTrashToLocalStorage([]);

  if (typeof fetch !== 'undefined') {
    fetch('/api/games/trash', { method: 'DELETE' }).catch(() => {});
  }

  notifyTrashListeners();
}

export function incrementPlayCount(id: string): void {
  const target = cachedGames.find(g => g.id === id);
  if (target) {
    target.playCount = (target.playCount || 0) + 1;
    safeSaveGamesToLocalStorage(cachedGames);
    idbSaveGame(target);
    notifyGameListeners();
  }
}

export function getGameHistory(): GameHistoryRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('vuihoc_game_history');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function syncHistoryToSupabase(record: GameHistoryRecord) {
  if (!supabase || !isSupabaseConfigured()) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('game_history').insert({
      id: record.id,
      room_code: record.roomCode,
      game_title: record.gameTitle,
      date: record.date,
      teams_count: record.teamsCount,
      questions_count: record.questionsCount,
      winner_team_name: record.winnerTeamName,
      winner_score: record.winnerScore,
      created_by: user?.id || null,
    });
  } catch (err) {
    console.warn('[Supabase] History sync error:', err);
  }
}

export function saveGameHistory(record: GameHistoryRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getGameHistory();
    history.unshift(record);
    localStorage.setItem('vuihoc_game_history', JSON.stringify(history.slice(0, 30)));
  } catch {
    try {
      const history = getGameHistory();
      history.unshift(record);
      localStorage.setItem('vuihoc_game_history', JSON.stringify(history.slice(0, 5)));
    } catch {}
  }

  // Supabase Cloud History Sync
  syncHistoryToSupabase(record);
}



// ----------------------------------------------------
// FEATURED & FAVORITE GAMES
// ----------------------------------------------------
const FEATURED_GAME_KEY = 'vuihoc_featured_game_id';
const FAVORITES_KEY = 'vuihoc_favorite_game_ids';

const featuredListeners = new Set<(id: string) => void>();
const favoriteListeners = new Set<(ids: string[]) => void>();

export function getFeaturedGameId(): string {
  if (typeof window === 'undefined') return 'game_chu_h_k';
  try {
    const saved = localStorage.getItem(FEATURED_GAME_KEY);
    return saved || 'game_chu_h_k';
  } catch {
    return 'game_chu_h_k';
  }
}

export function setFeaturedGameId(gameId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FEATURED_GAME_KEY, gameId);
    featuredListeners.forEach(fn => {
      try { fn(gameId); } catch {}
    });
  } catch {}
}

export function subscribeFeaturedGame(listener: (id: string) => void): () => void {
  featuredListeners.add(listener);
  return () => {
    featuredListeners.delete(listener);
  };
}

export function getFavoriteGameIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isGameFavorite(gameId: string): boolean {
  return getFavoriteGameIds().includes(gameId);
}

export function subscribeFavorites(listener: (ids: string[]) => void): () => void {
  favoriteListeners.add(listener);
  return () => {
    favoriteListeners.delete(listener);
  };
}

export function toggleFavoriteGameId(gameId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const favs = getFavoriteGameIds();
    const isFav = favs.includes(gameId);
    const updated = isFav ? favs.filter(id => id !== gameId) : [...favs, gameId];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    favoriteListeners.forEach(fn => {
      try { fn(updated); } catch {}
    });
    return !isFav;
  } catch {
    return false;
  }
}

// ----------------------------------------------------
// ADMIN HOMEPAGE CURATED GAMES (Trò chơi do Quản trị viên ghim trang chủ)
// ----------------------------------------------------
const ADMIN_HOMEPAGE_GAMES_KEY = 'vuihoc_admin_homepage_game_ids';
const adminHomepageListeners = new Set<(ids: string[]) => void>();

export const DEFAULT_ADMIN_HOMEPAGE_IDS = [
  'game_chu_h_k',
  'game_html_u_uw_nghe_nghiep',
  'game_chu_u_u',
  'game_chu_o_o_o',
  'game_toan_dem_1_10',
  'game_dong_vat',
];

export function getAdminHomepageGameIds(): string[] {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_HOMEPAGE_IDS;
  try {
    const raw = localStorage.getItem(ADMIN_HOMEPAGE_GAMES_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_HOMEPAGE_GAMES_KEY, JSON.stringify(DEFAULT_ADMIN_HOMEPAGE_IDS));
      return [...DEFAULT_ADMIN_HOMEPAGE_IDS];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ADMIN_HOMEPAGE_IDS;
  } catch {
    return DEFAULT_ADMIN_HOMEPAGE_IDS;
  }
}

export function setAdminHomepageGameIds(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADMIN_HOMEPAGE_GAMES_KEY, JSON.stringify(ids));
    adminHomepageListeners.forEach(fn => {
      try { fn(ids); } catch {}
    });
  } catch {}
}

export function toggleAdminHomepageGameId(gameId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const list = getAdminHomepageGameIds();
    const isPinned = list.includes(gameId);
    const updated = isPinned ? list.filter(id => id !== gameId) : [...list, gameId];
    setAdminHomepageGameIds(updated);
    return !isPinned;
  } catch {
    return false;
  }
}

export function isGamePinnedOnHomepage(gameId: string): boolean {
  return getAdminHomepageGameIds().includes(gameId);
}

export function subscribeAdminHomepageGames(listener: (ids: string[]) => void): () => void {
  adminHomepageListeners.add(listener);
  return () => {
    adminHomepageListeners.delete(listener);
  };
}

// ----------------------------------------------------
// RBAC VISIBILITY & PUBLIC APPROVAL QUEUE METHODS
// ----------------------------------------------------

/**
 * Submit a game for admin approval to be published publicly site-wide
 */
export function submitGameForApproval(
  gameId: string,
  authorInfo?: { id?: string; name?: string; email?: string }
): Game | null {
  const game = getGameById(gameId);
  if (!game) return null;

  const updated: Game = {
    ...game,
    visibility: 'pending_approval',
    submittedForApprovalAt: Date.now(),
    authorId: authorInfo?.id || game.authorId,
    authorName: authorInfo?.name || game.authorName,
    authorEmail: authorInfo?.email || game.authorEmail,
  };

  saveGame(updated);
  return updated;
}

/**
 * Admin approves a question set for public site-wide visibility
 */
export function approveGame(gameId: string, adminName: string = 'Quản trị viên'): Game | null {
  const game = getGameById(gameId);
  if (!game) return null;

  const updated: Game = {
    ...game,
    visibility: 'public',
    status: 'published',
    approvedAt: Date.now(),
    approvedBy: adminName,
    rejectionReason: undefined,
  };

  saveGame(updated);
  return updated;
}

/**
 * Admin rejects a question set with an explanation note
 */
export function rejectGame(gameId: string, reason: string): Game | null {
  const game = getGameById(gameId);
  if (!game) return null;

  const updated: Game = {
    ...game,
    visibility: 'private',
    rejectionReason: reason || 'Nội dung chưa đạt tiêu chuẩn kiểm duyệt.',
  };

  saveGame(updated);
  return updated;
}

/**
 * Get all games currently waiting for admin approval
 */
export function getPendingApprovalGames(): Game[] {
  return getAllGames().filter(g => g.visibility === 'pending_approval');
}

/**
 * Checks whether a game is visible to the specified user:
 * - Administrators can view all games (including private & pending approval).
 * - Authors/creators can view their own games (public, private, pending approval).
 * - Unauthenticated visitors and other members can ONLY view public games ('public') and website default games.
 * - Private ('private') and pending approval ('pending_approval') games are NEVER exposed to unauthenticated users or other users.
 */
export function isGameVisibleToUser(
  game: Game,
  user?: { id?: string; email?: string } | null,
  isAdmin: boolean = false
): boolean {
  if (isAdmin) return true;

  // If user is logged in and is the author of this game
  if (user) {
    const userEmail = (user.email || '').trim().toLowerCase();
    const userId = user.id;
    const authorEmail = (game.authorEmail || '').trim().toLowerCase();
    const authorId = game.authorId;

    const isAuthor = Boolean(
      (userEmail && authorEmail && userEmail === authorEmail) ||
      (userId && authorId && userId === authorId)
    );
    if (isAuthor) return true;
  }

  // Not author, not admin: Private and pending approval games are strictly forbidden
  if (game.visibility === 'private' || game.visibility === 'pending_approval') {
    return false;
  }

  // Allow public games, system default games, or built-in default games
  return Boolean(
    game.visibility === 'public' ||
    game.isSystemDefault ||
    DEFAULT_GAMES.some(d => d.id === game.id) ||
    (!game.visibility && !game.authorEmail && !game.authorId)
  );
}

/**
 * Get all public games (strictly excludes private and pending approval games)
 */
export function getPublicGames(): Game[] {
  return getAllGames().filter(g => isGameVisibleToUser(g, null, false));
}

/**
 * Get games owned by a specific teacher or user email
 */
export function getMyGames(userEmailOrId?: string): Game[] {
  if (!userEmailOrId) return [];
  const normalized = userEmailOrId.toLowerCase();
  return getAllGames().filter(g => 
    (g.authorEmail && g.authorEmail.toLowerCase() === normalized) ||
    (g.authorId && g.authorId === userEmailOrId)
  );
}

// ----------------------------------------------------
// ACTIVE ROOMS TRACKING FOR QUOTA ENFORCEMENT
// (Member: Max 2 rooms; Premium/Admin: Unlimited)
// ----------------------------------------------------
const ACTIVE_ROOMS_KEY = 'vuihoc_active_rooms_v1';

interface ActiveRoomEntry {
  roomCode: string;
  gameId: string;
  teacherEmail?: string;
  createdAt: number;
}

export function getActiveRooms(): ActiveRoomEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACTIVE_ROOMS_KEY);
    if (!raw) return [];
    const parsed: ActiveRoomEntry[] = JSON.parse(raw);
    // Auto-expire rooms older than 6 hours
    const now = Date.now();
    const valid = parsed.filter(r => now - r.createdAt < 6 * 60 * 60 * 1000);
    return valid;
  } catch {
    return [];
  }
}

export function getTeacherActiveRoomCount(teacherEmail?: string): number {
  if (!teacherEmail) return 0;
  const rooms = getActiveRooms();
  const normalized = teacherEmail.toLowerCase();
  return rooms.filter(r => r.teacherEmail && r.teacherEmail.toLowerCase() === normalized).length;
}

export function registerActiveRoom(roomCode: string, gameId: string, teacherEmail?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const rooms = getActiveRooms().filter(r => r.roomCode !== roomCode);
    rooms.push({
      roomCode,
      gameId,
      teacherEmail,
      createdAt: Date.now(),
    });
    localStorage.setItem(ACTIVE_ROOMS_KEY, JSON.stringify(rooms));
  } catch {}
}

export function closeActiveRoom(roomCode: string): void {
  if (typeof window === 'undefined') return;
  try {
    const rooms = getActiveRooms().filter(r => r.roomCode !== roomCode);
    localStorage.setItem(ACTIVE_ROOMS_KEY, JSON.stringify(rooms));
  } catch {}
}

